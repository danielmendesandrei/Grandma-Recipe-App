"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { WeekGrid, type WeekGridEntry } from "@/src/components/meal-plan/WeekGrid";
import {
  getOrCreateMealPlan,
  addMealPlanEntry,
  removeMealPlanEntry,
  searchRecipesForMealPlan,
} from "./actions";
import type { MealType, MealPlan } from "@/src/lib/types/database";

/** Get Monday of the given date's week */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${monday.toLocaleDateString("en-US", opts)} – ${sunday.toLocaleDateString("en-US", opts)}`;
}

interface MealPlanClientProps {
  initialPlan: MealPlan | null;
  initialEntries: WeekGridEntry[];
  initialWeekStart: string;
}

export function MealPlanClient({
  initialPlan,
  initialEntries,
  initialWeekStart,
}: MealPlanClientProps) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [plan, setPlan] = useState(initialPlan);
  const [entries, setEntries] = useState(initialEntries);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addTarget, setAddTarget] = useState<{
    dayOfWeek: number;
    mealType: MealType;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; title: string; photo_url: string | null }[]
  >([]);
  const [searching, setSearching] = useState(false);

  // Update state when initial data changes (server re-render)
  useEffect(() => {
    setPlan(initialPlan);
    setEntries(initialEntries);
    setWeekStart(initialWeekStart);
  }, [initialPlan, initialEntries, initialWeekStart]);

  function navigateWeek(offset: number) {
    const current = new Date(weekStart + "T00:00:00");
    current.setDate(current.getDate() + offset * 7);
    const newStart = formatDateStr(current);
    router.push(`/meal-plan?week=${newStart}`);
  }

  function goToThisWeek() {
    const monday = getMonday(new Date());
    router.push(`/meal-plan?week=${formatDateStr(monday)}`);
  }

  function openAddDialog(dayOfWeek: number, mealType: MealType) {
    setAddTarget({ dayOfWeek, mealType });
    setSearchQuery("");
    setSearchResults([]);
    setDialogOpen(true);
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchRecipesForMealPlan(query);
      setSearchResults(results);
    } catch {
      // ignore search errors
    } finally {
      setSearching(false);
    }
  }

  async function handleAddRecipe(recipeId: string) {
    if (!addTarget) return;
    try {
      // Ensure plan exists
      let currentPlan = plan;
      if (!currentPlan) {
        currentPlan = await getOrCreateMealPlan(weekStart);
        setPlan(currentPlan);
      }

      await addMealPlanEntry({
        mealPlanId: currentPlan!.id,
        recipeId,
        dayOfWeek: addTarget.dayOfWeek,
        mealType: addTarget.mealType,
      });

      toast.success("Recipe added to meal plan");
      setDialogOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  async function handleRemoveEntry(entryId: string) {
    try {
      // Optimistic removal
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      await removeMealPlanEntry(entryId);
      toast.success("Removed from meal plan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
      router.refresh(); // Revert on error
    }
  }

  const monday = new Date(weekStart + "T00:00:00");

  return (
    <div className="space-y-6">
      {/* Header with week navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Meal Plan</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToThisWeek} className="text-sm">
            <Calendar className="mr-2 h-4 w-4" />
            This Week
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{formatWeekRange(monday)}</p>

      {/* Week Grid */}
      <WeekGrid entries={entries} onAdd={openAddDialog} onRemove={handleRemoveEntry} />

      {/* Add Recipe Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Recipe</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search your recipes..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {searching && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Searching...
              </p>
            )}
            {!searching && searchQuery && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recipes found.
              </p>
            )}
            {searchResults.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => handleAddRecipe(recipe.id)}
                className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-accent transition-colors"
              >
                {recipe.photo_url ? (
                  <img
                    src={recipe.photo_url}
                    alt=""
                    className="h-10 w-10 rounded object-cover shrink-0"
                  />
                ) : (
                  <span className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                    🍳
                  </span>
                )}
                <span className="font-medium text-sm">{recipe.title}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
