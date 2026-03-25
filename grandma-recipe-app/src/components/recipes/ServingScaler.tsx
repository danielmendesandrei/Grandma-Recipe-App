"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface ServingScalerProps {
  baseServings: number;
  onChange: (scaleFactor: number) => void;
}

export function ServingScaler({ baseServings, onChange }: ServingScalerProps) {
  const [servings, setServings] = useState(baseServings);

  function update(newServings: number) {
    if (newServings < 1) return;
    setServings(newServings);
    onChange(newServings / baseServings);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => update(servings - 1)}
        disabled={servings <= 1}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="text-sm font-medium w-20 text-center">
        {servings} serving{servings !== 1 ? "s" : ""}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => update(servings + 1)}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
