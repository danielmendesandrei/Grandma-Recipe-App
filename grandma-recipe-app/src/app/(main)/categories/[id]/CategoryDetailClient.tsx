"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, Plus, X, Search } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { RecipeCard } from "@/src/components/recipes/RecipeCard";
import {
  addRecipesToCategoryAction,
  removeRecipeFromCategoryAction,
} from "../actions";
import type { Category, Recipe } from "@/src/lib/types/database";

interface CategoryDetailClientProps {
  category: Category;
  /** Recipes already in this category (with joined data for RecipeCard) */
  recipes: (Recipe & { categories: Category[]; ingredients: any[] })[];
  /** All user recipes (for the add dialog) */
  allRecipes: { id: string; title: string; photo_url: string | null }[];
}

export function CategoryDetailClient({
  category,
  recipes,
  allRecipes,
}: CategoryDetailClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const existingIds = new Set(recipes.map((r) => r.id));

  // Recipes available to add (not already in this category)
  const available = allRecipes
    .filter((r) => !existingIds.has(r.id))
    .filter(
      (r) =>
        !search || r.title.toLowerCase().includes(search.toLowerCase()),
    );

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openDialog() {
    setSearch("");
    setSelected(new Set());
    setDialogOpen(true);
  }

  async function handleAdd() {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      await addRecipesToCategoryAction(category.id, Array.from(selected));
      toast.success(
        `Added ${selected.size} recipe${selected.size > 1 ? "s" : ""}`,
      );
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to add recipes");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(recipeId: string, title: string) {
    try {
      await removeRecipeFromCategoryAction(category.id, recipeId);
      toast.success(`Removed "${title}"`);
      router.refresh();
    } catch {
      toast.error("Failed to remove recipe");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/categories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{
                backgroundColor: category.color || "hsl(var(--primary))",
              }}
            />
            <h1 className="text-2xl font-bold text-foreground">
              {category.name}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/recipes/new?category=${category.id}`}>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Recipe
            </Button>
          </Link>
          <Button onClick={openDialog} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Existing
          </Button>
        </div>
      </div>

      {/* Recipe grid */}
      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg text-muted-foreground">
            No recipes in this category yet.
          </p>
          <div className="flex gap-2 mt-4">
            <Link href={`/recipes/new?category=${category.id}`}>
              <Button variant="outline">New Recipe</Button>
            </Link>
            <Button variant="outline" onClick={openDialog}>
              Add Existing
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="relative group">
              <RecipeCard recipe={recipe} />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(recipe.id, recipe.title)}
                title="Remove from category"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add recipes dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add recipes to {category.name}</DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Recipe list */}
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[50vh]">
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {allRecipes.length === existingIds.size
                  ? "All your recipes are already in this category."
                  : "No matching recipes found."}
              </p>
            ) : (
              available.map((recipe) => (
                <label
                  key={recipe.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(recipe.id)}
                    onCheckedChange={() => toggleSelected(recipe.id)}
                  />
                  {recipe.photo_url && (
                    <img
                      src={recipe.photo_url}
                      alt=""
                      className="h-8 w-8 rounded object-cover"
                    />
                  )}
                  <span className="text-sm font-medium truncate">
                    {recipe.title}
                  </span>
                </label>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={selected.size === 0 || submitting}
            >
              {submitting
                ? "Adding..."
                : `Add ${selected.size > 0 ? selected.size : ""} Recipe${selected.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
