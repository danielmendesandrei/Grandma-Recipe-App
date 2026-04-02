/** Cooking unit system with presets, conversions, and ingredient densities */
export type UnitCategory = "volume" | "mass" | "count" | "other";
export type UnitSystemType = "metric" | "imperial" | "universal";
export interface UnitDef { value: string; label: string; abbr: string; category: UnitCategory; system: UnitSystemType; toBase: number; }
export const UNIT_DEFS: UnitDef[] = [
  { value: "ml", label: "Milliliter", abbr: "ml", category: "volume", system: "metric", toBase: 1 },
  { value: "l", label: "Liter", abbr: "L", category: "volume", system: "metric", toBase: 1000 },
  { value: "tsp", label: "Teaspoon", abbr: "tsp", category: "volume", system: "imperial", toBase: 4.929 },
  { value: "tbsp", label: "Tablespoon", abbr: "tbsp", category: "volume", system: "imperial", toBase: 14.787 },
  { value: "cup", label: "Cup", abbr: "cup", category: "volume", system: "imperial", toBase: 236.588 },
  { value: "g", label: "Gram", abbr: "g", category: "mass", system: "metric", toBase: 1 },
  { value: "kg", label: "Kilogram", abbr: "kg", category: "mass", system: "metric", toBase: 1000 },
  { value: "oz", label: "Ounce", abbr: "oz", category: "mass", system: "imperial", toBase: 28.3495 },
  { value: "lb", label: "Pound", abbr: "lb", category: "mass", system: "imperial", toBase: 453.592 },
  { value: "unit", label: "Unit", abbr: "unit", category: "count", system: "universal", toBase: 1 },
  { value: "piece", label: "Piece", abbr: "pc", category: "count", system: "universal", toBase: 1 },
  { value: "slice", label: "Slice", abbr: "slice", category: "count", system: "universal", toBase: 1 },
  { value: "clove", label: "Clove", abbr: "clove", category: "count", system: "universal", toBase: 1 },
  { value: "bunch", label: "Bunch", abbr: "bunch", category: "count", system: "universal", toBase: 1 },
];
const UNIT_MAP = new Map<string, UnitDef>();
for (const u of UNIT_DEFS) { UNIT_MAP.set(u.value, u); }
const ALIASES: Record<string, string> = { cups: "cup", tablespoon: "tbsp", tablespoons: "tbsp", teaspoon: "tsp", teaspoons: "tsp", ounce: "oz", ounces: "oz", pound: "lb", pounds: "lb", lbs: "lb", gram: "g", grams: "g", kilogram: "kg", kilograms: "kg", milliliter: "ml", milliliters: "ml", liter: "l", liters: "l", millilitre: "ml", millilitres: "ml", litre: "l", litres: "l", pieces: "piece", slices: "slice", cloves: "clove", units: "unit", pc: "piece", bunches: "bunch" };
export function resolveUnit(raw: string): UnitDef | null {
  const key = raw.toLowerCase().trim();
  if (UNIT_MAP.has(key)) return UNIT_MAP.get(key)!;
  const alias = ALIASES[key];
  if (alias && UNIT_MAP.has(alias)) return UNIT_MAP.get(alias)!;
  return null;
}
export function getGroupedUnits(): { label: string; units: UnitDef[] }[] {
  return [
    { label: "Volume", units: UNIT_DEFS.filter((u) => u.category === "volume") },
    { label: "Mass", units: UNIT_DEFS.filter((u) => u.category === "mass") },
    { label: "Count", units: UNIT_DEFS.filter((u) => u.category === "count") },
  ];
}
export function convertUnit(quantity: number, fromUnit: string, toUnit: string): { quantity: number; unit: string } | null {
  const from = resolveUnit(fromUnit); const to = resolveUnit(toUnit);
  if (!from || !to || from.category !== to.category || from.category === "count") return null;
  return { quantity: smartRound(quantity * from.toBase / to.toBase), unit: to.abbr };
}
export function convertToSystem(quantity: number, fromUnit: string, targetSystem: "metric" | "imperial"): { quantity: number; unit: string } | null {
  const from = resolveUnit(fromUnit);
  if (!from || from.system === targetSystem || from.system === "universal" || from.category === "count") return null;
  const baseQty = quantity * from.toBase;
  const candidates = UNIT_DEFS.filter((u) => u.category === from.category && u.system === targetSystem);
  let best: { quantity: number; unit: string } | null = null;
  let bestScore = Infinity;
  for (const c of candidates) {
    const converted = baseQty / c.toBase;
    const score = converted < 0.25 ? (0.25 / converted) * 10 : converted > 999 ? (converted / 999) * 10 : Math.abs(Math.log10(converted));
    if (score < bestScore) { bestScore = score; best = { quantity: smartRound(converted), unit: c.abbr }; }
  }
  return best;
}
export function getConvertibleUnits(fromUnit: string): UnitDef[] {
  const from = resolveUnit(fromUnit);
  if (!from || from.category === "count") return [];
  return UNIT_DEFS.filter((u) => u.category === from.category && u.value !== from.value);
}
export const INGREDIENT_DENSITIES: Record<string, number> = { butter: 0.911, "melted butter": 0.911, oil: 0.92, "olive oil": 0.92, "vegetable oil": 0.92, "coconut oil": 0.92, water: 1.0, milk: 1.03, cream: 1.01, "heavy cream": 1.01, "sour cream": 1.01, yogurt: 1.03, "greek yogurt": 1.1, honey: 1.42, "maple syrup": 1.32, molasses: 1.42, flour: 0.528, "all-purpose flour": 0.528, "bread flour": 0.55, "cake flour": 0.48, "whole wheat flour": 0.52, "almond flour": 0.38, "coconut flour": 0.48, cornstarch: 0.54, "cocoa powder": 0.34, "baking powder": 0.77, "baking soda": 0.87, "powdered sugar": 0.48, sugar: 0.85, "white sugar": 0.85, "granulated sugar": 0.85, "brown sugar": 0.83, rice: 0.85, oats: 0.34, "rolled oats": 0.34, breadcrumbs: 0.45, "peanut butter": 0.94, "almond butter": 0.96, "soy sauce": 1.14, "tomato paste": 1.1, "tomato sauce": 1.04, ketchup: 1.15, mayonnaise: 0.91, mustard: 1.05, vinegar: 1.01, salt: 1.22, "table salt": 1.22, "kosher salt": 0.58, "garlic powder": 0.58, "onion powder": 0.55, paprika: 0.46 };
function findDensity(name: string): number | null {
  const lower = name.toLowerCase().trim();
  if (INGREDIENT_DENSITIES[lower] !== undefined) return INGREDIENT_DENSITIES[lower];
  for (const [key, density] of Object.entries(INGREDIENT_DENSITIES)) { if (lower.includes(key) || key.includes(lower)) return density; }
  return null;
}
export function hasDensityData(ingredientName: string): boolean { return findDensity(ingredientName) !== null; }
export function convertWithDensity(quantity: number, fromUnit: string, toUnit: string, ingredientName: string): { quantity: number; unit: string; approximate: true } | null {
  const from = resolveUnit(fromUnit); const to = resolveUnit(toUnit);
  if (!from || !to) return null;
  if (from.category === to.category) { const r = convertUnit(quantity, fromUnit, toUnit); return r ? { ...r, approximate: true as const } : null; }
  if (!(from.category === "volume" && to.category === "mass") && !(from.category === "mass" && to.category === "volume")) return null;
  const density = findDensity(ingredientName); if (!density) return null;
  let grams: number;
  if (from.category === "volume") { grams = quantity * from.toBase * density; } else { grams = quantity * from.toBase; }
  if (to.category === "mass") { return { quantity: smartRound(grams / to.toBase), unit: to.abbr, approximate: true as const }; }
  else { return { quantity: smartRound(grams / density / to.toBase), unit: to.abbr, approximate: true as const }; }
}
export function getDensityConversions(quantity: number, fromUnit: string, ingredientName: string): { quantity: number; unit: string; approximate: boolean }[] {
  const from = resolveUnit(fromUnit); if (!from) return [];
  const results: { quantity: number; unit: string; approximate: boolean }[] = [];
  for (const target of getConvertibleUnits(fromUnit)) { const r = convertUnit(quantity, fromUnit, target.value); if (r) results.push({ ...r, approximate: false }); }
  if (hasDensityData(ingredientName)) {
    const cross = from.category === "volume" ? "mass" : from.category === "mass" ? "volume" : null;
    if (cross) { for (const t of UNIT_DEFS.filter((u) => u.category === cross)) { const r = convertWithDensity(quantity, fromUnit, t.value, ingredientName); if (r) results.push(r); } }
  }
  return results;
}
function smartRound(n: number): number {
  if (n === 0) return 0;
  if (Math.abs(n) < 0.1) return Math.round(n * 1000) / 1000;
  if (Math.abs(n) < 1) return Math.round(n * 100) / 100;
  if (Math.abs(n) < 10) return Math.round(n * 10) / 10;
  return Math.round(n);
}
export function formatQuantity(qty: number): string {
  if (qty === 0) return "0";
  if (Number.isInteger(qty)) return qty.toString();
  const fractions: Record<string, string> = { "0.13": "\u215B", "0.25": "\u00BC", "0.33": "\u2153", "0.38": "\u215C", "0.5": "\u00BD", "0.63": "\u215D", "0.67": "\u2154", "0.75": "\u00BE", "0.88": "\u215E" };
  const whole = Math.floor(qty);
  const decimal = Math.round((qty - whole) * 100) / 100;
  const fracStr = decimal.toFixed(2).replace(/0$/, "");
  const fraction = fractions[fracStr] ?? fractions[decimal.toFixed(2)];
  if (fraction) return whole > 0 ? whole + " " + fraction : fraction;
  return qty.toFixed(1).replace(/\.0$/, "");
}
export function formatUnit(unit: string): string {
  const def = resolveUnit(unit);
  return def?.abbr ?? unit;
}
