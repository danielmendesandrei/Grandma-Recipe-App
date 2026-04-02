"use client";

import { useState } from "react";
import { ArrowRightLeft, Info } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  getDensityConversions,
  hasDensityData,
  resolveUnit,
  formatQuantity,
  formatUnit,
} from "@/src/lib/utils/units";

interface UnitConverterProps {
  quantity: number;
  unit: string;
  ingredientName: string;
}

export function UnitConverter({ quantity, unit, ingredientName }: UnitConverterProps) {
  const resolved = resolveUnit(unit);
  if (!resolved || resolved.category === "count") return null;

  const conversions = getDensityConversions(quantity, unit, ingredientName);
  if (conversions.length === 0) return null;

  // Show top 4 most useful conversions
  const topConversions = conversions.slice(0, 6);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 text-muted-foreground hover:text-primary"
          title="Convert units"
        >
          <ArrowRightLeft className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Convert {formatQuantity(quantity)} {formatUnit(unit)} {ingredientName}
          </p>
          <div className="space-y-1">
            {topConversions.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm rounded-md px-2 py-1 hover:bg-muted"
              >
                <span>
                  {formatQuantity(c.quantity)} {c.unit}
                </span>
                {c.approximate && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Info className="h-2.5 w-2.5" />
                    approx
                  </span>
                )}
              </div>
            ))}
          </div>
          {hasDensityData(ingredientName) && (
            <p className="text-[10px] text-muted-foreground pt-1 border-t">
              Cross-type conversions use ingredient density approximations
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface SystemToggleProps {
  targetSystem: "metric" | "imperial" | null;
  onToggle: (system: "metric" | "imperial" | null) => void;
}

export function SystemToggle({ targetSystem, onToggle }: SystemToggleProps) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <Button
        variant={targetSystem === null ? "secondary" : "ghost"}
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={() => onToggle(null)}
      >
        Original
      </Button>
      <Button
        variant={targetSystem === "metric" ? "secondary" : "ghost"}
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={() => onToggle("metric")}
      >
        Metric
      </Button>
      <Button
        variant={targetSystem === "imperial" ? "secondary" : "ghost"}
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={() => onToggle("imperial")}
      >
        Imperial
      </Button>
    </div>
  );
}
