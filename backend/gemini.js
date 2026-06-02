'use strict'

const { GoogleGenerativeAI } = require('@google/generative-ai')
const fs   = require('fs')
const path = require('path')

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

const GEMINI_API_KEY = getSecret('gemini_api_key', 'GEMINI_API_KEY', '')
const genai = new GoogleGenerativeAI(GEMINI_API_KEY)

// ─── Conversion tables (same source of truth as server.js) ───────────────────

const UNIT_TO_ML = {
  ml: 1, l: 1000, cl: 10, dl: 100,
  tsp: 4.92892, tbsp: 14.7868, cup: 236.588,
  'fl oz': 29.5735, pt: 473.176, qt: 946.353, gal: 3785.41,
  'uk tsp': 5.91939, 'uk tbsp': 17.7582, 'uk cup': 284.131,
  'au tbsp': 20, drop: 0.0616115, dash: 0.616115, pinch: 0.308058,
}

const UNIT_TO_G = {
  g: 1, kg: 1000, mg: 0.001,
  oz: 28.3495, lb: 453.592,
}

// g per cup for common baking ingredients
const DENSITY_G_PER_CUP = {
  'all-purpose flour': 120, 'bread flour': 120, 'cake flour': 100,
  'whole wheat flour': 120, 'self-raising flour': 120, 'rye flour': 102,
  'almond flour': 96, 'coconut flour': 112, 'oat flour': 92,
  'rice flour': 158, 'cornstarch': 128, 'cornflour': 128,
  'semolina': 167, 'spelt flour': 100,
  'white sugar': 200, 'granulated sugar': 200, 'caster sugar': 200,
  'superfine sugar': 200, 'icing sugar': 120, 'powdered sugar': 120,
  'confectioners sugar': 120, 'brown sugar': 213, 'light brown sugar': 213,
  'dark brown sugar': 213, 'raw sugar': 200, 'coconut sugar': 180,
  'butter': 227, 'unsalted butter': 227, 'salted butter': 227,
  'margarine': 227, 'shortening': 190, 'lard': 205,
  'vegetable oil': 218, 'olive oil': 216, 'coconut oil': 218,
  'rolled oats': 90, 'oats': 90, 'quick oats': 85,
  'breadcrumbs': 108, 'panko': 54, 'desiccated coconut': 75,
  'ground almonds': 96, 'chopped nuts': 114, 'chocolate chips': 170,
  'cocoa powder': 85, 'baking powder': 192, 'baking soda': 230,
  'salt': 273, 'fine salt': 273, 'kosher salt': 144,
  'rice': 185, 'lentils': 192, 'dried beans': 190,
  'peanut butter': 258, 'cream cheese': 232, 'ricotta': 246,
  'honey': 340, 'maple syrup': 322, 'golden syrup': 340,
  'molasses': 328, 'corn syrup': 328, 'agave': 333,
  'milk': 244, 'whole milk': 244, 'buttermilk': 245,
  'cream': 238, 'heavy cream': 238, 'whipping cream': 238,
  'sour cream': 230, 'yogurt': 245, 'water': 237,
}

// ─── Tool implementations ─────────────────────────────────────────────────────

function toolConvertUnit(amount, fromUnit, toUnit) {
  const f = fromUnit.toLowerCase().trim()
  const t = toUnit.toLowerCase().trim()

  // weight ↔ weight
  if (UNIT_TO_G[f] && UNIT_TO_G[t]) {
    const grams = amount * UNIT_TO_G[f]
    return { amount: Math.round((grams / UNIT_TO_G[t]) * 10000) / 10000, unit: toUnit }
  }

  // volume ↔ volume
  if (UNIT_TO_ML[f] && UNIT_TO_ML[t]) {
    const ml = amount * UNIT_TO_ML[f]
    return { amount: Math.round((ml / UNIT_TO_ML[t]) * 10000) / 10000, unit: toUnit }
  }

  // temperature
  if ((f === '°c' || f === 'c') && (t === '°f' || t === 'f')) {
    return { amount: Math.round((amount * 9 / 5 + 32) * 10) / 10, unit: '°F' }
  }
  if ((f === '°f' || f === 'f') && (t === '°c' || t === 'c')) {
    return { amount: Math.round(((amount - 32) * 5 / 9) * 10) / 10, unit: '°C' }
  }

  return { error: `Cannot convert ${fromUnit} to ${toUnit} — different measurement types` }
}

