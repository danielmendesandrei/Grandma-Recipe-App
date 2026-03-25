import { StepIngredientChips } from "./StepIngredientChips";
import type { Instruction, InstructionIngredient, Ingredient } from "@/src/lib/types/database";

type InstructionWithLinks = Instruction & {
  instruction_ingredients: (InstructionIngredient & {
    ingredient: Ingredient;
  })[];
};

interface InstructionStepsProps {
  instructions: InstructionWithLinks[];
  scaleFactor: number;
}

export function InstructionSteps({ instructions, scaleFactor }: InstructionStepsProps) {
  return (
    <ol className="space-y-6">
      {instructions
        .sort((a, b) => a.step_number - b.step_number)
        .map((step) => (
          <li key={step.id} className="flex gap-4">
            <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
              {step.step_number}
            </span>
            <div className="flex-1">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {step.text}
              </p>
              <StepIngredientChips
                linkedIngredients={step.instruction_ingredients}
                scaleFactor={scaleFactor}
              />
            </div>
          </li>
        ))}
    </ol>
  );
}
