"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { consolidateIngredients } from "@/src/lib/utils/grocery";

export async function generateFromMealPlan(mealPlanId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch all entries for this meal plan
  const { data: entries } = await supabase
    .from("meal_plan_entries")
    .select("recipe_id")
    .eq("meal_plan_id", mealPlanId);

  if (!entries || entries.length === 0) throw new Error("No recipes in meal plan");

  // Count how many times each recipe appears in the meal plan
  const recipeCounts = new Map<string, number>();
  for (const entry of entries) {
    recipeCounts.set(entry.recipe_id, (recipeCounts.get(entry.recipe_id) ?? 0) + 1);
  }

  const recipeIds = [...recipeCounts.keys()];

  // Fetch ingredients for all unique recipes
  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("name, quantity, unit, recipe_id")
    .in("recipe_id", recipeIds);

  // Multiply ingredient quantities by how many times the recipe appears
  const rawItems = (ingredients ?? []).map((ing) => {
    const count = recipeCounts.get(ing.recipe_id) ?? 1;
    return {
      name: ing.name,
      quantity: ing.quantity != null ? ing.quantity * count : null,
      unit: ing.unit,
      source_recipe_id: ing.recipe_id,
    };
  });

  const consolidated = consolidateIngredients(rawItems);

  // Fetch the meal plan to get the week start date for naming
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("week_start_date")
    .eq("id", mealPlanId)
    .single();

  const listName = plan
    ? `Week of ${plan.week_start_date}`
    : `Grocery List`;

  // Create grocery list
  const { data: listData, error: listError } = await supabase
    .from("grocery_lists")
    .insert({
      name: listName,
      user_id: user.id,
      meal_plan_id: mealPlanId,
    })
    .select()
    .single();

  if (listError) throw new Error(listError.message);
  const list = listData as any;

  // Insert consolidated items
  if (consolidated.length > 0) {
    const { error: itemsError } = await supabase
      .from("grocery_list_items")
      .insert(
        consolidated.map((item, idx) => ({
          grocery_list_id: list.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          source_recipe_id: item.source_recipe_ids[0] ?? null,
          is_manual: false,
          order_index: idx,
        }))
      );

    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath("/grocery-list");
  return list.id;
}

export async function createEmptyGroceryList(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: listData, error } = await supabase
    .from("grocery_lists")
    .insert({ name: name.trim(), user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/grocery-list");
  return (listData as any).id;
}

export async function deleteGroceryList(listId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("grocery_lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/grocery-list");
}

export async function toggleGroceryItem(itemId: string, isChecked: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("grocery_list_items")
    .update({ is_checked: isChecked })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
}

export async function addManualItem(input: {
  groceryListId: string;
  name: string;
  quantity: string;
  unit: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get next order index
  const { data: items } = await supabase
    .from("grocery_list_items")
    .select("order_index")
    .eq("grocery_list_id", input.groceryListId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIdx = items && items.length > 0 ? items[0].order_index + 1 : 0;

  const { error } = await supabase.from("grocery_list_items").insert({
    grocery_list_id: input.groceryListId,
    name: input.name.trim(),
    quantity: input.quantity ? parseFloat(input.quantity) : null,
    unit: input.unit.trim() || null,
    is_manual: true,
    order_index: nextIdx,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/grocery-list`);
}

export async function deleteGroceryItem(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("grocery_list_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(error.message);
  revalidatePath("/grocery-list");
}

export async function addMerchant(groceryListId: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: merchants } = await supabase
    .from("grocery_list_merchants")
    .select("order_index")
    .eq("grocery_list_id", groceryListId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIdx = merchants && merchants.length > 0 ? merchants[0].order_index + 1 : 0;

  const { error } = await supabase.from("grocery_list_merchants").insert({
    grocery_list_id: groceryListId,
    name: name.trim(),
    order_index: nextIdx,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/grocery-list");
}

export async function deleteMerchant(merchantId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Unassign items from this merchant
  await supabase
    .from("grocery_list_items")
    .update({ merchant_id: null })
    .eq("merchant_id", merchantId);

  const { error } = await supabase
    .from("grocery_list_merchants")
    .delete()
    .eq("id", merchantId);

  if (error) throw new Error(error.message);
  revalidatePath("/grocery-list");
}

export async function assignItemToMerchant(itemId: string, merchantId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("grocery_list_items")
    .update({ merchant_id: merchantId })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
  revalidatePath("/grocery-list");
}

export async function toggleShareGroceryList(listId: string, isShared: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updateData: { is_shared: boolean; share_code?: string | null } = {
    is_shared: isShared,
  };

  if (isShared) {
    updateData.share_code = crypto.randomUUID().slice(0, 12);
  } else {
    updateData.share_code = null;
  }

  const { error } = await supabase
    .from("grocery_lists")
    .update(updateData)
    .eq("id", listId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/grocery-list");
}
