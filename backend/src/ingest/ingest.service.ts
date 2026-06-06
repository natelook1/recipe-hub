import { Injectable, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { GeminiService } from '../gemini/gemini.service';
import { RecipesService } from '../recipes/recipes.service';

const IMAGE_PATH = process.env.IMAGE_PATH || path.join(__dirname, '../../data/images');

@Injectable()
export class IngestService {
  constructor(
    private gemini: GeminiService,
    private recipes: RecipesService,
  ) {}

  async fromUrl(url: string, preferredUnit = 'metric') {
    if (!url) throw new BadRequestException('url required');
    try {
      return await this.gemini.extractFromUrl(url, preferredUnit);
    } catch (e: any) {
      console.error('[ingest/url]', e.message);
      throw new UnprocessableEntityException({ error: 'extraction_failed', message: e.message });
    }
  }

  async fromText(text: string, preferredUnit = 'metric') {
    if (!text) throw new BadRequestException('text required');
    try {
      return await this.gemini.extractFromText(text, preferredUnit);
    } catch (e: any) {
      console.error('[ingest/text]', e.message);
      throw new UnprocessableEntityException({ error: 'extraction_failed', message: e.message });
    }
  }

  async fromPhoto(file: Express.Multer.File, preferredUnit = 'metric') {
    if (!file) throw new BadRequestException('file required');
    try {
      return await this.gemini.extractFromPhoto(file.buffer, file.mimetype, preferredUnit);
    } catch (e: any) {
      console.error('[ingest/photo]', e.message);
      throw new UnprocessableEntityException({ error: 'extraction_failed', message: e.message });
    }
  }

  async confirm(body: any) {
    const { ingredients, image_buffer, image_mime, source_image_url, ...data } = body;
    if (!data.title) throw new BadRequestException('title required');

    const id = uuidv4();
    let imagePath = '';

    fs.mkdirSync(IMAGE_PATH, { recursive: true });

    if (image_buffer && image_mime) {
      const ext = image_mime.split('/')[1] || 'jpg';
      const filename = `${id}.${ext}`;
      fs.writeFileSync(path.join(IMAGE_PATH, filename), Buffer.from(image_buffer, 'base64'));
      imagePath = filename;
    } else if (source_image_url) {
      try {
        const imgRes = await fetch(source_image_url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeHub/1.0)' } });
        if (imgRes.ok) {
          const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
          const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
          const filename = `${id}.${ext}`;
          const buf = Buffer.from(await imgRes.arrayBuffer());
          fs.writeFileSync(path.join(IMAGE_PATH, filename), buf);
          imagePath = filename;
        }
      } catch (e: any) {
        console.warn('[ingest/confirm] Failed to fetch source image:', e.message);
      }
    }

    this.recipes.saveRecipe(id, { ...data, image_path: imagePath }, ingredients);
    return { id };
  }
}
