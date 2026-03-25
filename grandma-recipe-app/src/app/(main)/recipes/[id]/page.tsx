import { createClient } from "@/src/lib/supabase/server";
import { notFound } from "next/navigation";
import { RecipeDetailClient } from "./RecipeDetailClient";
import type { RecipeWithDetails } from "@/src/lib/types/database";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // Fetch recipe with ingredients and instructions (with linked ingredients)
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
    .single();

  if (error || !recipe) notFound();

  const r = recipe as any;

  // Fetch categories linked to this recipe
  const { data: recipeCats } = await supabase
    .from("recipe_categories")
    .select("category_id, categories ( * )")
    .eq("recipe_id", id);

  const categories = (recipeCats as any[])
    ?.map((rc: any) => rc.categories)
    .filter(Boolean) ?? [];

  // Sort ingredients and instructions by order
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
    categories: categories as RecipeWithDetails["categories"],
  };

  const isOwner = r.user_id === user.id;

  return <RecipeDetailClient recipe={enrichedRecipe} isOwner={isOwner} />;
}
