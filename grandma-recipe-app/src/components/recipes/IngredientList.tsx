import type { Ingredient } from "@/src/lib/types/database";
import { Checkbox } from "@/src/components/ui/checkbox";

interface IngredientListProps {
  ingredients: Ingredient[];
  scaleFactor: number;
  checkedIds?: Set<string>;
  onToggle?: (id: string) => void;
}

export function IngredientList({
  ingredients,
  scaleFactor,
  checkedIds,
  onToggle,
}: IngredientListProps) {
  return (
    <ul className="space-y-2">
      {ingredients.map((ing) => {
        const scaledQty = ing.quantity
          ? Math.round(ing.quantity * scaleFactor * 100) / 100
          : null;
        const isChecked = checkedIds?.has(ing.id) ?? false;

        return (
          <li key={ing.id} className="flex items-center gap-3">
            {onToggle && (
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggle(ing.id)}
              />
            )}
            <span className={isChecked ? "line-through text-muted-foreground" : ""}>
              {scaledQty != null && (
                <span className="font-medium">
                  {scaledQty}
                  {ing.unit ? ` ${ing.unit}` : ""}
                </span>
              )}
              {scaledQty != null && " "}
              {ing.name}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
