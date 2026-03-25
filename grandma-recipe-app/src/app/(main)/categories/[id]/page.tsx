import { createClient } from "@/src/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { RecipeCard } from "@/src/components/recipes/RecipeCard";
import type { Category } from "@/src/lib/types/database";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch the category
  const { data: rawCategory, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !rawCategory) notFound();
  const category = rawCategory as Category;

  // Fetch recipes in this category
  const { data: recipeLinks } = await supabase
    .from("recipe_categories")
    .select("recipe_id")
    .eq("category_id", id);

  const recipeIds = (recipeLinks as { recipe_id: string }[] | null)?.map((rl) => rl.recipe_id) ?? [];

  let recipes: any[] = [];
  if (recipeIds.length > 0) {
    const { data } = await supabase
      .from("recipes")
      .select("*, ingredients ( * )")
      .in("id", recipeIds)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    recipes = (data ?? []).map((r: any) => ({ ...r, categories: [category] }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/categories">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full"
            style={{
              backgroundColor: category.color || "hsl(var(--primary))",
            }}
          />
          <h1 className="text-2xl font-bold text-foreground">
            {category.name}
          </h1>
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg text-muted-foreground">
            No recipes in this category yet.
          </p>
          <Link href="/recipes/new" className="mt-4">
            <Button variant="outline">Create a Recipe</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe: any) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
