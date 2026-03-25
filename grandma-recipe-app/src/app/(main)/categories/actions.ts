"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(input: {
  name: string;
  color: string | null;
  icon: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("categories").insert({
    name: input.name.trim(),
    color: input.color || null,
    icon: input.icon || null,
    user_id: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/categories");
}

export async function updateCategoryAction(input: {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("categories")
    .update({
      name: input.name.trim(),
      color: input.color || null,
      icon: input.icon || null,
    })
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/categories");
}

export async function deleteCategoryAction(categoryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/categories");
}
