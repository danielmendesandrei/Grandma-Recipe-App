import type { Ingredient } from "@/src/lib/types/database";
import { Checkbox } from "@/src/components/ui/checkbox";
import { UnitConverter } from "@/src/components/recipes/UnitConverter";
import { convertToSystem, formatQuantity, formatUnit } from "@/src/lib/utils/units";

interface IngredientListProps {
  ingredients: Ingredient[];
  scaleFactor: number;
  checkedIds?: Set<string>;
  onToggle?: (id: string) => void;
  /** When set, all convertible units are shown in this system */
  targetSystem?: "metric" | "imperial" | null;
}

export function IngredientList({
  ingredients,
  scaleFactor,
  checkedIds,
  onToggle,
  targetSystem,
}: IngredientListProps) {
  return (
    <ul className="space-y-2">
      {ingredients.map((ing) => {
        const scaledQty = ing.quantity
          ? Math.round(ing.quantity * scaleFactor * 100) / 100
          : null;
        const isChecked = checkedIds?.has(ing.id) ?? false;

        // Try to convert to target system
        let displayQty = scaledQty;
        let displayUnit = ing.unit ?? "";
        let converted = false;

        if (targetSystem && scaledQty != null && ing.unit) {
          const result = convertToSystem(scaledQty, ing.unit, targetSystem);
          if (result) {
            displayQty = result.quantity;
            displayUnit = result.unit;
            converted = true;
          }
        }

        return (
          <li key={ing.id} className="flex items-center gap-3">
            {onToggle && (
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggle(ing.id)}
              />
            )}
            <span className={`flex-1 ${isChecked ? "line-through text-muted-foreground" : ""}`}>
              {displayQty != null && (
                <span className="font-medium">
                  {formatQuantity(displayQty)}
                  {displayUnit ? ` ${formatUnit(displayUnit)}` : ""}
                </span>
              )}
              {displayQty != null && " "}
              {ing.name}
              {converted && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({formatQuantity(scaledQty!)} {formatUnit(ing.unit!)})
                </span>
              )}
            </span>
            {scaledQty != null && ing.unit && (
              <UnitConverter
                quantity={scaledQty}
                unit={ing.unit}
                ingredientName={ing.name}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
