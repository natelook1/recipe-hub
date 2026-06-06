import { Module, Global } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as path from 'path';

export const DATABASE_TOKEN = 'DATABASE';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/recipes.db');

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS recipes (
    id           TEXT    PRIMARY KEY,
    title        TEXT    NOT NULL,
    description  TEXT    NOT NULL DEFAULT '',
    servings     INTEGER NOT NULL DEFAULT 4,
    prep_time    INTEGER,
    cook_time    INTEGER,
    source_url   TEXT    NOT NULL DEFAULT '',
    source_type  TEXT    NOT NULL DEFAULT 'manual',
    image_path   TEXT    NOT NULL DEFAULT '',
    tags         TEXT    NOT NULL DEFAULT '[]',
    steps        TEXT    NOT NULL DEFAULT '[]',
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes (created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_recipes_title      ON recipes (title COLLATE NOCASE);

  CREATE TABLE IF NOT EXISTS ingredients (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id   TEXT    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    amount      REAL,
    unit        TEXT    NOT NULL DEFAULT '',
    unit_system TEXT    NOT NULL DEFAULT '',
    notes       TEXT    NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_ingredients_recipe ON ingredients (recipe_id, sort_order);

  CREATE TABLE IF NOT EXISTS settings (
    id                    INTEGER PRIMARY KEY DEFAULT 1,
    preferred_unit_system TEXT NOT NULL DEFAULT 'metric',
    theme                 TEXT NOT NULL DEFAULT 'warm',
    updated_at            INTEGER NOT NULL DEFAULT 0
  );

  INSERT OR IGNORE INTO settings (id, preferred_unit_system, theme, updated_at)
  VALUES (1, 'metric', 'warm', 0);
`;

const MIGRATIONS = [
  `ALTER TABLE recipes ADD COLUMN notes TEXT NOT NULL DEFAULT ''`,
];

function createDatabase(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  MIGRATIONS.forEach(sql => { try { db.exec(sql); } catch {} });
  return db;
}

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_TOKEN,
      useValue: createDatabase(),
    },
  ],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}
