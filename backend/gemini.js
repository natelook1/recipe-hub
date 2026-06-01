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
const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' })

const SCHEMA_PROMPT = `
Extract the recipe and return ONLY valid JSON — no markdown, no code fences, no extra text.

Schema:
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

Rules:
- Normalize units: g, kg, oz, lb, ml, l, tsp, tbsp, cup, fl oz, qt, °C, °F, cm, inch
- Convert fraction strings to decimals: "1/2" → 0.5, "¾" → 0.75
- amount is null for "to taste" or unquantified ingredients
- tags: cuisine type, meal type, dietary info, main ingredient (5-10 tags, lowercase)
- steps: complete sentences, one action per step
- Missing fields: null for numbers, "" for strings, [] for arrays
`.trim()

function parseGeminiResponse(text) {
  // Try direct parse first
  try { return JSON.parse(text.trim()) } catch {}

  // Strip markdown code fences
  const stripped = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim()
  try { return JSON.parse(stripped) } catch {}

  // Extract first {...} block
  const match = text.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch {}
  }

  throw new Error('Could not parse Gemini response as JSON')
}

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

async function extractFromUrl(url) {
  console.log(`[Gemini] extractFromUrl: ${url}`)
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeHub/1.0)' } })
  const html = await res.text()

  const jsonLd = extractJsonLd(html)
  const text   = htmlToText(html).slice(0, 8000)

  const prompt = jsonLd
    ? `${SCHEMA_PROMPT}\n\nStructured data hint:\n${jsonLd.slice(0, 2000)}\n\nPage text:\n${text}`
    : `${SCHEMA_PROMPT}\n\nPage text:\n${text}`

  const result = await model.generateContent(prompt)
  return parseGeminiResponse(result.response.text())
}

async function extractFromText(text) {
  console.log(`[Gemini] extractFromText: ${text.length} chars`)
  const prompt = `${SCHEMA_PROMPT}\n\nRecipe text:\n${text.slice(0, 8000)}`
  const result = await model.generateContent(prompt)
  return parseGeminiResponse(result.response.text())
}

async function extractFromPhoto(imageBuffer, mimeType) {
  console.log(`[Gemini] extractFromPhoto: ${mimeType}, ${imageBuffer.length} bytes`)
  const imagePart = {
    inlineData: { data: imageBuffer.toString('base64'), mimeType },
  }
  const result = await model.generateContent([
    `${SCHEMA_PROMPT}\n\nExtract the recipe from this image of a recipe card or cookbook page.`,
    imagePart,
  ])
  return parseGeminiResponse(result.response.text())
}

module.exports = { extractFromUrl, extractFromText, extractFromPhoto }
