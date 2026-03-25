"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MealType } from "@/src/lib/types/database";

export async function getOrCreateMealPlan(weekStartDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Try to find existing plan
  const { data: existing } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();

  if (existing) return existing as any;

  // Create new plan
  const { data: created, error } = await supabase
    .from("meal_plans")
    .insert({
      user_id: user.id,
      week_start_date: weekStartDate,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return created as any;
}

export async function addMealPlanEntry(input: {
  mealPlanId: string;
  recipeId: string;
  dayOfWeek: number;
  mealType: MealType;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("meal_plan_entries").insert({
    meal_plan_id: input.mealPlanId,
    recipe_id: input.recipeId,
    day_of_week: input.dayOfWeek,
    meal_type: input.mealType,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/meal-plan");
}

export async function removeMealPlanEntry(entryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("meal_plan_entries")
    .delete()
    .eq("id", entryId);

  if (error) throw new Error(error.message);
  revalidatePath("/meal-plan");
}

export async function searchRecipesForMealPlan(query: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data } = await supabase
    .from("recipes")
    .select("id, title, photo_url, prep_time_minutes, cook_time_minutes")
    .eq("user_id", user.id)
    .ilike("title", `%${query}%`)
    .order("title")
    .limit(20);

  return (data ?? []) as any[];
}
