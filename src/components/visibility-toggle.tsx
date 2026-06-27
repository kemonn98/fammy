"use client";

import { cn } from "@/lib/utils";
import type { VisibilityFilter } from "@/lib/types";

const options: { value: VisibilityFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "mine", label: "Milikku" },
  { value: "shared", label: "Bersama" },
];

interface VisibilityToggleProps {
  value: VisibilityFilter;
  onChange: (value: VisibilityFilter) => void;
}

export function VisibilityToggle({ value, onChange }: VisibilityToggleProps) {
  return (
    <div className="flex rounded-2xl bg-stone-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all",
            value === opt.value
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
