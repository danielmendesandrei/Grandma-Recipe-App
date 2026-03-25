"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  createEmptyGroceryList,
  generateFromMealPlan,
  deleteGroceryList,
} from "./actions";
import type { GroceryList, MealPlan } from "@/src/lib/types/database";
import Link from "next/link";

interface GroceryListOverviewProps {
  lists: (GroceryList & { item_count: number; checked_count: number })[];
  currentMealPlan: MealPlan | null;
}

export function GroceryListOverview({
  lists,
  currentMealPlan,
}: GroceryListOverviewProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreateEmpty() {
    if (!listName.trim()) {
      toast.error("Name is required");
      return;
    }
    setCreating(true);
    try {
      const id = await createEmptyGroceryList(listName);
      toast.success("List created");
      setDialogOpen(false);
      router.push(`/grocery-list/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleGenerateFromPlan() {
    if (!currentMealPlan) {
      toast.error("No meal plan for this week");
      return;
    }
    try {
      const id = await generateFromMealPlan(currentMealPlan.id);
      toast.success("Grocery list generated from meal plan");
      router.push(`/grocery-list/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate");
    }
  }

  async function handleDelete(e: React.MouseEvent, listId: string) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteGroceryList(listId);
      toast.success("List deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Grocery Lists</h1>
        <div className="flex gap-2">
          {currentMealPlan && (
            <Button variant="outline" onClick={handleGenerateFromPlan}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              From Meal Plan
            </Button>
          )}
          <Button onClick={() => { setListName(""); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New List
          </Button>
        </div>
      </div>

      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg text-muted-foreground">
            No grocery lists yet.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => { setListName(""); setDialogOpen(true); }}
          >
            Create a List
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Link key={list.id} href={`/grocery-list/${list.id}`}>
              <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{list.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {list.checked_count}/{list.item_count} items checked
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(list.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(e, list.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Grocery List</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="List name (e.g., Weekly Shopping)"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEmpty} disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
