"use client";

import { useState } from "react";
import { Input } from "@/src/components/ui/input";

interface ServingScalerProps {
  baseServings: number;
  onChange: (scaleFactor: number) => void;
}

export function ServingScaler({ baseServings, onChange }: ServingScalerProps) {
  const [servings, setServings] = useState(baseServings.toString());

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setServings(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 1) {
      onChange(num / baseServings);
    }
  }

  function handleBlur() {
    const num = parseInt(servings, 10);
    if (isNaN(num) || num < 1) {
      setServings(baseServings.toString());
      onChange(1);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={1}
        value={servings}
        onChange={handleChange}
        onBlur={handleBlur}
        className="h-8 w-16 text-center text-sm"
      />
      <span className="text-sm text-muted-foreground">servings</span>
    </div>
  );
}
