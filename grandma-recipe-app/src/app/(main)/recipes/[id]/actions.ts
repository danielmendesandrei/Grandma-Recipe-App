"use server";

import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";

export async function deleteRecipeAction(recipeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

export async function togglePublicAction(recipeId: string, isPublic: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updateData: { is_public: boolean; public_slug?: string | null } = {
    is_public: isPublic,
  };

  if (isPublic) {
    // Generate a URL-safe slug
    updateData.public_slug = crypto.randomUUID().slice(0, 12);
  } else {
    updateData.public_slug = null;
  }

  const { error } = await supabase
    .from("recipes")
    .update(updateData)
    .eq("id", recipeId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

export async function updateRecipeAction(input: {
  recipeId: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  sourceUrl: string;
  notes: string;
  photoUrl: string | null;
  ingredients: {
    tempId: string;
    name: string;
    quantity: string;
    unit: string;
  }[];
  instructions: {
    tempId: string;
    text: string;
    linkedIngredients: {
      ingredientTempId: string;
      quantity: string;
      unit: string;
    }[];
  }[];
  categoryIds: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Update recipe
  const { error: recipeError } = await supabase
    .from("recipes")
    .update({
      title: input.title,
      description: input.description || null,
      photo_url: input.photoUrl,
      prep_time_minutes: input.prepTime ? parseInt(input.prepTime) : null,
      cook_time_minutes: input.cookTime ? parseInt(input.cookTime) : null,
      servings: input.servings ? parseInt(input.servings) : 1,
      source_url: input.sourceUrl || null,
      notes: input.notes || null,
    })
    .eq("id", input.recipeId)
    .eq("user_id", user.id);

  if (recipeError) throw new Error(recipeError.message);

  // Delete old ingredients (cascades to instruction_ingredients)
  await supabase.from("ingredients").delete().eq("recipe_id", input.recipeId);
  // Delete old instructions
  await supabase.from("instructions").delete().eq("recipe_id", input.recipeId);
  // Delete old category links
  await supabase.from("recipe_categories").delete().eq("recipe_id", input.recipeId);

  // Re-insert ingredients
  const validIngredients = input.ingredients.filter((i) => i.name.trim());
  const tempIdToDbId: Record<string, string> = {};

  if (validIngredients.length > 0) {
    const { data: insertedIngredients, error: ingError } = await supabase
      .from("ingredients")
      .insert(
        validIngredients.map((ing, idx) => ({
          recipe_id: input.recipeId,
          name: ing.name.trim(),
          quantity: ing.quantity ? parseFloat(ing.quantity) : null,
          unit: ing.unit.trim() || null,
          order_index: idx,
        }))
      )
      .select();

    if (ingError) throw new Error(ingError.message);
    (insertedIngredients as any[])?.forEach((dbIng: any, idx: number) => {
      tempIdToDbId[validIngredients[idx].tempId] = dbIng.id;
    });
  }

  // Re-insert instructions + links
  const validInstructions = input.instructions.filter((i) => i.text.trim());

  if (validInstructions.length > 0) {
    const { data: insertedInstructions, error: instError } = await supabase
      .from("instructions")
      .insert(
        validInstructions.map((inst, idx) => ({
          recipe_id: input.recipeId,
          step_number: idx + 1,
          text: inst.text.trim(),
        }))
      )
      .select();

    if (instError) throw new Error(instError.message);

    const links: {
      instruction_id: string;
      ingredient_id: string;
      quantity: number | null;
      unit: string | null;
    }[] = [];

    (insertedInstructions as any[])?.forEach((dbInst: any, idx: number) => {
      const original = validInstructions[idx];
      original.linkedIngredients.forEach((li) => {
        const ingredientDbId = tempIdToDbId[li.ingredientTempId];
        if (ingredientDbId) {
          links.push({
            instruction_id: dbInst.id,
            ingredient_id: ingredientDbId,
            quantity: li.quantity ? parseFloat(li.quantity) : null,
            unit: li.unit.trim() || null,
          });
        }
      });
    });

    if (links.length > 0) {
      const { error: linkError } = await supabase.from("instruction_ingredients").insert(links);
      if (linkError) throw new Error(linkError.message);
    }
  }

  // Re-insert category links
  if (input.categoryIds.length > 0) {
    await supabase
      .from("recipe_categories")
      .insert(input.categoryIds.map((catId) => ({ recipe_id: input.recipeId, category_id: catId })));
  }

  redirect(`/recipes/${input.recipeId}`);
}
