/** Metric ↔ Imperial unit conversion maps for common cooking units */

interface ConversionEntry {
  from: string;
  to: string;
  factor: number;
}

const CONVERSIONS: ConversionEntry[] = [
  // Volume
  { from: "cup", to: "ml", factor: 236.588 },
  { from: "cups", to: "ml", factor: 236.588 },
  { from: "tbsp", to: "ml", factor: 14.787 },
  { from: "tsp", to: "ml", factor: 4.929 },
  { from: "fl oz", to: "ml", factor: 29.574 },
  { from: "quart", to: "ml", factor: 946.353 },
  { from: "pint", to: "ml", factor: 473.176 },
  { from: "gallon", to: "l", factor: 3.785 },

  // Weight
  { from: "oz", to: "g", factor: 28.3495 },
  { from: "lb", to: "kg", factor: 0.4536 },
  { from: "lbs", to: "kg", factor: 0.4536 },

  // Temperature
  // Handled separately

  // Metric to Imperial (reverse)
  { from: "ml", to: "tsp", factor: 1 / 4.929 },
  { from: "l", to: "cups", factor: 4.227 },
  { from: "g", to: "oz", factor: 1 / 28.3495 },
  { from: "kg", to: "lb", factor: 2.2046 },
];

export type UnitSystem = "metric" | "imperial";

const METRIC_UNITS = new Set(["ml", "l", "g", "kg", "°c", "celsius"]);
const IMPERIAL_UNITS = new Set([
  "cup", "cups", "tbsp", "tsp", "fl oz", "quart", "pint", "gallon",
  "oz", "lb", "lbs", "°f", "fahrenheit",
]);

export function getUnitSystem(unit: string): UnitSystem | null {
  const lower = unit.toLowerCase().trim();
  if (METRIC_UNITS.has(lower)) return "metric";
  if (IMPERIAL_UNITS.has(lower)) return "imperial";
  return null; // Generic unit (e.g., "piece", "clove")
}

export function convertUnit(
  quantity: number,
  fromUnit: string,
  targetSystem: UnitSystem
): { quantity: number; unit: string } | null {
  const from = fromUnit.toLowerCase().trim();
  const currentSystem = getUnitSystem(from);

  if (!currentSystem || currentSystem === targetSystem) return null;

  // Temperature special case
  if (from === "°f" || from === "fahrenheit") {
    return targetSystem === "metric"
      ? { quantity: Math.round(((quantity - 32) * 5) / 9), unit: "°C" }
      : null;
  }
  if (from === "°c" || from === "celsius") {
    return targetSystem === "imperial"
      ? { quantity: Math.round((quantity * 9) / 5 + 32), unit: "°F" }
      : null;
  }

  const conversion = CONVERSIONS.find((c) => c.from === from);
  if (!conversion) return null;

  const convertedQty = quantity * conversion.factor;

  // Smart rounding
  const rounded =
    convertedQty < 1
      ? Math.round(convertedQty * 100) / 100
      : convertedQty < 10
        ? Math.round(convertedQty * 10) / 10
        : Math.round(convertedQty);

  return { quantity: rounded, unit: conversion.to };
}

/** Format a quantity for display (fractions for small imperial amounts) */
export function formatQuantity(qty: number): string {
  if (qty === 0) return "0";
  if (Number.isInteger(qty)) return qty.toString();

  // Common fractions
  const fractions: Record<string, string> = {
    "0.25": "¼",
    "0.33": "⅓",
    "0.5": "½",
    "0.67": "⅔",
    "0.75": "¾",
  };

  const whole = Math.floor(qty);
  const decimal = Math.round((qty - whole) * 100) / 100;
  const fracStr = decimal.toFixed(2).replace(/0$/, "");

  const fraction = fractions[fracStr] ?? fractions[decimal.toFixed(2)];
  if (fraction) {
    return whole > 0 ? `${whole} ${fraction}` : fraction;
  }

  return qty.toFixed(1).replace(/\.0$/, "");
}
