// All weight conversions route through grams, all volume through millilitres.
// Temperature is handled separately (non-linear).
const CONVERSIONS = {
  // Weight
  g:      { toBase: v => v,           fromBase: v => v,           system: 'metric',   type: 'weight' },
  kg:     { toBase: v => v * 1000,    fromBase: v => v / 1000,    system: 'metric',   type: 'weight' },
  oz:     { toBase: v => v * 28.3495, fromBase: v => v / 28.3495, system: 'imperial', type: 'weight' },
  lb:     { toBase: v => v * 453.592, fromBase: v => v / 453.592, system: 'imperial', type: 'weight' },
  // Volume
  ml:     { toBase: v => v,           fromBase: v => v,           system: 'metric',   type: 'volume' },
  l:      { toBase: v => v * 1000,    fromBase: v => v / 1000,    system: 'metric',   type: 'volume' },
  tsp:    { toBase: v => v * 4.92892, fromBase: v => v / 4.92892, system: 'both',     type: 'volume' },
  tbsp:   { toBase: v => v * 14.7868, fromBase: v => v / 14.7868, system: 'both',     type: 'volume' },
  cup:    { toBase: v => v * 236.588, fromBase: v => v / 236.588, system: 'imperial', type: 'volume' },
  'fl oz':{ toBase: v => v * 29.5735, fromBase: v => v / 29.5735, system: 'imperial', type: 'volume' },
  qt:     { toBase: v => v * 946.353, fromBase: v => v / 946.353, system: 'imperial', type: 'volume' },
  pt:     { toBase: v => v * 473.176, fromBase: v => v / 473.176, system: 'imperial', type: 'volume' },
  // Temperature (special-cased)
  '°c':   { system: 'metric',   type: 'temp' },
  '°f':   { system: 'imperial', type: 'temp' },
  // Length
  cm:     { toBase: v => v,           fromBase: v => v,           system: 'metric',   type: 'length' },
  mm:     { toBase: v => v / 10,      fromBase: v => v * 10,      system: 'metric',   type: 'length' },
  inch:   { toBase: v => v * 2.54,    fromBase: v => v / 2.54,    system: 'imperial', type: 'length' },
  '"':    { toBase: v => v * 2.54,    fromBase: v => v / 2.54,    system: 'imperial', type: 'length' },
}

const TARGET_UNITS = {
  weight: { metric: 'g',   imperial: 'oz'  },
  volume: { metric: 'ml',  imperial: 'fl oz' },
  temp:   { metric: '°C',  imperial: '°F' },
  length: { metric: 'cm',  imperial: 'inch' },
}

function normalizeUnit(unit) {
  return unit?.toLowerCase().trim() ?? ''
}

export function convertIngredient(amount, unit, targetSystem) {
  if (amount == null || !unit) return { amount, unit }
  const norm = normalizeUnit(unit)
  const conv = CONVERSIONS[norm]
  if (!conv) return { amount, unit }

  // tsp/tbsp are used in both systems — never convert
  if (conv.system === 'both') return { amount, unit }

  // Already in the right system
  if (conv.system === targetSystem) return { amount, unit }

  if (conv.type === 'temp') {
    const converted = targetSystem === 'metric'
      ? (amount - 32) * 5 / 9
      : (amount * 9 / 5) + 32
    return { amount: converted, unit: TARGET_UNITS.temp[targetSystem] }
  }

  const target = TARGET_UNITS[conv.type]?.[targetSystem]
  if (!target) return { amount, unit }

  const targetConv = CONVERSIONS[normalizeUnit(target)]
  if (!targetConv) return { amount, unit }

  const base = conv.toBase(amount)
  const converted = targetConv.fromBase(base)

  // Scale up to larger unit if sensible (e.g. 1000ml → 1l, 453g → 1lb)
  return smartScale(converted, target, targetSystem)
}

function smartScale(amount, unit, system) {
  const norm = normalizeUnit(unit)
  if (system === 'metric') {
    if (norm === 'ml' && amount >= 1000)  return { amount: amount / 1000,    unit: 'l' }
    if (norm === 'g'  && amount >= 1000)  return { amount: amount / 1000,    unit: 'kg' }
  } else {
    if (norm === 'fl oz' && amount >= 32) return { amount: amount / 32,      unit: 'qt' }
    if (norm === 'oz'    && amount >= 16) return { amount: amount / 16,      unit: 'lb' }
  }
  return { amount, unit }
}

const FRACTIONS = [
  [1/8, '⅛'], [1/4, '¼'], [1/3, '⅓'], [3/8, '⅜'],
  [1/2, '½'], [5/8, '⅝'], [2/3, '⅔'], [3/4, '¾'], [7/8, '⅞'],
]

export function formatAmount(amount) {
  if (amount == null) return ''
  const whole = Math.floor(amount)
  const frac  = amount - whole

  if (frac < 0.01) return whole === 0 ? '' : String(whole)

  for (const [val, sym] of FRACTIONS) {
    if (Math.abs(frac - val) < 0.04) {
      return whole > 0 ? `${whole}${sym}` : sym
    }
  }

  // Fallback: round to 1 decimal
  return amount % 1 === 0 ? String(amount) : amount.toFixed(1)
}

export function getUnitSystem(unit) {
  if (!unit) return ''
  const conv = CONVERSIONS[normalizeUnit(unit)]
  return conv?.system ?? ''
}

export function convertStepTemps(text, targetSystem) {
  if (!text) return text
  if (targetSystem === 'imperial') {
    return text.replace(/(\d+)\s*°?C\b/g, (_, n) => {
      const f = Math.round((Number(n) * 9 / 5) + 32)
      return `${f}°F`
    })
  }
  return text.replace(/(\d+)\s*°?F\b/g, (_, n) => {
    const c = Math.round((Number(n) - 32) * 5 / 9)
    return `${c}°C`
  })
}
