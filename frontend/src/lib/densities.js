// Ingredient densities in g/ml (= g/cm³)
// Sources: USDA, King Arthur Flour, standard culinary references
// One cup = 236.588 ml, so g_per_cup / 236.588 = g/ml

export const DENSITIES = {
  // ── Flours ──────────────────────────────────────────────────────────────────
  'all-purpose flour':        { gPerCup: 120,  category: 'Flour' },
  'bread flour':              { gPerCup: 120,  category: 'Flour' },
  'cake flour':               { gPerCup: 100,  category: 'Flour' },
  'whole wheat flour':        { gPerCup: 120,  category: 'Flour' },
  'self-raising flour':       { gPerCup: 120,  category: 'Flour' },
  'rye flour':                { gPerCup: 102,  category: 'Flour' },
  'almond flour':             { gPerCup: 96,   category: 'Flour' },
  'coconut flour':            { gPerCup: 112,  category: 'Flour' },
  'oat flour':                { gPerCup: 92,   category: 'Flour' },
  'rice flour':               { gPerCup: 158,  category: 'Flour' },
  'tapioca flour':            { gPerCup: 120,  category: 'Flour' },
  'cornstarch':               { gPerCup: 128,  category: 'Flour' },
  'cornflour':                { gPerCup: 128,  category: 'Flour' },
  'arrowroot':                { gPerCup: 128,  category: 'Flour' },
  'semolina':                 { gPerCup: 167,  category: 'Flour' },
  'spelt flour':              { gPerCup: 100,  category: 'Flour' },

  // ── Sugars ──────────────────────────────────────────────────────────────────
  'white sugar':              { gPerCup: 200,  category: 'Sugar' },
  'granulated sugar':         { gPerCup: 200,  category: 'Sugar' },
  'caster sugar':             { gPerCup: 200,  category: 'Sugar' },
  'superfine sugar':          { gPerCup: 200,  category: 'Sugar' },
  'icing sugar':              { gPerCup: 120,  category: 'Sugar' },
  'powdered sugar':           { gPerCup: 120,  category: 'Sugar' },
  'confectioners sugar':      { gPerCup: 120,  category: 'Sugar' },
  'brown sugar':              { gPerCup: 213,  category: 'Sugar' },
  'light brown sugar':        { gPerCup: 213,  category: 'Sugar' },
  'dark brown sugar':         { gPerCup: 213,  category: 'Sugar' },
  'raw sugar':                { gPerCup: 200,  category: 'Sugar' },
  'demerara sugar':           { gPerCup: 200,  category: 'Sugar' },
  'muscovado sugar':          { gPerCup: 180,  category: 'Sugar' },
  'coconut sugar':            { gPerCup: 180,  category: 'Sugar' },

  // ── Fats & Oils ──────────────────────────────────────────────────────────────
  'butter':                   { gPerCup: 227,  category: 'Fat' },
  'unsalted butter':          { gPerCup: 227,  category: 'Fat' },
  'salted butter':            { gPerCup: 227,  category: 'Fat' },
  'margarine':                { gPerCup: 227,  category: 'Fat' },
  'shortening':               { gPerCup: 190,  category: 'Fat' },
  'lard':                     { gPerCup: 205,  category: 'Fat' },
  'vegetable oil':            { gPerCup: 218,  category: 'Fat' },
  'olive oil':                { gPerCup: 216,  category: 'Fat' },
  'coconut oil':              { gPerCup: 218,  category: 'Fat' },
  'canola oil':               { gPerCup: 218,  category: 'Fat' },
  'sunflower oil':            { gPerCup: 218,  category: 'Fat' },

  // ── Liquids ──────────────────────────────────────────────────────────────────
  'water':                    { gPerCup: 237,  category: 'Liquid' },
  'milk':                     { gPerCup: 244,  category: 'Liquid' },
  'whole milk':               { gPerCup: 244,  category: 'Liquid' },
  'skim milk':                { gPerCup: 245,  category: 'Liquid' },
  'buttermilk':               { gPerCup: 245,  category: 'Liquid' },
  'cream':                    { gPerCup: 238,  category: 'Liquid' },
  'heavy cream':              { gPerCup: 238,  category: 'Liquid' },
  'whipping cream':           { gPerCup: 238,  category: 'Liquid' },
  'sour cream':               { gPerCup: 230,  category: 'Liquid' },
  'yogurt':                   { gPerCup: 245,  category: 'Liquid' },
  'honey':                    { gPerCup: 340,  category: 'Liquid' },
  'maple syrup':              { gPerCup: 322,  category: 'Liquid' },
  'golden syrup':             { gPerCup: 340,  category: 'Liquid' },
  'molasses':                 { gPerCup: 328,  category: 'Liquid' },
  'corn syrup':               { gPerCup: 328,  category: 'Liquid' },
  'agave':                    { gPerCup: 333,  category: 'Liquid' },
  'vanilla extract':          { gPerCup: 208,  category: 'Liquid' },

  // ── Dry / Pantry ─────────────────────────────────────────────────────────────
  'rolled oats':              { gPerCup: 90,   category: 'Dry' },
  'oats':                     { gPerCup: 90,   category: 'Dry' },
  'quick oats':               { gPerCup: 85,   category: 'Dry' },
  'breadcrumbs':              { gPerCup: 108,  category: 'Dry' },
  'panko':                    { gPerCup: 54,   category: 'Dry' },
  'desiccated coconut':       { gPerCup: 75,   category: 'Dry' },
  'shredded coconut':         { gPerCup: 75,   category: 'Dry' },
  'ground almonds':           { gPerCup: 96,   category: 'Dry' },
  'chopped nuts':             { gPerCup: 114,  category: 'Dry' },
  'chocolate chips':          { gPerCup: 170,  category: 'Dry' },
  'cocoa powder':             { gPerCup: 85,   category: 'Dry' },
  'baking powder':            { gPerCup: 192,  category: 'Dry' },
  'baking soda':              { gPerCup: 230,  category: 'Dry' },
  'salt':                     { gPerCup: 273,  category: 'Dry' },
  'fine salt':                { gPerCup: 273,  category: 'Dry' },
  'kosher salt':              { gPerCup: 144,  category: 'Dry' },
  'flaky salt':               { gPerCup: 96,   category: 'Dry' },
  'rice':                     { gPerCup: 185,  category: 'Dry' },
  'uncooked rice':            { gPerCup: 185,  category: 'Dry' },
  'lentils':                  { gPerCup: 192,  category: 'Dry' },
  'dried beans':              { gPerCup: 190,  category: 'Dry' },
  'peanut butter':            { gPerCup: 258,  category: 'Dry' },
  'cream cheese':             { gPerCup: 232,  category: 'Dry' },
  'ricotta':                  { gPerCup: 246,  category: 'Dry' },

  // ── Spices / Seasonings ───────────────────────────────────────────────────────
  'cinnamon':                 { gPerCup: 125,  category: 'Spice' },
  'ground cinnamon':          { gPerCup: 125,  category: 'Spice' },
  'ground ginger':            { gPerCup: 128,  category: 'Spice' },
  'ground nutmeg':            { gPerCup: 112,  category: 'Spice' },
  'ground cloves':            { gPerCup: 96,   category: 'Spice' },
  'ground cardamom':          { gPerCup: 88,   category: 'Spice' },
  'turmeric':                 { gPerCup: 112,  category: 'Spice' },
  'paprika':                  { gPerCup: 115,  category: 'Spice' },
  'cumin':                    { gPerCup: 112,  category: 'Spice' },
  'black pepper':             { gPerCup: 128,  category: 'Spice' },
  'chili powder':             { gPerCup: 120,  category: 'Spice' },
  'dried herbs':              { gPerCup: 48,   category: 'Spice' },
  'yeast':                    { gPerCup: 136,  category: 'Spice' },
  'instant yeast':            { gPerCup: 136,  category: 'Spice' },
  'active dry yeast':         { gPerCup: 136,  category: 'Spice' },
}

