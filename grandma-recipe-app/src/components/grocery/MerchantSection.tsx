"use client";

import { Store } from "lucide-react";
import { GroceryItem } from "./GroceryItem";
import type { GroceryListItem, GroceryListMerchant } from "@/src/lib/types/database";

interface MerchantSectionProps {
  merchant: GroceryListMerchant | null; // null = General section
  items: GroceryListItem[];
  allMerchants: GroceryListMerchant[];
  onItemToggle?: () => void;
}

export function MerchantSection({
  merchant,
  items,
  allMerchants,
  onItemToggle,
}: MerchantSectionProps) {
  const checkedCount = items.filter((i) => i.is_checked).length;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 py-2">
        <Store className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          {merchant?.name ?? "General"}
        </h3>
        <span className="text-xs text-muted-foreground">
          ({checkedCount}/{items.length})
        </span>
      </div>
      <div className="space-y-0.5">
        {items
          .sort((a, b) => a.order_index - b.order_index)
          .map((item) => (
            <GroceryItem
              key={item.id}
              item={item}
              merchants={allMerchants}
              onToggle={onItemToggle}
            />
          ))}
      </div>
    </div>
  );
}
