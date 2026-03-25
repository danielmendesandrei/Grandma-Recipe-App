"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type { Recipe } from "@/src/lib/types/database";

interface MealSlotEntry {
  id: string;
  recipe: Pick<Recipe, "id" | "title" | "photo_url">;
}

interface MealSlotProps {
  entries: MealSlotEntry[];
  onAdd: () => void;
  onRemove: (entryId: string) => void;
}

export function MealSlot({ entries, onAdd, onRemove }: MealSlotProps) {
  return (
    <div className="min-h-[60px] space-y-1">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="group relative flex items-center gap-2 rounded-md bg-primary/10 p-1.5 text-xs"
        >
          {entry.recipe.photo_url ? (
            <img
              src={entry.recipe.photo_url}
              alt=""
              className="h-6 w-6 rounded object-cover shrink-0"
            />
          ) : (
            <span className="h-6 w-6 rounded bg-muted flex items-center justify-center text-[10px] shrink-0">
              🍳
            </span>
          )}
          <span className="line-clamp-1 flex-1">{entry.recipe.title}</span>
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-muted-foreground/30 p-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