function toolConvertByIngredient(amount, fromUnit, toUnit, ingredientName) {
  const f = fromUnit.toLowerCase().trim()
  const t = toUnit.toLowerCase().trim()
  const ing = ingredientName.toLowerCase().trim()

  const gPerCup = DENSITY_G_PER_CUP[ing]
  if (!gPerCup) {
    return { error: `Unknown ingredient "${ingredientName}" — use convert_unit for same-type conversion instead` }
  }

  const gPerMl = gPerCup / 236.588

  const fromIsWeight  = !!UNIT_TO_G[f]
  const fromIsVolume  = !!UNIT_TO_ML[f]
  const toIsWeight    = !!UNIT_TO_G[t]
  const toIsVolume    = !!UNIT_TO_ML[t]

  if (fromIsWeight && toIsVolume) {
    const grams = amount * UNIT_TO_G[f]
    const ml    = grams / gPerMl
    return { amount: Math.round((ml / UNIT_TO_ML[t]) * 10000) / 10000, unit: toUnit }
  }

  if (fromIsVolume && toIsWeight) {
    const ml    = amount * UNIT_TO_ML[f]
    const grams = ml * gPerMl
    return { amount: Math.round((grams / UNIT_TO_G[t]) * 10000) / 10000, unit: toUnit }
  }

  // Same type — fall back to direct conversion
  return toolConvertUnit(amount, fromUnit, toUnit)
}

// ─── Gemini tool declarations ─────────────────────────────────────────────────

const TOOLS = [{
  functionDeclarations: [
    {
      name: 'convert_unit',
      description: 'Convert between same-type units: weight↔weight (g,kg,oz,lb) or volume↔volume (ml,l,tsp,tbsp,cup,fl oz,pt,qt) or temperature (°C↔°F). Does NOT cross between weight and volume — use convert_by_ingredient for that.',
      parameters: {
        type: 'OBJECT',
        properties: {
          amount:    { type: 'NUMBER',  description: 'The numeric quantity to convert' },
          from_unit: { type: 'STRING',  description: 'Source unit (e.g. "cup", "oz", "°F")' },
          to_unit:   { type: 'STRING',  description: 'Target unit (e.g. "ml", "g", "°C")' },
        },
        required: ['amount', 'from_unit', 'to_unit'],
      },
    },
    {
      name: 'convert_by_ingredient',
      description: 'Convert between weight and volume for a specific ingredient using its density (e.g. "2 cups flour" → grams, "227g butter" → cups). Required whenever crossing between weight and volume.',
      parameters: {
        type: 'OBJECT',
        properties: {
          amount:          { type: 'NUMBER', description: 'The numeric quantity to convert' },
          from_unit:       { type: 'STRING', description: 'Source unit' },
          to_unit:         { type: 'STRING', description: 'Target unit' },
          ingredient_name: { type: 'STRING', description: 'Ingredient name (e.g. "all-purpose flour", "butter", "brown sugar")' },
        },
        required: ['amount', 'from_unit', 'to_unit', 'ingredient_name'],
      },
    },
  ],
}]

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(preferredSystem) {
  const targetWeight = preferredSystem === 'metric' ? 'g'   : 'oz'
  const targetVolume = preferredSystem === 'metric' ? 'ml'  : 'cup'
  const targetTemp   = preferredSystem === 'metric' ? '°C'  : '°F'

  return `
You are a recipe extraction assistant. Extract the recipe from the provided content and return ONLY valid JSON — no markdown, no code fences, no extra text.

Output schema:
{
  "title": string,
  "description": string,
  "servings": number,
  "prep_time": number|null,
  "cook_time": number|null,
  "tags": string[],
  "ingredients": [{"name": string, "amount": number|null, "unit": string, "notes": string}],
  "steps": string[],
  "source_notes": string
}

UNIT CONVERSION — you have two tools available:
- convert_unit: same-type conversions (weight↔weight, volume↔volume, temperature)
- convert_by_ingredient: weight↔volume conversions using ingredient density (ALWAYS use this when crossing between weight and volume)

Convert ALL ingredients to the preferred system: weight → ${targetWeight}, volume → ${targetVolume}, temperature → ${targetTemp}.

RULES:
- For each ingredient, use the appropriate tool to convert to the preferred unit.
- tsp and tbsp: keep as-is (universally understood, do not convert).
- Counts with no unit (eggs, cloves, sheets): amount is the count, unit is "".
- "to taste", "a handful", unquantified: amount is null.
- Convert fraction strings: "1/2" → 0.5, "¾" → 0.75, "1 1/2" → 1.5.
- steps: one complete action per step, preserve temperatures in ${targetTemp}.
- tags: 5–10 lowercase tags — cuisine, meal type, main ingredients, dietary notes.
- Missing fields: null for numbers, "" for strings, [] for arrays.
`.trim()
}

