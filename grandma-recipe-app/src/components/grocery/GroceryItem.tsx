"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  toggleGroceryItem,
  deleteGroceryItem,
  assignItemToMerchant,
} from "@/src/app/(main)/grocery-list/actions";
import type { GroceryListItem, GroceryListMerchant } from "@/src/lib/types/database";

interface GroceryItemProps {
  item: GroceryListItem;
  merchants: GroceryListMerchant[];
  onToggle?: () => void;
}

export function GroceryItem({ item, merchants, onToggle }: GroceryItemProps) {
  const [checked, setChecked] = useState(item.is_checked);

  async function handleToggle() {
    const newVal = !checked;
    setChecked(newVal); // Optimistic
    try {
      await toggleGroceryItem(item.id, newVal);
      onToggle?.();
    } catch {
      setChecked(!newVal); // Revert
    }
  }

  async function handleDelete() {
    try {
      await deleteGroceryItem(item.id);
      onToggle?.();
    } catch {
      // silently fail
    }
  }

  async function handleMerchantChange(val: string) {
    await assignItemToMerchant(item.id, val === "none" ? null : val);
  }

  return (
    <div
      className={`group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50 ${
        checked ? "opacity-60" : ""
      }`}
    >
      <Checkbox checked={checked} onCheckedChange={handleToggle} />
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${checked ? "line-through text-muted-foreground" : ""}`}>
          {item.quantity != null && (
            <span className="font-medium">{item.quantity} </span>
          )}
          {item.unit && <span className="text-muted-foreground">{item.unit} </span>}
          {item.name}
        </span>
      </div>
      {item.is_manual && (
        <Badge variant="outline" className="text-[10px] shrink-0">
          Manual
        </Badge>
      )}
      <Select
        value={item.merchant_id ?? "none"}
        onValueChange={handleMerchantChange}
      >
        <SelectTrigger className="w-[100px] h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <SelectValue placeholder="Store" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">General</SelectItem>
          {merchants.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={handleDelete}
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
}
