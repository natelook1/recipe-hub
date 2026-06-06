import { Injectable, Inject, BadRequestException, UnprocessableEntityException, InternalServerErrorException } from '@nestjs/common';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { DATABASE_TOKEN } from '../database/database.module';
import { GeminiService } from '../gemini/gemini.service';
import { RecipesService } from '../recipes/recipes.service';

const IMAGE_PATH = process.env.IMAGE_PATH || path.join(__dirname, '../../data/images');
const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeHub/1.0; +https://recipes.looknet.ca)' };
const SUGGESTIONS_TTL = 2 * 60 * 60 * 1000;
const ROUNDUP_RE = /\b(\d+\+?\s+(recipes?|ideas?|ways?|dishes?|meals?|tips?|things?)|best\s+\d+|round.?up|collection|weekly\s+menu|meal\s+plan|what\s+to\s+cook)\b/i;

const SUGGESTION_SOURCES = [
  { name: 'Delish',             url: 'https://www.delish.com/rss/all.xml/' },
  { name: 'Bon Appetit',        url: 'https://www.bonappetit.com/feed/rss' },
  { name: 'Budget Bytes',       url: 'https://www.budgetbytes.com/feed/' },
  { name: 'Damn Delicious',     url: 'https://damndelicious.net/feed/' },
  { name: 'Half Baked Harvest', url: 'https://www.halfbakedharvest.com/feed/' },
  { name: 'Pinch of Yum',       url: 'https://pinchofyum.com/feed' },
  { name: "Sally's Baking",     url: 'https://sallysbakingaddiction.com/feed/' },
  { name: 'RecipeTin Eats',     url: 'https://www.recipetineats.com/feed/' },
];

@Injectable()
export class SuggestionsService {
  private cache: any[] | null = null;
  private cachedAt = 0;

  constructor(
    @Inject(DATABASE_TOKEN) private db: Database.Database,
    private gemini: GeminiService,
    private recipes: RecipesService,
  ) {}

  private decodeHtmlEntities(str: string) {
    return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }

  private cleanImageUrl(url: string | null): string | null {
    if (!url) return null;
    return this.decodeHtmlEntities(url.trim()).replace(/-\d+x\d+(\.\w+)$/, '$1');
  }

  private parseRssItems(xml: string, sourceName: string) {
    const items: any[] = [];
    const rx = /<item>([\s\S]*?)<\/item>/g;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(xml)) !== null) {
      const block = m[1];
      const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
      const link  = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim()
                 || block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1]?.trim();
      const rawImage = block.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i)?.[1]
                    || block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i)?.[1];
      const image = this.cleanImageUrl(rawImage || null);
      const rawDesc = block.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '';
      const desc = rawDesc.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim().slice(0, 200);
      const cats = [...block.matchAll(/<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\?\]>)?<\/category>/gi)]
        .map(c => c[1].toLowerCase().trim());
      if (title && link && !ROUNDUP_RE.test(title)) {
        items.push({ title, link, image, description: desc, categories: cats, source: sourceName });
      }
    }
    return items;
  }

  private async fetchSuggestions(userTags: string[]) {
    const results: any[] = [];
    await Promise.allSettled(
      SUGGESTION_SOURCES.map(async ({ name, url }) => {
        try {
          const r = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(8000) });
          if (!r.ok) return;
          const xml = await r.text();
          results.push(...this.parseRssItems(xml, name));
        } catch {}
      })
    );
    const tagSet = new Set(userTags.map(t => t.toLowerCase()));
    const scored = results.map(item => {
      const text = (item.title + ' ' + item.categories.join(' ')).toLowerCase();
      let score = 0;
      for (const tag of tagSet) if (text.includes(tag)) score++;
      return { ...item, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const seen = new Set<string>();
    return scored.filter(item => { if (seen.has(item.link)) return false; seen.add(item.link); return true; });
  }

  async getSuggestions() {
    try {
      const rows = this.db.prepare('SELECT tags FROM recipes ORDER BY created_at DESC LIMIT 50').all() as any[];
      const tagFreq: Record<string, number> = {};
      for (const row of rows) {
        const tags: string[] = JSON.parse(row.tags || '[]');
        for (const tag of tags) tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      }
      const userTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 15).map(e => e[0]);

      if (!this.cache || Date.now() - this.cachedAt > SUGGESTIONS_TTL) {
        this.cache = await this.fetchSuggestions(userTags);
        this.cachedAt = Date.now();
      }

      const tagSet = new Set(userTags.map(t => t.toLowerCase()));
      const rescored = this.cache.map(item => {
        const text = (item.title + ' ' + item.categories.join(' ')).toLowerCase();
        let score = 0;
        for (const tag of tagSet) if (text.includes(tag)) score++;
        return { ...item, score };
      }).sort((a, b) => b.score - a.score);

      return { suggestions: rescored, userTags };
    } catch (e: any) {
      console.error('[suggestions]', e.message);
      throw new InternalServerErrorException('failed to fetch suggestions');
    }
  }

  async extract(url: string) {
    if (!url) throw new BadRequestException('url required');
    let preferredUnit = 'metric';
    try {
      const row = this.db.prepare('SELECT preferred_unit_system FROM settings WHERE id = 1').get() as any;
      preferredUnit = row?.preferred_unit_system || 'metric';
    } catch {}
    try {
      return await this.gemini.extractFromUrl(url, preferredUnit);
    } catch (e: any) {
      console.error('[suggestions/extract]', e.message);
      throw new UnprocessableEntityException({ error: 'extraction_failed', message: e.message });
    }
  }

  async save(body: any) {
    const { draft, source_url, source_image_url } = body;
    if (!draft?.title) throw new BadRequestException('draft with title required');
    const id = uuidv4();
    let imagePath = '';
    fs.mkdirSync(IMAGE_PATH, { recursive: true });
    if (source_image_url) {
      try {
        const imgRes = await fetch(source_image_url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(10000) });
        if (imgRes.ok) {
          const cType = imgRes.headers.get('content-type') || 'image/jpeg';
          const ext = cType.split('/')[1]?.split(';')[0] || 'jpg';
          const buf = Buffer.from(await imgRes.arrayBuffer());
          const fname = `${id}.${ext}`;
          fs.writeFileSync(path.join(IMAGE_PATH, fname), buf);
          imagePath = fname;
        }
      } catch {}
    }
    this.recipes.saveRecipe(id, { ...draft, image_path: imagePath, source_url: source_url || '', source_type: 'url' }, draft.ingredients || []);
    return { id };
  }
}
