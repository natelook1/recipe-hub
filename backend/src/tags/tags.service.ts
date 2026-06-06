import { Injectable, Inject } from '@nestjs/common';
import Database from 'better-sqlite3';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class TagsService {
  constructor(@Inject(DATABASE_TOKEN) private db: Database.Database) {}

  findAll() {
    const rows = this.db.prepare('SELECT tags FROM recipes').all() as any[];
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const tags: string[] = JSON.parse(row.tags || '[]');
      for (const t of tags) counts[t] = (counts[t] || 0) + 1;
    }
    const tags = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
    return { tags };
  }
}
