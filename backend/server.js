'use strict'

const express  = require('express')
const cors     = require('cors')
const crypto   = require('crypto')
const Database = require('better-sqlite3')
const path     = require('path')
const fs       = require('fs')
const { v4: uuidv4 } = require('uuid')
const multer   = require('multer')
const { extractFromUrl, extractFromText, extractFromPhoto } = require('./gemini')

// ─── Secrets & Environment ────────────────────────────────────────────────────

function getSecret(secretName, envVar, defaultValue = '') {
  const secretPath = path.join('/run/secrets', secretName)
  try {
    if (fs.existsSync(secretPath)) {
      const val = fs.readFileSync(secretPath, 'utf8').trim()
      if (val) return val
    }
  } catch {}
  return process.env[envVar]?.trim() || defaultValue
}

const API_KEY    = getSecret('recipe_api_key', 'API_KEY', 'dev-key')
const DB_PATH    = process.env.DB_PATH    || path.join(__dirname, 'data', 'recipe-hub.db')
const IMAGE_PATH = process.env.IMAGE_PATH || path.join(__dirname, 'data', 'images')
const PORT       = process.env.PORT       || 3000

// ─── Startup ─────────────────────────────────────────────────────────────────

console.log('\n=== Recipe Hub API ===')
console.log(`DB_PATH   : ${DB_PATH}`)
console.log(`IMAGE_PATH: ${IMAGE_PATH}`)
console.log(`API_KEY   : ${API_KEY.length} chars`)
console.log(`PORT      : ${PORT}\n`)

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
fs.mkdirSync(IMAGE_PATH, { recursive: true })

