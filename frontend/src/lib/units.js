// All weight conversions route through grams, all volume through millilitres.
// Temperature and pan sizes are handled separately (non-linear / lookup).

// ─── Conversion Table ─────────────────────────────────────────────────────────

export const CONVERSIONS = {
  // ── Weight ──
  g:          { toBase: v => v,              fromBase: v => v,              system: 'metric',   type: 'weight', label: 'Grams' },
  kg:         { toBase: v => v * 1000,       fromBase: v => v / 1000,       system: 'metric',   type: 'weight', label: 'Kilograms' },
  mg:         { toBase: v => v / 1000,       fromBase: v => v * 1000,       system: 'metric',   type: 'weight', label: 'Milligrams' },
  oz:         { toBase: v => v * 28.3495,    fromBase: v => v / 28.3495,    system: 'imperial', type: 'weight', label: 'Ounces' },
  lb:         { toBase: v => v * 453.592,    fromBase: v => v / 453.592,    system: 'imperial', type: 'weight', label: 'Pounds' },
  // ── Volume ──
  ml:         { toBase: v => v,              fromBase: v => v,              system: 'metric',   type: 'volume', label: 'Millilitres' },
  l:          { toBase: v => v * 1000,       fromBase: v => v / 1000,       system: 'metric',   type: 'volume', label: 'Litres' },
  cl:         { toBase: v => v * 10,         fromBase: v => v / 10,         system: 'metric',   type: 'volume', label: 'Centilitres' },
  dl:         { toBase: v => v * 100,        fromBase: v => v / 100,        system: 'metric',   type: 'volume', label: 'Decilitres' },
  tsp:        { toBase: v => v * 4.92892,    fromBase: v => v / 4.92892,    system: 'both',     type: 'volume', label: 'Teaspoons' },
  tbsp:       { toBase: v => v * 14.7868,    fromBase: v => v / 14.7868,    system: 'both',     type: 'volume', label: 'Tablespoons' },
  cup:        { toBase: v => v * 236.588,    fromBase: v => v / 236.588,    system: 'imperial', type: 'volume', label: 'Cups (US)' },
  'fl oz':    { toBase: v => v * 29.5735,    fromBase: v => v / 29.5735,    system: 'imperial', type: 'volume', label: 'Fluid Ounces (US)' },
  pt:         { toBase: v => v * 473.176,    fromBase: v => v / 473.176,    system: 'imperial', type: 'volume', label: 'Pints (US)' },
  qt:         { toBase: v => v * 946.353,    fromBase: v => v / 946.353,    system: 'imperial', type: 'volume', label: 'Quarts (US)' },
  gal:        { toBase: v => v * 3785.41,    fromBase: v => v / 3785.41,    system: 'imperial', type: 'volume', label: 'Gallons (US)' },
  'uk tsp':   { toBase: v => v * 5.91939,    fromBase: v => v / 5.91939,    system: 'imperial', type: 'volume', label: 'Teaspoons (UK)' },
  'uk tbsp':  { toBase: v => v * 17.7582,    fromBase: v => v / 17.7582,    system: 'imperial', type: 'volume', label: 'Tablespoons (UK)' },
  'uk cup':   { toBase: v => v * 284.131,    fromBase: v => v / 284.131,    system: 'imperial', type: 'volume', label: 'Cups (UK/Au)' },
  'uk fl oz': { toBase: v => v * 28.4131,    fromBase: v => v / 28.4131,    system: 'imperial', type: 'volume', label: 'Fluid Ounces (UK)' },
  'uk pt':    { toBase: v => v * 568.261,    fromBase: v => v / 568.261,    system: 'imperial', type: 'volume', label: 'Pints (UK)' },
  'uk qt':    { toBase: v => v * 1136.52,    fromBase: v => v / 1136.52,    system: 'imperial', type: 'volume', label: 'Quarts (UK)' },
  'au tsp':   { toBase: v => v * 5,          fromBase: v => v / 5,          system: 'metric',   type: 'volume', label: 'Teaspoons (AU)' },
  'au tbsp':  { toBase: v => v * 20,         fromBase: v => v / 20,         system: 'metric',   type: 'volume', label: 'Tablespoons (AU)' },
  'drop':     { toBase: v => v * 0.0616115,  fromBase: v => v / 0.0616115,  system: 'both',     type: 'volume', label: 'Drops' },
  'dash':     { toBase: v => v * 0.616115,   fromBase: v => v / 0.616115,   system: 'both',     type: 'volume', label: 'Dashes' },
  'pinch':    { toBase: v => v * 0.308058,   fromBase: v => v / 0.308058,   system: 'both',     type: 'volume', label: 'Pinches' },
  'smidgen':  { toBase: v => v * 0.154029,   fromBase: v => v / 0.154029,   system: 'both',     type: 'volume', label: 'Smidgens' },
  'gill':     { toBase: v => v * 118.294,    fromBase: v => v / 118.294,    system: 'imperial', type: 'volume', label: 'Gills (US)' },
  // ── Temperature ──
  '°c':       { system: 'metric',   type: 'temp',   label: 'Celsius' },
  '°f':       { system: 'imperial', type: 'temp',   label: 'Fahrenheit' },
  '°k':       { system: 'metric',   type: 'temp',   label: 'Kelvin' },
  // ── Length / Pan size ──
  cm:         { toBase: v => v,              fromBase: v => v,              system: 'metric',   type: 'length', label: 'Centimetres' },
  mm:         { toBase: v => v / 10,         fromBase: v => v * 10,         system: 'metric',   type: 'length', label: 'Millimetres' },
  m:          { toBase: v => v * 100,        fromBase: v => v / 100,        system: 'metric',   type: 'length', label: 'Metres' },
  inch:       { toBase: v => v * 2.54,       fromBase: v => v / 2.54,       system: 'imperial', type: 'length', label: 'Inches' },
  '"':        { toBase: v => v * 2.54,       fromBase: v => v / 2.54,       system: 'imperial', type: 'length', label: 'Inches' },
  ft:         { toBase: v => v * 30.48,      fromBase: v => v / 30.48,      system: 'imperial', type: 'length', label: 'Feet' },
  // ── Energy ──
  kcal:       { toBase: v => v,              fromBase: v => v,              system: 'both',     type: 'energy', label: 'Kilocalories' },
  cal:        { toBase: v => v,              fromBase: v => v,              system: 'both',     type: 'energy', label: 'Calories (kcal)' },
  kj:         { toBase: v => v / 4.18400,    fromBase: v => v * 4.18400,    system: 'metric',   type: 'energy', label: 'Kilojoules' },
  // ── Altitude / Pressure (for high-altitude baking) ──
  m_alt:      { toBase: v => v,              fromBase: v => v,              system: 'metric',   type: 'altitude', label: 'Metres (altitude)' },
  ft_alt:     { toBase: v => v * 0.3048,     fromBase: v => v / 0.3048,     system: 'imperial', type: 'altitude', label: 'Feet (altitude)' },
}

