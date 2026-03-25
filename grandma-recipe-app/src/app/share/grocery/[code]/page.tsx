import { createClient } from "@/src/lib/supabase/server";
import { notFound } from "next/navigation";
import { Store, ShoppingCart } from "lucide-react";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Separator } from "@/src/components/ui/separator";

export default async function SharedGroceryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: list, error } = await supabase
    .from("grocery_lists")
    .select("*")
    .eq("share_code", code)
    .eq("is_shared", true)
    .single();

  if (error || !list) notFound();

  const l = list as any;

  const { data: items } = await supabase
    .from("grocery_list_items")
    .select("*")
    .eq("grocery_list_id", l.id)
    .order("order_index");

  const { data: merchants } = await supabase
    .from("grocery_list_merchants")
    .select("*")
    .eq("grocery_list_id", l.id)
    .order("order_index");

  const allItems = (items ?? []) as any[];
  const allMerchants = (merchants ?? []) as any[];

  const generalItems = allItems.filter((i: any) => !i.merchant_id);
  const merchantGroups = allMerchants.map((m: any) => ({
    merchant: m,
    items: allItems.filter((i: any) => i.merchant_id === m.id),
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <ShoppingCart className="h-8 w-8 mx-auto text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{l.name}</h1>
          <p className="text-sm text-muted-foreground">
            {allItems.filter((i) => i.is_checked).length}/{allItems.length} items checked
          </p>
        </div>

        <Separator />

        {allItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            This list is empty.
          </p>
        ) : (
          <div className="space-y-6">
            {generalItems.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 py-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">General</h3>
                </div>
                {generalItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2">
                    <Checkbox checked={item.is_checked} disabled />
                    <span
                      className={`text-sm ${
                        item.is_checked
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {item.quantity != null && (
                        <span className="font-medium">{item.quantity} </span>
                      )}
                      {item.unit && (
                        <span className="text-muted-foreground">
                          {item.unit}{" "}
                        </span>
                      )}
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {merchantGroups.map(
              ({ merchant, items: mItems }) =>
                mItems.length > 0 && (
                  <div key={merchant.id} className="space-y-1">
                    <div className="flex items-center gap-2 py-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">{merchant.name}</h3>
                    </div>
                    {mItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2">
                        <Checkbox checked={item.is_checked} disabled />
                        <span
                          className={`text-sm ${
                            item.is_checked
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {item.quantity != null && (
                            <span className="font-medium">
                              {item.quantity}{" "}
                            </span>
                          )}
                          {item.unit && (
                            <span className="text-muted-foreground">
                              {item.unit}{" "}
                            </span>
                          )}
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )
            )}
          </div>
        )}

        <Separator />
        <p className="text-center text-xs text-muted-foreground">
          Shared from Grandma&apos;s Recipe App
        </p>
      </div>
    </div>
  );
}
