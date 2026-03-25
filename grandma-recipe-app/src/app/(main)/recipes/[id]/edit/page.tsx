import { createClient } from "@/src/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { EditRecipeClient } from "./EditRecipeClient";
import type { RecipeWithDetails } from "@/src/lib/types/database";

export default async function EditRecipePage({
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

  // Fetch recipe with all related data
  const { data: recipe, error } = await supabase
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
    `
    )
    .eq("id", id)
    .eq("user_id", user.id) // Only owner can edit
    .single();

  if (error || !recipe) notFound();

  const r = recipe as any;

  // Fetch categories linked to this recipe
  const { data: recipeCats } = await supabase
    .from("recipe_categories")
    .select("category_id, categories ( * )")
    .eq("recipe_id", id);

  const linkedCategories = (recipeCats as any[])
    ?.map((rc: any) => rc.categories)
    .filter(Boolean) ?? [];

  // Fetch all categories for the dropdown
  const { data: allCategories } = await supabase
    .from("categories")
    .select("*")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order("name");

  // Sort ingredients and instructions
  const enrichedRecipe: RecipeWithDetails = {
    ...r,
    ingredients: [...(r.ingredients ?? [])].sort(
      (a: { order_index: number }, b: { order_index: number }) =>
        a.order_index - b.order_index
    ),
    instructions: [...(r.instructions ?? [])]
      .sort(
        (a: { step_number: number }, b: { step_number: number }) =>
          a.step_number - b.step_number
      )
      .map((inst: Record<string, unknown>) => ({
        ...inst,
        instruction_ingredients: inst.instruction_ingredients ?? [],
      })),
    categories: linkedCategories as RecipeWithDetails["categories"],
  };

  return (
    <EditRecipeClient
      recipe={enrichedRecipe}
      categories={(allCategories ?? []) as any[]}
    />
  );
}
