import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { RecipesBrowseClient } from "./RecipesBrowseClient";

export default async function RecipesBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const categoryId = params.category ?? "";
  const sort = params.sort ?? "newest";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Build recipe query — search by title or ingredient name
  let recipeQuery = supabase
    .from("recipes")
    .select(
      `
      *,
      ingredients ( * ),
      recipe_categories!inner ( category_id )
    `
    )
    .eq("user_id", user.id);

  // If no category filter, also fetch recipes without the inner join constraint
  if (!categoryId) {
    recipeQuery = supabase
      .from("recipes")
      .select(
        `
        *,
        ingredients ( * ),
        recipe_categories ( category_id )
      `
      )
      .eq("user_id", user.id);
  } else {
    recipeQuery = recipeQuery.eq("recipe_categories.category_id", categoryId);
  }

  // Search filter: ILIKE on title
  if (query) {
    recipeQuery = recipeQuery.ilike("title", `%${query}%`);
  }

  // Sort
  switch (sort) {
    case "oldest":
      recipeQuery = recipeQuery.order("created_at", { ascending: true });
      break;
    case "a-z":
      recipeQuery = recipeQuery.order("title", { ascending: true });
      break;
    case "z-a":
      recipeQuery = recipeQuery.order("title", { ascending: false });
      break;
    case "cook-time":
      recipeQuery = recipeQuery.order("cook_time_minutes", {
        ascending: true,
        nullsFirst: false,
      });
      break;
    default: // newest
      recipeQuery = recipeQuery.order("created_at", { ascending: false });
  }

  const { data: recipes } = await recipeQuery;

  // If searching by ingredient name and title didn't match, also search ingredients
  let ingredientRecipeIds: string[] = [];
  if (query) {
    const { data: matchedIngredients } = await supabase
      .from("ingredients")
      .select("recipe_id")
      .ilike("name", `%${query}%`);

    if (matchedIngredients) {
      ingredientRecipeIds = [
        ...new Set((matchedIngredients as any[]).map((i: any) => i.recipe_id)),
      ];
    }
  }

  // Merge: recipe IDs from title search + ingredient search
  const titleRecipeIds = new Set((recipes ?? [] as any[]).map((r: any) => r.id));
  const extraIds = ingredientRecipeIds.filter((id) => !titleRecipeIds.has(id));

  let extraRecipes: typeof recipes = [];
  if (extraIds.length > 0) {
    let extraQuery = supabase
      .from("recipes")
      .select(
        `
        *,
        ingredients ( * ),
        recipe_categories ( category_id )
      `
      )
      .eq("user_id", user.id)
      .in("id", extraIds);

    if (categoryId) {
      // Re-filter by category for extra results
      const { data: catLinks } = await supabase
        .from("recipe_categories")
        .select("recipe_id")
        .eq("category_id", categoryId)
        .in("recipe_id", extraIds);

      const catFilteredIds = catLinks?.map((c: any) => c.recipe_id) ?? [];
      if (catFilteredIds.length > 0) {
        extraQuery = extraQuery.in("id", catFilteredIds);
      } else {
        extraIds.length = 0; // No extra results match category
      }
    }

    if (extraIds.length > 0) {
      const { data } = await extraQuery;
      extraRecipes = data ?? [];
    }
  }

  const allRecipes = [...(recipes ?? []), ...extraRecipes] as any[];

  // Resolve categories for each recipe
  const allCategoryIds = new Set<string>();
  allRecipes.forEach((r: any) => {
    (r.recipe_categories as { category_id: string }[])?.forEach((rc) =>
      allCategoryIds.add(rc.category_id)
    );
  });

  const { data: allCats } = await supabase
    .from("categories")
    .select("*")
    .in("id", [...allCategoryIds]);

  const catMap = new Map((allCats ?? []).map((c: any) => [c.id, c]));

  const enrichedRecipes = allRecipes.map((r: any) => ({
    ...r,
    categories: (r.recipe_categories as { category_id: string }[])
      ?.map((rc) => catMap.get(rc.category_id))
      .filter(Boolean) ?? [],
  }));

  // Fetch all user categories for the filter dropdown
  const { data: userCategories } = await supabase
    .from("categories")
    .select("*")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order("name");

  return (
    <RecipesBrowseClient
      initialRecipes={enrichedRecipes as any}
      categories={(userCategories ?? []) as any[]}
      initialQuery={query}
      initialCategory={categoryId}
      initialSort={sort}
    />
  );
}
