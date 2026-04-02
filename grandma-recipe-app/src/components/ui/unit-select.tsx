"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { getGroupedUnits, resolveUnit } from "@/src/lib/utils/units";
import type { UnitDef } from "@/src/lib/utils/units";
import { cn } from "@/src/lib/utils";

interface UnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Compact mode for inline / small forms */
  compact?: boolean;
}

const groupedUnits = getGroupedUnits();

export function UnitSelect({
  value,
  onChange,
  placeholder = "Unit",
  className,
  compact = false,
}: UnitSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // When we open, show the current value as search
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const resolved = resolveUnit(value);
  const displayValue = resolved ? resolved.abbr : value;

  // Filter units based on search text
  const lowerSearch = search.toLowerCase().trim();
  const filteredGroups = groupedUnits
    .map((group) => ({
      ...group,
      units: group.units.filter(
        (u) =>
          !lowerSearch ||
          u.label.toLowerCase().includes(lowerSearch) ||
          u.abbr.toLowerCase().includes(lowerSearch) ||
          u.value.toLowerCase().includes(lowerSearch)
      ),
    }))
    .filter((group) => group.units.length > 0);

  const hasResults = filteredGroups.some((g) => g.units.length > 0);

  function selectUnit(unit: UnitDef) {
    onChange(unit.value);
    setSearch("");
    setOpen(false);
  }

  function handleInputChange(val: string) {
    setSearch(val);
    onChange(val);
    if (!open) setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      // If search matches a unit exactly, use it
      if (lowerSearch) {
        const match = resolveUnit(lowerSearch);
        if (match) {
          selectUnit(match);
        } else {
          // Custom unit - keep as typed
          onChange(search.trim());
          setOpen(false);
          setSearch("");
        }
      } else {
        setOpen(false);
      }
    }
  }

  const height = compact ? "h-7" : "h-9";
  const textSize = compact ? "text-xs" : "text-sm";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center rounded-md border border-input bg-background ring-offset-background",
          height,
          "cursor-pointer"
        )}
        onClick={() => {
          setOpen(!open);
          setSearch(displayValue || "");
        }}
      >
        <input
          ref={inputRef}
          className={cn(
            "flex-1 bg-transparent px-2 outline-none placeholder:text-muted-foreground",
            textSize,
            "w-full min-w-0"
          )}
          placeholder={placeholder}
          value={open ? search : displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            setOpen(true);
            setSearch(displayValue || "");
          }}
          onKeyDown={handleKeyDown}
        />
        <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50 mr-1" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-[200px] rounded-md border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95 max-h-[260px] overflow-y-auto">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                {group.label}
              </div>
              {group.units.map((unit) => (
                <button
                  key={unit.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    value === unit.value && "bg-accent"
                  )}
                  onClick={() => selectUnit(unit)}
                >
                  <Check
                    className={cn(
                      "h-3 w-3",
                      value === unit.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-medium">{unit.abbr}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {unit.label}
                  </span>
                </button>
              ))}
            </div>
          ))}

          {!hasResults && search.trim() && (
            <div className="px-2 py-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">No matching unit</p>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => {
                  onChange(search.trim());
                  setOpen(false);
                  setSearch("");
                }}
              >
                Use &quot;{search.trim()}&quot; as custom unit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
