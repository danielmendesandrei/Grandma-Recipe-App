"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plus, SlidersHorizontal } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { RecipeCard } from "@/src/components/recipes/RecipeCard";
import { Skeleton } from "@/src/components/ui/skeleton";
import Link from "next/link";
import type { Recipe, Category, Ingredient } from "@/src/lib/types/database";

type RecipeWithMeta = Recipe & {
  ingredients: Ingredient[];
  categories: Category[];
};

interface RecipesBrowseClientProps {
  initialRecipes: RecipeWithMeta[];
  categories: Category[];
  initialQuery: string;
  initialCategory: string;
  initialSort: string;
}

export function RecipesBrowseClient({
  initialRecipes,
  categories,
  initialQuery,
  initialCategory,
  initialSort,
}: RecipesBrowseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort || "newest");
  const [recipes, setRecipes] = useState(initialRecipes);

  // Update state when URL params change (back/forward navigation)
  useEffect(() => {
    setRecipes(initialRecipes);
  }, [initialRecipes]);

  const updateUrl = useCallback(
    (newSearch: string, newCategory: string, newSort: string) => {
      const params = new URLSearchParams();
      if (newSearch) params.set("q", newSearch);
      if (newCategory) params.set("category", newCategory);
      if (newSort && newSort !== "newest") params.set("sort", newSort);
      const queryStr = params.toString();
      router.push(`/recipes${queryStr ? `?${queryStr}` : ""}`);
    },
    [router]
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateUrl(search, category, sort);
  }

  function handleCategoryChange(val: string) {
    const newCat = val === "all" ? "" : val;
    setCategory(newCat);
    updateUrl(search, newCat, sort);
  }

  function handleSortChange(val: string) {
    setSort(val);
    updateUrl(search, category, val);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Recipes</h1>
        <Link href="/recipes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Recipe
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or ingredient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </form>
        <div className="flex gap-2">
          <Select value={category || "all"} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="a-z">A — Z</SelectItem>
              <SelectItem value="z-a">Z — A</SelectItem>
              <SelectItem value="cook-time">Cook Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg text-muted-foreground">
            {search || category
              ? "No recipes match your filters."
              : "No recipes yet — add your first!"}
          </p>
          {!search && !category && (
            <Link href="/recipes/new" className="mt-4">
              <Button variant="outline">Create a Recipe</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
