/** Consolidate grocery items — group by normalized name, sum quantities when units match */

interface RawItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  source_recipe_id: string | null;
}

export interface ConsolidatedItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  source_recipe_ids: string[];
}

export function consolidateIngredients(items: RawItem[]): ConsolidatedItem[] {
  const map = new Map<string, ConsolidatedItem>();

  for (const item of items) {
    const key = `${item.name.toLowerCase().trim()}|${(item.unit ?? "").toLowerCase().trim()}`;
    const existing = map.get(key);

    if (existing) {
      if (existing.quantity != null && item.quantity != null) {
        existing.quantity += item.quantity;
      } else if (item.quantity != null) {
        existing.quantity = item.quantity;
      }
      if (item.source_recipe_id && !existing.source_recipe_ids.includes(item.source_recipe_id)) {
        existing.source_recipe_ids.push(item.source_recipe_id);
      }
    } else {
      map.set(key, {
        name: item.name.trim(),
        quantity: item.quantity,
        unit: item.unit?.trim() || null,
        source_recipe_ids: item.source_recipe_id ? [item.source_recipe_id] : [],
      });
    }
  }

  return Array.from(map.values());
}
