import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { CategoriesClient } from "./CategoriesClient";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch categories with recipe counts
  const { data: categories } = await supabase
    .from("categories")
    .select("*, recipe_categories ( recipe_id )")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order("name");

  const enriched = (categories ?? []).map((cat: any) => ({
    ...cat,
    recipe_count: (cat.recipe_categories as unknown[])?.length ?? 0,
  }));

  return <CategoriesClient categories={enriched as any} />;
}