// Alias map — normalises common written variants to canonical keys
const ALIASES = {
  // Weight
  'gram': 'g', 'grams': 'g', 'gramme': 'g', 'grammes': 'g',
  'kilogram': 'kg', 'kilograms': 'kg', 'kilo': 'kg', 'kilos': 'kg',
  'ounce': 'oz', 'ounces': 'oz',
  'pound': 'lb', 'pounds': 'lb', 'lbs': 'lb',
  // Volume
  'milliliter': 'ml', 'millilitre': 'ml', 'milliliters': 'ml', 'millilitres': 'ml', 'mls': 'ml',
  'liter': 'l', 'litre': 'l', 'liters': 'l', 'litres': 'l',
  'centiliter': 'cl', 'centilitre': 'cl',
  'deciliter': 'dl', 'decilitre': 'dl',
  'teaspoon': 'tsp', 'teaspoons': 'tsp', 't': 'tsp',
  'tablespoon': 'tbsp', 'tablespoons': 'tbsp', 'T': 'tbsp', 'tbs': 'tbsp',
  'c': 'cup', 'cups': 'cup',
  'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz', 'floz': 'fl oz',
  'pint': 'pt', 'pints': 'pt',
  'quart': 'qt', 'quarts': 'qt',
  'gallon': 'gal', 'gallons': 'gal',
  'drops': 'drop', 'dashes': 'dash', 'pinches': 'pinch',
  // Temperature
  'celsius': '°c', 'c°': '°c', 'deg c': '°c', 'degrees c': '°c',
  'fahrenheit': '°f', 'f°': '°f', 'deg f': '°f', 'degrees f': '°f',
  'kelvin': '°k', 'k': '°k',
  // Length
  'centimeter': 'cm', 'centimetre': 'cm', 'centimeters': 'cm', 'centimetres': 'cm',
  'millimeter': 'mm', 'millimetre': 'mm',
  'meter': 'm', 'metre': 'm',
  'inches': 'inch', 'in': 'inch',
  'foot': 'ft', 'feet': 'ft',
}

