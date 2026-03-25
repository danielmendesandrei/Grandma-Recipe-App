"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  Share2,
  Store,
  Trash2,
  Copy,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { MerchantSection } from "@/src/components/grocery/MerchantSection";
import {
  addManualItem,
  addMerchant,
  deleteMerchant,
  deleteGroceryList,
  toggleShareGroceryList,
} from "../actions";
import type {
  GroceryList,
  GroceryListItem,
  GroceryListMerchant,
} from "@/src/lib/types/database";
import Link from "next/link";

interface GroceryListDetailClientProps {
  list: GroceryList;
  items: GroceryListItem[];
  merchants: GroceryListMerchant[];
}

export function GroceryListDetailClient({
  list,
  items: initialItems,
  merchants: initialMerchants,
}: GroceryListDetailClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [merchants, setMerchants] = useState(initialMerchants);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [merchantDialogOpen, setMerchantDialogOpen] = useState(false);
  const [newMerchantName, setNewMerchantName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    try {
      await addManualItem({
        groceryListId: list.id,
        name: newItemName,
        quantity: newItemQty,
        unit: newItemUnit,
      });
      setNewItemName("");
      setNewItemQty("");
      setNewItemUnit("");
      toast.success("Item added");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add item");
    }
  }

  async function handleAddMerchant() {
    if (!newMerchantName.trim()) return;
    try {
      await addMerchant(list.id, newMerchantName);
      setNewMerchantName("");
      setMerchantDialogOpen(false);
      toast.success("Store added");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add store");
    }
  }

  async function handleDeleteMerchant(merchantId: string) {
    try {
      await deleteMerchant(merchantId);
      toast.success("Store removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove store");
    }
  }

  async function handleToggleShare() {
    try {
      await toggleShareGroceryList(list.id, !list.is_shared);
      toast.success(list.is_shared ? "Sharing disabled" : "Sharing enabled");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleDelete() {
    try {
      await deleteGroceryList(list.id);
      toast.success("List deleted");
      router.push("/grocery-list");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  function copyShareLink() {
    if (list.share_code) {
      navigator.clipboard.writeText(
        `${window.location.origin}/share/grocery/${list.share_code}`
      );
      toast.success("Link copied!");
    }
  }

  // Group items by merchant
  const generalItems = items.filter((i) => !i.merchant_id);
  const merchantGroups = merchants.map((m) => ({
    merchant: m,
    items: items.filter((i) => i.merchant_id === m.id),
  }));

  const totalItems = items.length;
  const checkedItems = items.filter((i) => i.is_checked).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/grocery-list">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{list.name}</h1>
          <p className="text-sm text-muted-foreground">
            {checkedItems}/{totalItems} items checked
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={handleToggleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Share link */}
      {list.is_shared && list.share_code && (
        <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm">
          <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-muted-foreground">
            {typeof window !== "undefined"
              ? `${window.location.origin}/share/grocery/${list.share_code}`
              : `/share/grocery/${list.share_code}`}
          </span>
          <Button variant="ghost" size="sm" onClick={copyShareLink}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add item form */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <Input
          placeholder="Item name..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Qty"
          value={newItemQty}
          onChange={(e) => setNewItemQty(e.target.value)}
          className="w-16"
        />
        <Input
          placeholder="Unit"
          value={newItemUnit}
          onChange={(e) => setNewItemUnit(e.target.value)}
          className="w-20"
        />
        <Button type="submit" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {/* Merchant management */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMerchantDialogOpen(true)}
        >
          <Store className="mr-2 h-4 w-4" />
          Add Store
        </Button>
        {merchants.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
          >
            <span>{m.name}</span>
            <button
              type="button"
              onClick={() => handleDeleteMerchant(m.id)}
              className="ml-1 text-muted-foreground hover:text-destructive"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <Separator />

      {/* Item list grouped by merchant */}
      {totalItems === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No items yet — add items above.
        </p>
      ) : (
        <div className="space-y-4">
          {generalItems.length > 0 && (
            <MerchantSection
              merchant={null}
              items={generalItems}
              allMerchants={merchants}
              onItemToggle={() => router.refresh()}
            />
          )}
          {merchantGroups.map(
            ({ merchant, items: mItems }) =>
              mItems.length > 0 && (
                <MerchantSection
                  key={merchant.id}
                  merchant={merchant}
                  items={mItems}
                  allMerchants={merchants}
                  onItemToggle={() => router.refresh()}
                />
              )
          )}
        </div>
      )}

      {/* Add Merchant Dialog */}
      <Dialog open={merchantDialogOpen} onOpenChange={setMerchantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Store</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Store name (e.g., Walmart)"
            value={newMerchantName}
            onChange={(e) => setNewMerchantName(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMerchantDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddMerchant}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Grocery List</DialogTitle>
            <DialogDescription>
              This will permanently delete this grocery list and all its items.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
