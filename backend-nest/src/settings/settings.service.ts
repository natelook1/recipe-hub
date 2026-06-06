import { Injectable, Inject } from '@nestjs/common';
import Database from 'better-sqlite3';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class SettingsService {
  constructor(@Inject(DATABASE_TOKEN) private db: Database.Database) {}

  get() {
    return this.db.prepare('SELECT * FROM settings WHERE id = 1').get();
  }

  update(body: any) {
    const { preferred_unit_system, theme } = body;
    this.db.prepare(`
      UPDATE settings SET preferred_unit_system = ?, theme = ?, updated_at = ?
      WHERE id = 1
    `).run(preferred_unit_system || 'metric', theme || 'warm', Date.now());
    return { ok: true };
  }
}
