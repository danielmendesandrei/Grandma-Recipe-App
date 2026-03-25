"use client";

import { useState } from "react";
import { MealSlot } from "./MealSlot";
import type { MealType, Recipe, MealPlanEntry } from "@/src/lib/types/database";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
];

export interface WeekGridEntry {
  id: string;
  day_of_week: number;
  meal_type: MealType;
  recipe: Pick<Recipe, "id" | "title" | "photo_url">;
}

interface WeekGridProps {
  entries: WeekGridEntry[];
  onAdd: (dayOfWeek: number, mealType: MealType) => void;
  onRemove: (entryId: string) => void;
}

export function WeekGrid({ entries, onAdd, onRemove }: WeekGridProps) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header row */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-1">
          <div />
          {DAYS.map((day, idx) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Meal type rows */}
        {MEAL_TYPES.map((meal) => (
          <div
            key={meal.key}
            className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-1"
          >
            <div className="flex items-start justify-end pr-2 pt-2 text-xs font-medium text-muted-foreground">
              {meal.label}
            </div>
            {DAYS.map((_, dayIdx) => {
              const slotEntries = entries.filter(
                (e) =>
                  e.day_of_week === dayIdx && e.meal_type === meal.key
              );
              return (
                <div
                  key={dayIdx}
                  className="rounded-md border border-border/50 bg-card p-1"
                >
                  <MealSlot
                    entries={slotEntries}
                    onAdd={() => onAdd(dayIdx, meal.key)}
                    onRemove={onRemove}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
