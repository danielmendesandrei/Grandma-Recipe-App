import { createClient } from "@/src/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Category } from "@/src/lib/types/database";
import { CategoryDetailClient } from "./CategoryDetailClient";

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

  // Fetch all user recipes (for the add dialog)
  const { data: allRecipesRaw } = await supabase
    .from("recipes")
    .select("id, title, photo_url")
    .eq("user_id", user.id)
    .order("title");

  const allRecipes = (allRecipesRaw ?? []) as {
    id: string;
    title: string;
    photo_url: string | null;
  }[];

  return (
    <CategoryDetailClient
      category={category}
      recipes={recipes}
      allRecipes={allRecipes}
    />
  );
}
