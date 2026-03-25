"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { RecipeForm, type RecipeFormData } from "@/src/components/recipes/RecipeForm";
import { uploadRecipePhoto } from "../../actions";
import { updateRecipeAction } from "../actions";
import type { Category, RecipeWithDetails } from "@/src/lib/types/database";

interface EditRecipeClientProps {
  recipe: RecipeWithDetails;
  categories: Category[];
}

export function EditRecipeClient({ recipe, categories }: EditRecipeClientProps) {
  const router = useRouter();

  // Build initialData from the fetched recipe
  const initialData: Partial<RecipeFormData> = {
    title: recipe.title,
    description: recipe.description ?? "",
    existingPhotoUrl: recipe.photo_url,
    prepTime: recipe.prep_time_minutes?.toString() ?? "",
    cookTime: recipe.cook_time_minutes?.toString() ?? "",
    servings: recipe.servings?.toString() ?? "1",
    sourceUrl: recipe.source_url ?? "",
    notes: recipe.notes ?? "",
    categoryIds: recipe.categories.map((c) => c.id),
    ingredients: recipe.ingredients.map((ing) => ({
      tempId: ing.id, // use real DB id as tempId for mapping
      name: ing.name,
      quantity: ing.quantity?.toString() ?? "",
      unit: ing.unit ?? "",
    })),
    instructions: recipe.instructions.map((inst) => ({
      tempId: inst.id,
      text: inst.text,
      linkedIngredients: inst.instruction_ingredients.map((link) => ({
        ingredientTempId: link.ingredient_id,
        quantity: link.quantity?.toString() ?? "",
        unit: link.unit ?? "",
      })),
    })),
  };

  async function handleSubmit(data: RecipeFormData) {
    try {
      let photoUrl: string | null = data.existingPhotoUrl;

      if (data.photo) {
        const formData = new FormData();
        formData.append("photo", data.photo);
        photoUrl = await uploadRecipePhoto(formData);
      }

      await updateRecipeAction({
        recipeId: recipe.id,
        title: data.title,
        description: data.description,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        sourceUrl: data.sourceUrl,
        notes: data.notes,
        photoUrl,
        ingredients: data.ingredients,
        instructions: data.instructions,
        categoryIds: data.categoryIds,
      });

      toast.success("Recipe updated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update recipe");
    }
  }

  return (
    <RecipeForm
      initialData={initialData}
      categories={categories}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
    />
  );
}