// Groups for the converter UI — what shows in each category tab
export const UNIT_GROUPS = {
  weight:   ['g', 'kg', 'oz', 'lb', 'mg'],
  volume:   ['ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz', 'pt', 'qt', 'gal', 'dl', 'cl', 'uk tbsp', 'uk cup', 'au tbsp', 'drop', 'dash', 'pinch'],
  temp:     ['°c', '°f', '°k'],
  length:   ['cm', 'mm', 'inch', 'ft'],
  energy:   ['kcal', 'kj'],
}

export const GROUP_LABELS = {
  weight: 'Weight',
  volume: 'Volume',
  temp:   'Temperature',
  length: 'Pan Size',
  energy: 'Energy',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function normalizeUnit(unit) {
  if (!unit) return ''
  const lower = unit.toLowerCase().trim()
  return ALIASES[lower] ?? lower
}

function getConv(unit) {
  return CONVERSIONS[normalizeUnit(unit)]
}

// ─── Core Converter ───────────────────────────────────────────────────────────

export function convert(amount, fromUnit, toUnit) {
  if (amount == null || !fromUnit || !toUnit) return null
  const from = getConv(fromUnit)
  const to   = getConv(toUnit)
  if (!from || !to || from.type !== to.type) return null

  if (from.type === 'temp') return convertTemp(amount, fromUnit, toUnit)

  const base = from.toBase(amount)
  return to.fromBase(base)
}

function convertTemp(amount, from, to) {
  const fn = normalizeUnit(from)
  const tn = normalizeUnit(to)
  if (fn === tn) return amount

  // Convert to Celsius first
  let c
  if      (fn === '°c') c = amount
  else if (fn === '°f') c = (amount - 32) * 5 / 9
  else if (fn === '°k') c = amount - 273.15

  if      (tn === '°c') return c
  else if (tn === '°f') return c * 9 / 5 + 32
  else if (tn === '°k') return c + 273.15
  return null
}

// ─── Recipe ingredient conversion (used by IngredientList) ───────────────────

const TARGET_UNITS = {
  weight:   { metric: 'g',   imperial: 'oz'    },
  volume:   { metric: 'ml',  imperial: 'fl oz' },
  temp:     { metric: '°C',  imperial: '°F'    },
  length:   { metric: 'cm',  imperial: 'inch'  },
  altitude: { metric: 'm',   imperial: 'ft'    },
}

export function convertIngredient(amount, unit, targetSystem) {
  if (amount == null || !unit) return { amount, unit }
  const norm = normalizeUnit(unit)
  const conv = CONVERSIONS[norm]
  if (!conv) return { amount, unit }

  // tsp/tbsp/drop/dash/pinch etc — 'both', never auto-convert
  if (conv.system === 'both') return { amount, unit }

  // Already correct system — still apply smart scaling for clean display (e.g. 1183ml → 1.18l)
  if (conv.system === targetSystem) return smartScale(amount, unit, targetSystem)

  if (conv.type === 'temp') {
    const converted = targetSystem === 'metric'
      ? (amount - 32) * 5 / 9
      : (amount * 9 / 5) + 32
    return { amount: converted, unit: TARGET_UNITS.temp[targetSystem] }
  }

  const targetUnit = TARGET_UNITS[conv.type]?.[targetSystem]
  if (!targetUnit) return { amount, unit }

  const targetConv = CONVERSIONS[normalizeUnit(targetUnit)]
  if (!targetConv) return { amount, unit }

  const converted = targetConv.fromBase(conv.toBase(amount))
  return smartScale(converted, targetUnit, targetSystem)
}

function smartScale(amount, unit, system) {
  const norm = normalizeUnit(unit)
  if (system === 'metric') {
    if (norm === 'ml' && amount >= 1000)   return { amount: amount / 1000,   unit: 'l' }
    if (norm === 'g'  && amount >= 1000)   return { amount: amount / 1000,   unit: 'kg' }
  } else {
    if (norm === 'fl oz' && amount >= 32)  return { amount: amount / 32,     unit: 'qt' }
    if (norm === 'oz'    && amount >= 16)  return { amount: amount / 16,     unit: 'lb' }
    if (norm === 'fl oz' && amount >= 8)   return { amount: amount / 2,      unit: 'pt' }
  }
  return { amount, unit }
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const FRACTIONS = [
  [1/8, '⅛'], [1/4, '¼'], [1/3, '⅓'], [3/8, '⅜'],
  [1/2, '½'], [5/8, '⅝'], [2/3, '⅔'], [3/4, '¾'], [7/8, '⅞'],
]

export function formatAmount(amount) {
  if (amount == null) return ''

  // Round to remove floating point noise before any formatting
  const rounded = Math.round(amount * 10000) / 10000
  const whole   = Math.floor(rounded)
  const frac    = rounded - whole

  if (frac < 0.01) return whole === 0 ? '' : String(whole)

  // Try common fraction symbols
  for (const [val, sym] of FRACTIONS) {
    if (Math.abs(frac - val) < 0.04) {
      return whole > 0 ? `${whole}${sym}` : sym
    }
  }

  // Fallback: clean decimal — fewer digits for larger numbers
  if (rounded >= 100) return Math.round(rounded).toString()
  if (rounded >= 10)  return rounded.toFixed(1).replace(/\.0$/, '')
  return rounded.toFixed(2).replace(/\.?0+$/, '')
}

export function formatResult(amount) {
  if (amount == null) return '—'
  if (Math.abs(amount) >= 1000) return amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (Math.abs(amount) >= 100)  return amount.toFixed(1)
  if (Math.abs(amount) >= 10)   return amount.toFixed(2)
  if (Math.abs(amount) >= 1)    return amount.toFixed(3)
  return amount.toFixed(4)
}

export function getUnitSystem(unit) {
  const conv = CONVERSIONS[normalizeUnit(unit)]
  return conv?.system ?? ''
}

export function convertStepTemps(text, targetSystem) {
  if (!text) return text
  if (targetSystem === 'imperial') {
    return text.replace(/(\d+(?:\.\d+)?)\s*°?C\b/g, (_, n) => {
      const f = Math.round(Number(n) * 9 / 5 + 32)
      return `${f}°F`
    })
  }
  return text.replace(/(\d+(?:\.\d+)?)\s*°?F\b/g, (_, n) => {
    const c = Math.round((Number(n) - 32) * 5 / 9)
    return `${c}°C`
  })
}
