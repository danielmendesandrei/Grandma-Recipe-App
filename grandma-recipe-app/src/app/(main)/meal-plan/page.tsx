import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { MealPlanClient } from "./MealPlanClient";
import type { WeekGridEntry } from "@/src/components/meal-plan/WeekGrid";

/** Get Monday of the given date's week */
function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default async function MealPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Determine which week to show
  const weekStart = params.week || getMonday(new Date());

  // Fetch meal plan for the week
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  let entries: WeekGridEntry[] = [];

  if (plan) {
    const { data: rawEntries } = await supabase
      .from("meal_plan_entries")
      .select("id, day_of_week, meal_type, recipe:recipes ( id, title, photo_url )")
      .eq("meal_plan_id", (plan as any).id);

    entries = (rawEntries ?? []).map((e: any) => ({
      id: e.id,
      day_of_week: e.day_of_week,
      meal_type: e.meal_type,
      recipe: e.recipe,
    }));
  }

  return (
    <MealPlanClient
      initialPlan={plan as any}
      initialEntries={entries}
      initialWeekStart={weekStart}
    />
  );
}
