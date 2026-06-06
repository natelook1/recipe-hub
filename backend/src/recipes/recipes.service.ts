import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { DATABASE_TOKEN } from '../database/database.module';

const IMAGE_PATH = process.env.IMAGE_PATH || path.join(__dirname, '../../data/images');

@Injectable()
export class RecipesService {
  constructor(@Inject(DATABASE_TOKEN) private db: Database.Database) {}

  findAll(q?: string, tag?: string, limit = 100, offset = 0) {
    let rows: any[] = this.db.prepare(
      'SELECT *, (SELECT COUNT(*) FROM ingredients WHERE recipe_id = recipes.id) as ingredient_count FROM recipes ORDER BY created_at DESC'
    ).all();

    if (q) {
      const lq = q.toLowerCase();
      rows = rows.filter(r =>
        r.title.toLowerCase().includes(lq) ||
        r.description.toLowerCase().includes(lq) ||
        JSON.parse(r.tags || '[]').some((t: string) => t.toLowerCase().includes(lq))
      );
    }

    if (tag) {
      rows = rows.filter(r => JSON.parse(r.tags || '[]').includes(tag));
    }

    const total = rows.length;
    rows = rows.slice(Number(offset), Number(offset) + Number(limit));

    return {
      recipes: rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') })),
      total,
    };
  }

  findOne(id: string) {
    const recipe = this.db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as any;
    if (!recipe) throw new NotFoundException('Not found');
    const ingredients = this.db.prepare('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY sort_order').all(id);
    return {
      ...recipe,
      tags: JSON.parse(recipe.tags || '[]'),
      steps: JSON.parse(recipe.steps || '[]'),
      ingredients,
    };
  }

  create(body: any) {
    const { ingredients, ...data } = body;
    if (!data.title) throw new BadRequestException('title required');
    const id = uuidv4();
    this.saveRecipe(id, data, ingredients);
    return { id };
  }

  update(id: string, body: any) {
    const existing = this.db.prepare('SELECT id FROM recipes WHERE id = ?').get(id);
    if (!existing) throw new NotFoundException('Not found');
    const { ingredients, ...data } = body;
    this.saveRecipe(id, data, ingredients);
    return { ok: true };
  }

  remove(id: string) {
    const recipe = this.db.prepare('SELECT image_path FROM recipes WHERE id = ?').get(id) as any;
    if (!recipe) throw new NotFoundException('Not found');
    if (recipe.image_path) {
      try { fs.unlinkSync(path.join(IMAGE_PATH, recipe.image_path)); } catch {}
    }
    this.db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
    return { ok: true };
  }

  saveRecipe(id: string, data: any, ingredients?: any[]) {
    const now = Date.now();
    const existing = this.db.prepare('SELECT id FROM recipes WHERE id = ?').get(id);

    if (existing) {
      this.db.prepare(`
        UPDATE recipes SET title=?, description=?, servings=?, prep_time=?, cook_time=?,
          source_url=?, source_type=?, image_path=?, tags=?, steps=?, notes=?, updated_at=?
        WHERE id=?
      `).run(
        data.title, data.description || '', data.servings || 4,
        data.prep_time || null, data.cook_time || null,
        data.source_url || '', data.source_type || 'manual',
        data.image_path || '',
        JSON.stringify(data.tags || []), JSON.stringify(data.steps || []),
        data.notes || '', now, id
      );
    } else {
      this.db.prepare(`
        INSERT INTO recipes (id, title, description, servings, prep_time, cook_time, source_url, source_type, image_path, tags, steps, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, data.title, data.description || '', data.servings || 4,
        data.prep_time || null, data.cook_time || null,
        data.source_url || '', data.source_type || 'manual',
        data.image_path || '',
        JSON.stringify(data.tags || []), JSON.stringify(data.steps || []),
        data.notes || '', now, now
      );
    }

    if (ingredients !== undefined) {
      this.db.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(id);
      const ins = this.db.prepare('INSERT INTO ingredients (recipe_id, name, amount, unit, unit_system, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
      ingredients.forEach((ing, i) => {
        ins.run(id, ing.name || '', ing.amount ?? null, ing.unit || '', ing.unit_system || '', ing.notes || '', i);
      });
    }
  }
}
