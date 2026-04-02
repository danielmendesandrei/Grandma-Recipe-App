"use server";

import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Clone a public recipe into the current user's collection.
 * Copies: recipe metadata, ingredients, instructions, instruction_ingredients.
 * Does NOT copy: photo (links to the same URL), categories, group_id.
 */
export async function importRecipeAction(sourceRecipeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 1. Fetch the source recipe (must be public)
  const { data: source, error: srcErr } = await supabase
    .from("recipes")
    .select(
      `
      *,
      ingredients ( * ),
      instructions (
        *,
        instruction_ingredients (
          *,
          ingredient:ingredients ( * )
        )
      )
    `,
    )
    .eq("id", sourceRecipeId)
    .eq("is_public", true)
    .single();

  if (srcErr || !source) throw new Error("Recipe not found or not public");

  const src = source as any;

  // 2. Create the new recipe
  const { data: newRecipe, error: recipeErr } = await supabase
    .from("recipes")
    .insert({
      title: src.title,
      description: src.description,
      photo_url: src.photo_url,
      prep_time_minutes: src.prep_time_minutes,
      cook_time_minutes: src.cook_time_minutes,
      servings: src.servings,
      source_url: src.source_url,
      notes: src.notes,
      user_id: user.id,
      group_id: null,
      is_public: false,
      public_slug: null,
    })
    .select()
    .single();

  if (recipeErr || !newRecipe)
    throw new Error(recipeErr?.message ?? "Failed to create recipe");

  const nr = newRecipe as any;

  // 3. Copy ingredients (keep map of old ID → new ID for instruction links)
  const sortedIngredients = [...(src.ingredients ?? [])].sort(
    (a: any, b: any) => a.order_index - b.order_index,
  );

  const oldToNewIngredientId: Record<string, string> = {};

  if (sortedIngredients.length > 0) {
    const { data: newIngs, error: ingErr } = await supabase
      .from("ingredients")
      .insert(
        sortedIngredients.map((ing: any) => ({
          recipe_id: nr.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          order_index: ing.order_index,
        })),
      )
      .select();

    if (ingErr) throw new Error(ingErr.message);

    (newIngs as any[])?.forEach((dbIng: any, idx: number) => {
      oldToNewIngredientId[sortedIngredients[idx].id] = dbIng.id;
    });
  }

  // 4. Copy instructions + instruction_ingredients
  const sortedInstructions = [...(src.instructions ?? [])].sort(
    (a: any, b: any) => a.step_number - b.step_number,
  );

  if (sortedInstructions.length > 0) {
    const { data: newInsts, error: instErr } = await supabase
      .from("instructions")
      .insert(
        sortedInstructions.map((inst: any) => ({
          recipe_id: nr.id,
          step_number: inst.step_number,
          text: inst.text,
        })),
      )
      .select();

    if (instErr) throw new Error(instErr.message);

    // Build instruction_ingredients links
    const links: {
      instruction_id: string;
      ingredient_id: string;
      quantity: number | null;
      unit: string | null;
    }[] = [];

    (newInsts as any[])?.forEach((dbInst: any, idx: number) => {
      const origInst = sortedInstructions[idx];
      for (const link of origInst.instruction_ingredients ?? []) {
        const newIngId = oldToNewIngredientId[link.ingredient_id];
        if (newIngId) {
          links.push({
            instruction_id: dbInst.id,
            ingredient_id: newIngId,
            quantity: link.quantity,
            unit: link.unit,
          });
        }
      }
    });

    if (links.length > 0) {
      const { error: linkErr } = await supabase
        .from("instruction_ingredients")
        .insert(links);
      if (linkErr) throw new Error(linkErr.message);
    }
  }

  redirect(`/recipes/${nr.id}`);
}
