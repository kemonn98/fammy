"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VisibilityFilter } from "@/lib/types";
import { cn } from "@/lib/utils";

const options: { value: VisibilityFilter; label: string }[] = [
  { value: "shared", label: "Shared" },
  { value: "mine", label: "Personal" },
];

interface VisibilityToggleProps {
  value: VisibilityFilter;
  onChange: (value: VisibilityFilter) => void;
  counts?: Partial<Record<VisibilityFilter, number>>;
}

export function VisibilityToggle({ value, onChange, counts }: VisibilityToggleProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as VisibilityFilter)}>
      <TabsList className="w-full">
        {options.map((opt) => {
          const count = counts?.[opt.value];
          return (
          <TabsTrigger
            key={opt.value}
            value={opt.value}
            className="border-0 data-active:bg-white data-active:shadow-none"
          >
            {opt.label}
            {count !== undefined && (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  value === opt.value
                    ? "bg-primary/15 text-primary"
                    : "bg-primary/15 text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
