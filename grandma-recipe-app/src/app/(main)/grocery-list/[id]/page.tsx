import { createClient } from "@/src/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { GroceryListDetailClient } from "./GroceryListDetailClient";
import type { GroceryList, GroceryListItem, GroceryListMerchant } from "@/src/lib/types/database";

export default async function GroceryListDetailPage({
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

  const { data: list, error } = await supabase
    .from("grocery_lists")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !list) notFound();

  const groceryList = list as unknown as GroceryList;

  const { data: items } = await supabase
    .from("grocery_list_items")
    .select("*")
    .eq("grocery_list_id", id)
    .order("order_index");

  const { data: merchants } = await supabase
    .from("grocery_list_merchants")
    .select("*")
    .eq("grocery_list_id", id)
    .order("order_index");

  return (
    <GroceryListDetailClient
      list={groceryList}
      items={(items ?? []) as GroceryListItem[]}
      merchants={(merchants ?? []) as GroceryListMerchant[]}
    />
  );
}
