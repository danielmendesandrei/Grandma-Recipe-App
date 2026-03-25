import { Badge } from "@/src/components/ui/badge";
import type { Ingredient, InstructionIngredient } from "@/src/lib/types/database";

interface StepIngredientChipsProps {
  linkedIngredients: (InstructionIngredient & { ingredient: Ingredient })[];
  scaleFactor: number;
}

export function StepIngredientChips({ linkedIngredients, scaleFactor }: StepIngredientChipsProps) {
  if (linkedIngredients.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {linkedIngredients.map((li) => {
        // Use the step-specific quantity if set, otherwise fall back to the ingredient's full quantity
        const baseQty = li.quantity ?? li.ingredient.quantity;
        const scaledQty = baseQty ? Math.round(baseQty * scaleFactor * 100) / 100 : null;
        const unit = li.unit ?? li.ingredient.unit;

        const label = [
          scaledQty != null ? scaledQty : null,
          unit,
          li.ingredient.name,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <Badge
            key={`${li.instruction_id}-${li.ingredient_id}`}
            variant="secondary"
            className="text-xs font-normal gap-1 bg-primary/10 text-primary border-primary/20"
          >
            {label}
          </Badge>
        );
      })}
    </div>
  );
}