// Build a sorted list of all ingredient names grouped by category
export const INGREDIENT_LIST = Object.entries(DENSITIES)
  .sort((a, b) => a[1].category.localeCompare(b[1].category) || a[0].localeCompare(b[0]))
  .map(([name]) => name)

export const CATEGORIES = [...new Set(Object.values(DENSITIES).map(d => d.category))]

// g/ml for a given ingredient
export function getDensity(ingredient) {
  const d = DENSITIES[ingredient?.toLowerCase().trim()]
  if (!d) return null
  return d.gPerCup / 236.588  // convert g/cup → g/ml
}

// Convert between weight and volume using ingredient density
// fromUnit and toUnit are canonical unit keys (e.g. 'g', 'cup', 'ml', 'oz')
// Returns { amount, unit } or null if conversion not possible
export function convertWithDensity(amount, fromUnit, toUnit, ingredient) {
  const density = getDensity(ingredient)
  if (!density || amount == null) return null

  const WEIGHT_UNITS = ['g', 'kg', 'oz', 'lb', 'mg']
  const VOLUME_UNITS = ['ml', 'l', 'cl', 'dl', 'tsp', 'tbsp', 'cup', 'fl oz', 'pt', 'qt', 'gal',
                        'uk tsp', 'uk tbsp', 'uk cup', 'au tbsp', 'drop', 'dash', 'pinch']

  const fromIsWeight = WEIGHT_UNITS.includes(fromUnit)
  const toIsWeight   = WEIGHT_UNITS.includes(toUnit)
  const fromIsVolume = VOLUME_UNITS.includes(fromUnit)
  const toIsVolume   = VOLUME_UNITS.includes(toUnit)

  if (fromIsWeight === toIsWeight) return null // same type, no density needed

  // Import conversion helpers inline to avoid circular deps
  const ML_PER = {
    ml: 1, l: 1000, cl: 10, dl: 100,
    tsp: 4.92892, tbsp: 14.7868, cup: 236.588, 'fl oz': 29.5735,
    pt: 473.176, qt: 946.353, gal: 3785.41,
    'uk tsp': 5.91939, 'uk tbsp': 17.7582, 'uk cup': 284.131,
    'au tbsp': 20, drop: 0.0616115, dash: 0.616115, pinch: 0.308058,
  }
  const G_PER = {
    g: 1, kg: 1000, oz: 28.3495, lb: 453.592, mg: 0.001,
  }

  if (fromIsWeight && toIsVolume) {
    // weight → grams → ml → target volume
    const grams = amount * (G_PER[fromUnit] ?? 1)
    const ml    = grams / density
    return { amount: ml / (ML_PER[toUnit] ?? 1), unit: toUnit }
  }

  if (fromIsVolume && toIsWeight) {
    // volume → ml → grams → target weight
    const ml    = amount * (ML_PER[fromUnit] ?? 1)
    const grams = ml * density
    return { amount: grams / (G_PER[toUnit] ?? 1), unit: toUnit }
  }

  return null
}