// ─── Database ─────────────────────────────────────────────────────────────────

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
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
`)

// Safe migrations for future columns
;[
  `ALTER TABLE recipes ADD COLUMN notes TEXT NOT NULL DEFAULT ''`,
].forEach(sql => { try { db.exec(sql) } catch {} })

// ─── Unit Conversion (mirrors frontend/src/lib/units.js) ──────────────────────

const CONVERSIONS = {
  g:      { toBase: v => v,           fromBase: v => v,           system: 'metric',   type: 'weight' },
  kg:     { toBase: v => v * 1000,    fromBase: v => v / 1000,    system: 'metric',   type: 'weight' },
  oz:     { toBase: v => v * 28.3495, fromBase: v => v / 28.3495, system: 'imperial', type: 'weight' },
  lb:     { toBase: v => v * 453.592, fromBase: v => v / 453.592, system: 'imperial', type: 'weight' },
  ml:     { toBase: v => v,           fromBase: v => v,           system: 'metric',   type: 'volume' },
  l:      { toBase: v => v * 1000,    fromBase: v => v / 1000,    system: 'metric',   type: 'volume' },
  tsp:    { toBase: v => v * 4.92892, fromBase: v => v / 4.92892, system: 'both',     type: 'volume' },
  tbsp:   { toBase: v => v * 14.7868, fromBase: v => v / 14.7868, system: 'both',     type: 'volume' },
  cup:    { toBase: v => v * 236.588, fromBase: v => v / 236.588, system: 'imperial', type: 'volume' },
  'fl oz':{ toBase: v => v * 29.5735, fromBase: v => v / 29.5735, system: 'imperial', type: 'volume' },
  qt:     { toBase: v => v * 946.353, fromBase: v => v / 946.353, system: 'imperial', type: 'volume' },
  '°c':   { system: 'metric',   type: 'temp' },
  '°f':   { system: 'imperial', type: 'temp' },
  cm:     { toBase: v => v,           fromBase: v => v,           system: 'metric',   type: 'length' },
  inch:   { toBase: v => v * 2.54,    fromBase: v => v / 2.54,    system: 'imperial', type: 'length' },
}

const TARGET_UNITS = {
  weight: { metric: 'g',    imperial: 'oz'    },
  volume: { metric: 'ml',   imperial: 'fl oz' },
  temp:   { metric: '°C',   imperial: '°F'    },
  length: { metric: 'cm',   imperial: 'inch'  },
}

function convertIngredient(amount, unit, targetSystem) {
  if (amount == null || !unit) return { amount, unit }
  const norm = unit.toLowerCase().trim()
  const conv = CONVERSIONS[norm]
  if (!conv || conv.system === 'both' || conv.system === targetSystem) return { amount, unit }

  if (conv.type === 'temp') {
    const converted = targetSystem === 'metric'
      ? (amount - 32) * 5 / 9
      : (amount * 9 / 5) + 32
    return { amount: Math.round(converted * 10) / 10, unit: TARGET_UNITS.temp[targetSystem] }
  }

  const targetUnit = TARGET_UNITS[conv.type]?.[targetSystem]
  if (!targetUnit) return { amount, unit }
  const targetConv = CONVERSIONS[targetUnit.toLowerCase()]
  if (!targetConv) return { amount, unit }

  const converted = targetConv.fromBase(conv.toBase(amount))
  return { amount: Math.round(converted * 1000) / 1000, unit: targetUnit }
}

// ─── Express App ─────────────────────────────────────────────────────────────

const app = express()
app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin (curl, Postman, same-origin), looknet.ca subdomains, and any pages.dev preview
    if (!origin || /^https:\/\/([^.]+\.)?looknet\.ca$/.test(origin) || /\.pages\.dev$/.test(origin)) {
      return cb(null, true)
    }
    cb(new Error('CORS: origin not allowed'))
  },
  allowedHeaders: ['Content-Type', 'x-api-key'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))
app.use(express.json({ limit: '10mb' }))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
})

// ─── Auth Middleware ──────────────────────────────────────────────────────────

function auth(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.key
  if (!key || !crypto.timingSafeEqual(Buffer.from(key), Buffer.from(API_KEY))) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// ─── Health ──────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }))

// ─── Images ──────────────────────────────────────────────────────────────────

app.get('/api/recipes/:id/image', auth, (req, res) => {
  const row = db.prepare('SELECT image_path FROM recipes WHERE id = ?').get(req.params.id)
  if (!row || !row.image_path) return res.status(404).json({ error: 'No image' })
  const full = path.join(IMAGE_PATH, row.image_path)
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'Image not found' })
  res.sendFile(full)
})

// ─── Settings ─────────────────────────────────────────────────────────────────

app.get('/api/settings', auth, (req, res) => {
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get()
  res.json(row)
})

app.put('/api/settings', auth, (req, res) => {
  const { preferred_unit_system, theme } = req.body
  db.prepare(`
    UPDATE settings SET preferred_unit_system = ?, theme = ?, updated_at = ?
    WHERE id = 1
  `).run(preferred_unit_system || 'metric', theme || 'warm', Date.now())
  res.json({ ok: true })
})

// ─── Tags ─────────────────────────────────────────────────────────────────────

app.get('/api/tags', auth, (req, res) => {
  const rows = db.prepare('SELECT tags FROM recipes').all()
  const counts = {}
  for (const row of rows) {
    const tags = JSON.parse(row.tags || '[]')
    for (const t of tags) counts[t] = (counts[t] || 0) + 1
  }
  const tags = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }))
  res.json({ tags })
})

// ─── Recipes CRUD ─────────────────────────────────────────────────────────────

app.get('/api/recipes', auth, (req, res) => {
  const { q, tag, limit = 100, offset = 0 } = req.query

  let rows = db.prepare('SELECT *, (SELECT COUNT(*) FROM ingredients WHERE recipe_id = recipes.id) as ingredient_count FROM recipes ORDER BY created_at DESC').all()

  if (q) {
    const lq = q.toLowerCase()
    rows = rows.filter(r =>
      r.title.toLowerCase().includes(lq) ||
      r.description.toLowerCase().includes(lq) ||
      JSON.parse(r.tags || '[]').some(t => t.toLowerCase().includes(lq))
    )
  }

  if (tag) {
    rows = rows.filter(r => JSON.parse(r.tags || '[]').includes(tag))
  }

  const total = rows.length
  rows = rows.slice(Number(offset), Number(offset) + Number(limit))

  res.json({
    recipes: rows.map(r => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      ingredient_count: r.ingredient_count,
    })),
    total,
  })
})

app.get('/api/recipes/:id', auth, (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id)
  if (!recipe) return res.status(404).json({ error: 'Not found' })
  const ingredients = db.prepare('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY sort_order').all(req.params.id)
  res.json({
    ...recipe,
    tags: JSON.parse(recipe.tags || '[]'),
    steps: JSON.parse(recipe.steps || '[]'),
    ingredients,
  })
})

function saveRecipe(id, data, ingredients) {
  const now = Date.now()
  const existing = db.prepare('SELECT id FROM recipes WHERE id = ?').get(id)

  if (existing) {
    db.prepare(`
      UPDATE recipes SET title=?, description=?, servings=?, prep_time=?, cook_time=?,
        source_url=?, source_type=?, image_path=?, tags=?, steps=?, updated_at=?
      WHERE id=?
    `).run(
      data.title, data.description || '', data.servings || 4,
      data.prep_time || null, data.cook_time || null,
      data.source_url || '', data.source_type || 'manual',
      data.image_path || '',
      JSON.stringify(data.tags || []), JSON.stringify(data.steps || []),
      now, id
    )
  } else {
    db.prepare(`
      INSERT INTO recipes (id, title, description, servings, prep_time, cook_time, source_url, source_type, image_path, tags, steps, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.title, data.description || '', data.servings || 4,
      data.prep_time || null, data.cook_time || null,
      data.source_url || '', data.source_type || 'manual',
      data.image_path || '',
      JSON.stringify(data.tags || []), JSON.stringify(data.steps || []),
      now, now
    )
  }

  if (ingredients !== undefined) {
    db.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(id)
    const ins = db.prepare('INSERT INTO ingredients (recipe_id, name, amount, unit, unit_system, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
    ingredients.forEach((ing, i) => {
      ins.run(id, ing.name || '', ing.amount ?? null, ing.unit || '', ing.unit_system || '', ing.notes || '', i)
    })
  }
}

