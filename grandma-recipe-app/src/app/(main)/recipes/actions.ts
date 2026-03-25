"use server";

import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";

interface CreateRecipeInput {
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
  groupId?: string | null;
}

export async function createRecipeAction(input: CreateRecipeInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Insert recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      title: input.title,
      description: input.description || null,
      photo_url: input.photoUrl,
      prep_time_minutes: input.prepTime ? parseInt(input.prepTime) : null,
      cook_time_minutes: input.cookTime ? parseInt(input.cookTime) : null,
      servings: input.servings ? parseInt(input.servings) : 1,
      source_url: input.sourceUrl || null,
      notes: input.notes || null,
      user_id: user.id,
      group_id: input.groupId || null,
    })
    .select()
    .single();

  if (recipeError || !recipe) throw new Error(recipeError?.message ?? "Failed to create recipe");

  const r = recipe as any;

  // Insert ingredients
  const validIngredients = input.ingredients.filter((i) => i.name.trim());
  const tempIdToDbId: Record<string, string> = {};

  if (validIngredients.length > 0) {
    const { data: insertedIngredients, error: ingError } = await supabase
      .from("ingredients")
      .insert(
        validIngredients.map((ing, idx) => ({
          recipe_id: r.id,
          name: ing.name.trim(),
          quantity: ing.quantity ? parseFloat(ing.quantity) : null,
          unit: ing.unit.trim() || null,
          order_index: idx,
        }))
      )
      .select();

    if (ingError) throw new Error(ingError.message);

    // Map tempId to DB id
    (insertedIngredients as any[])?.forEach((dbIng: any, idx: number) => {
      tempIdToDbId[validIngredients[idx].tempId] = dbIng.id;
    });
  }

  // Insert instructions
  const validInstructions = input.instructions.filter((i) => i.text.trim());

  if (validInstructions.length > 0) {
    const { data: insertedInstructions, error: instError } = await supabase
      .from("instructions")
      .insert(
        validInstructions.map((inst, idx) => ({
          recipe_id: r.id,
          step_number: idx + 1,
          text: inst.text.trim(),
        }))
      )
      .select();

    if (instError) throw new Error(instError.message);

    // Insert instruction_ingredients links
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
      const { error: linkError } = await supabase
        .from("instruction_ingredients")
        .insert(links);
      if (linkError) throw new Error(linkError.message);
    }
  }

  // Insert category associations
  if (input.categoryIds.length > 0) {
    const { error: catError } = await supabase
      .from("recipe_categories")
      .insert(
        input.categoryIds.map((catId) => ({
          recipe_id: r.id,
          category_id: catId,
        }))
      );
    if (catError) throw new Error(catError.message);
  }

  redirect(`/recipes/${r.id}`);
}

export async function uploadRecipePhoto(formData: FormData): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const file = formData.get("photo") as File;
  if (!file || file.size === 0) return null;

  const ext = file.name.split(".").pop();
  const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("recipe-photos")
    .upload(fileName, file, { contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("recipe-photos").getPublicUrl(fileName);
  return data.publicUrl;
}
