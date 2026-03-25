import { createClient } from "@/src/lib/supabase/server";
import { RecipeCard } from "@/src/components/recipes/RecipeCard";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Plus, CalendarDays, ShoppingCart, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch recent recipes
  const { data: recentRecipes } = await supabase
    .from("recipes")
    .select("*, recipe_categories(category_id, categories(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch this week's meal plan
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const weekStart = monday.toISOString().split("T")[0];

  const { data: mealPlan } = await supabase
    .from("meal_plans")
    .select("*, meal_plan_entries(*, recipe:recipes(id, title, photo_url))")
    .eq("user_id", user.id)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  // Fetch active grocery lists
  const { data: groceryLists } = await supabase
    .from("grocery_lists")
    .select("*, grocery_list_items(id, is_checked)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const recipesWithCategories = (recentRecipes ?? []).map((r: any) => ({
    ...r,
    categories: r.recipe_categories
      ?.map((rc: { categories: unknown }) => rc.categories)
      .filter(Boolean) ?? [],
    recipe_categories: undefined,
  }));

  const mealCount = (mealPlan as any)?.meal_plan_entries?.length ?? 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">
          Hello, {(profile as any)?.display_name ?? "Chef"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          What are we cooking today?
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/recipes/new">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
              <div className="rounded-full bg-primary/10 p-2.5">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">Add Recipe</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/recipes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
              <div className="rounded-full bg-primary/10 p-2.5">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">Browse All</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/meal-plan">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
              <div className="rounded-full bg-primary/10 p-2.5">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">Meal Plan</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/grocery-list">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
              <div className="rounded-full bg-primary/10 p-2.5">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">Grocery</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* This week's plan summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">This Week</CardTitle>
          <Link href="/meal-plan">
            <Button variant="ghost" size="sm">View plan</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {mealCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {mealCount} meal{mealCount !== 1 ? "s" : ""} planned this week
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No meals planned yet.{" "}
              <Link href="/meal-plan" className="text-primary hover:underline">
                Start planning
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Grocery list summary */}
      {groceryLists && groceryLists.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Active Grocery Lists</CardTitle>
            <Link href="/grocery-list">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {groceryLists.map((list: any) => {
              const total = list.grocery_list_items?.length ?? 0;
              const checked = list.grocery_list_items?.filter(
                (i: { is_checked: boolean }) => i.is_checked
              ).length ?? 0;
              return (
                <Link
                  key={list.id}
                  href={`/grocery-list/${list.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium">{list.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {checked}/{total} items
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent recipes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Recipes</h2>
          <Link href="/recipes">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>
        {recipesWithCategories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {recipesWithCategories.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-3">📖</span>
              <p className="text-muted-foreground mb-4">
                No recipes yet. Add your first recipe!
              </p>
              <Link href="/recipes/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipe
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
