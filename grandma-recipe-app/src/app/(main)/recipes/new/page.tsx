import { createClient } from "@/src/lib/supabase/server";
import { CreateRecipeClient } from "./CreateRecipeClient";

export default async function NewRecipePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categoryId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Recipe</h1>
      <CreateRecipeClient
        categories={(categories ?? []) as any[]}
        defaultCategoryId={categoryId}
      />
    </div>
  );
}
