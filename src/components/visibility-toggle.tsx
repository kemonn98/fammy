"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VisibilityFilter } from "@/lib/types";

const options: { value: VisibilityFilter; label: string }[] = [
  { value: "mine", label: "Personal" },
  { value: "shared", label: "Shared" },
];

interface VisibilityToggleProps {
  value: VisibilityFilter;
  onChange: (value: VisibilityFilter) => void;
}

export function VisibilityToggle({ value, onChange }: VisibilityToggleProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as VisibilityFilter)}>
      <TabsList className="w-full">
        {options.map((opt) => (
          <TabsTrigger
            key={opt.value}
            value={opt.value}
            className="border-0 data-active:bg-white data-active:shadow-none"
          >
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