// ─── Multi-turn function calling loop ────────────────────────────────────────

async function runWithTools(model, contents) {
  const MAX_TURNS = 20  // safety cap on tool call rounds
  let turn = 0

  while (turn++ < MAX_TURNS) {
    const result = await model.generateContent({ contents, tools: TOOLS })
    const response = result.response
    const candidate = response.candidates?.[0]
    if (!candidate) throw new Error('No candidates returned from Gemini')

    const parts = candidate.content?.parts ?? []

    // Check if any part is a function call
    const fnCalls = parts.filter(p => p.functionCall)

    if (fnCalls.length === 0) {
      // No more tool calls — extract the text response
      const text = parts.map(p => p.text ?? '').join('')
      return parseGeminiResponse(text)
    }

    // Add model's response to history
    contents.push({ role: 'model', parts })

    // Execute all tool calls and build function response parts
    const responseParts = fnCalls.map(part => {
      const { name, args } = part.functionCall
      let result

      if (name === 'convert_unit') {
        result = toolConvertUnit(args.amount, args.from_unit, args.to_unit)
      } else if (name === 'convert_by_ingredient') {
        result = toolConvertByIngredient(args.amount, args.from_unit, args.to_unit, args.ingredient_name)
      } else {
        result = { error: `Unknown tool: ${name}` }
      }

      console.log(`[Tool] ${name}(${JSON.stringify(args)}) → ${JSON.stringify(result)}`)

      return {
        functionResponse: {
          name,
          response: { result },
        },
      }
    })

    // Add tool results to history and continue
    contents.push({ role: 'user', parts: responseParts })
  }

  throw new Error('Gemini tool-call loop exceeded max turns')
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseGeminiResponse(text) {
  if (!text?.trim()) throw new Error('Empty response from Gemini')
  try { return JSON.parse(text.trim()) } catch {}
  const stripped = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim()
  try { return JSON.parse(stripped) } catch {}
  const match = text.match(/\{[\s\S]*\}/)
  if (match) { try { return JSON.parse(match[0]) } catch {} }
  throw new Error('Could not parse Gemini response as JSON')
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function extractJsonLd(html) {
  const match = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
  if (!match) return null
  try { return JSON.stringify(JSON.parse(match[1])) } catch { return null }
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function extractFromUrl(url, preferredSystem = 'metric') {
  console.log(`[Gemini] extractFromUrl: ${url} (${preferredSystem})`)
  const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const res  = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeHub/1.0)' } })
  const html = await res.text()

  const jsonLd = extractJsonLd(html)
  const text   = htmlToText(html).slice(0, 12000)

  const userContent = jsonLd
    ? `Structured data (prefer this):\n${jsonLd.slice(0, 4000)}\n\nPage text (supplement only):\n${text}`
    : `Page text:\n${text}`

  const contents = [
    { role: 'user', parts: [{ text: buildSystemPrompt(preferredSystem) + '\n\n' + userContent }] },
  ]

  return runWithTools(model, contents)
}

async function extractFromText(text, preferredSystem = 'metric') {
  console.log(`[Gemini] extractFromText: ${text.length} chars (${preferredSystem})`)
  const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const contents = [
    { role: 'user', parts: [{ text: buildSystemPrompt(preferredSystem) + '\n\nRecipe text:\n' + text.slice(0, 12000) }] },
  ]

  return runWithTools(model, contents)
}

async function extractFromPhoto(imageBuffer, mimeType, preferredSystem = 'metric') {
  console.log(`[Gemini] extractFromPhoto: ${mimeType}, ${imageBuffer.length} bytes (${preferredSystem})`)
  const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const contents = [{
    role: 'user',
    parts: [
      { text: buildSystemPrompt(preferredSystem) + '\n\nExtract the recipe from this image.' },
      { inlineData: { data: imageBuffer.toString('base64'), mimeType } },
    ],
  }]

  return runWithTools(model, contents)
}

module.exports = { extractFromUrl, extractFromText, extractFromPhoto }
