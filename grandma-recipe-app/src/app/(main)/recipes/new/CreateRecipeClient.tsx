"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { RecipeForm, type RecipeFormData } from "@/src/components/recipes/RecipeForm";
import { createRecipeAction, uploadRecipePhoto } from "../actions";
import type { Category } from "@/src/lib/types/database";

interface CreateRecipeClientProps {
  categories: Category[];
  defaultCategoryId?: string;
}

export function CreateRecipeClient({ categories, defaultCategoryId }: CreateRecipeClientProps) {
  const router = useRouter();

  async function handleSubmit(data: RecipeFormData) {
    try {
      let photoUrl: string | null = data.existingPhotoUrl;

      if (data.photo) {
        const formData = new FormData();
        formData.append("photo", data.photo);
        photoUrl = await uploadRecipePhoto(formData);
      }

      toast.success("Recipe created!");

      await createRecipeAction({
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
    } catch (error) {
      // redirect() throws a NEXT_REDIRECT error — let it propagate
      if (error instanceof Error && error.message === "NEXT_REDIRECT") {
        throw error;
      }
      toast.error(error instanceof Error ? error.message : "Failed to create recipe");
    }
  }

  return (
    <RecipeForm
      categories={categories}
      onSubmit={handleSubmit}
      submitLabel="Create Recipe"
      initialData={defaultCategoryId ? { categoryIds: [defaultCategoryId] } : undefined}
    />
  );
}
