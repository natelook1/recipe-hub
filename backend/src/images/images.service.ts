import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { DATABASE_TOKEN } from '../database/database.module';

const IMAGE_PATH = process.env.IMAGE_PATH || path.join(__dirname, '../../data/images');

@Injectable()
export class ImagesService {
  constructor(@Inject(DATABASE_TOKEN) private db: Database.Database) {}

  getImagePath(recipeId: string): string {
    const row = this.db.prepare('SELECT image_path FROM recipes WHERE id = ?').get(recipeId) as any;
    if (!row || !row.image_path) throw new NotFoundException('No image');
    const full = path.join(IMAGE_PATH, row.image_path);
    if (!fs.existsSync(full)) throw new NotFoundException('Image not found');
    return full;
  }

  saveImage(recipeId: string, file: Express.Multer.File) {
    const recipe = this.db.prepare('SELECT id, image_path FROM recipes WHERE id = ?').get(recipeId) as any;
    if (!recipe) throw new NotFoundException('Not found');
    if (!file) throw new BadRequestException('file required');

    if (recipe.image_path) {
      try { fs.unlinkSync(path.join(IMAGE_PATH, recipe.image_path)); } catch {}
    }

    fs.mkdirSync(IMAGE_PATH, { recursive: true });
    const ext = file.mimetype.split('/')[1] || 'jpg';
    const filename = `${recipe.id}.${ext}`;
    fs.writeFileSync(path.join(IMAGE_PATH, filename), file.buffer);

    this.db.prepare('UPDATE recipes SET image_path = ?, updated_at = ? WHERE id = ?')
      .run(filename, Date.now(), recipe.id);

    return { ok: true, image_path: filename };
  }
}