app.post('/api/recipes', auth, (req, res) => {
  const { ingredients, ...data } = req.body
  if (!data.title) return res.status(400).json({ error: 'title required' })
  const id = uuidv4()
  saveRecipe(id, data, ingredients)
  res.status(201).json({ id })
})

app.put('/api/recipes/:id', auth, (req, res) => {
  const recipe = db.prepare('SELECT id FROM recipes WHERE id = ?').get(req.params.id)
  if (!recipe) return res.status(404).json({ error: 'Not found' })
  const { ingredients, ...data } = req.body
  saveRecipe(req.params.id, data, ingredients)
  res.json({ ok: true })
})

app.delete('/api/recipes/:id', auth, (req, res) => {
  const recipe = db.prepare('SELECT image_path FROM recipes WHERE id = ?').get(req.params.id)
  if (!recipe) return res.status(404).json({ error: 'Not found' })
  if (recipe.image_path) {
    try { fs.unlinkSync(path.join(IMAGE_PATH, recipe.image_path)) } catch {}
  }
  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ─── Ingest ───────────────────────────────────────────────────────────────────

app.post('/api/ingest/url', auth, async (req, res) => {
  const { url, preferredUnit = 'metric' } = req.body
  if (!url) return res.status(400).json({ error: 'url required' })
  try {
    const draft = await extractFromUrl(url, preferredUnit)
    res.json(draft)
  } catch (e) {
    console.error('[ingest/url]', e.message)
    res.status(422).json({ error: 'extraction_failed', message: e.message })
  }
})

app.post('/api/ingest/text', auth, async (req, res) => {
  const { text, preferredUnit = 'metric' } = req.body
  if (!text) return res.status(400).json({ error: 'text required' })
  try {
    const draft = await extractFromText(text, preferredUnit)
    res.json(draft)
  } catch (e) {
    console.error('[ingest/text]', e.message)
    res.status(422).json({ error: 'extraction_failed', message: e.message })
  }
})

app.post('/api/ingest/photo', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' })
  const preferredUnit = req.body.preferredUnit || 'metric'
  try {
    const draft = await extractFromPhoto(req.file.buffer, req.file.mimetype, preferredUnit)
    res.json(draft)
  } catch (e) {
    console.error('[ingest/photo]', e.message)
    res.status(422).json({ error: 'extraction_failed', message: e.message })
  }
})

app.post('/api/ingest/confirm', auth, async (req, res) => {
  const { ingredients, image_buffer, image_mime, ...data } = req.body
  if (!data.title) return res.status(400).json({ error: 'title required' })

  const id = uuidv4()
  let imagePath = ''

  // If a base64 image was provided (e.g. from photo ingestion)
  if (image_buffer && image_mime) {
    const ext = image_mime.split('/')[1] || 'jpg'
    const filename = `${id}.${ext}`
    fs.writeFileSync(path.join(IMAGE_PATH, filename), Buffer.from(image_buffer, 'base64'))
    imagePath = filename
  }

  saveRecipe(id, { ...data, image_path: imagePath }, ingredients)
  res.status(201).json({ id })
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function convertDraftIngredients(draft, targetSystem) {
  const ingredients = (draft.ingredients || []).map(ing => {
    const { amount, unit } = convertIngredient(
      typeof ing.amount === 'string' ? parseFloat(ing.amount) : ing.amount,
      ing.unit,
      targetSystem
    )
    const norm = unit?.toLowerCase().trim() || ''
    const conv = CONVERSIONS[norm]
    return {
      ...ing,
      amount,
      unit,
      unit_system: conv?.system === 'both' ? '' : (conv?.system || ''),
    }
  })
  return { ...draft, ingredients }
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`Recipe Hub API listening on :${PORT}`))
