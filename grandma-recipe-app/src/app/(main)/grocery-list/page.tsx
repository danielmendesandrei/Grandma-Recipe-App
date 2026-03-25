import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { GroceryListOverview } from "./GroceryListOverview";

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default async function GroceryListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all grocery lists with item counts
  const { data: lists } = await supabase
    .from("grocery_lists")
    .select("*, grocery_list_items ( id, is_checked )")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const enrichedLists = (lists ?? []).map((l: any) => {
    const items = (l.grocery_list_items as { id: string; is_checked: boolean }[]) ?? [];
    return {
      ...l,
      item_count: items.length,
      checked_count: items.filter((i) => i.is_checked).length,
    };
  });

  // Fetch current week's meal plan (for "Generate from Meal Plan" button)
  const weekStart = getMonday(new Date());
  const { data: currentPlan } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  return (
    <GroceryListOverview
      lists={enrichedLists as any}
      currentMealPlan={currentPlan as any}
    />
  );
}
