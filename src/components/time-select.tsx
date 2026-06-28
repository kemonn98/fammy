"use client";

import { TIME_OPTIONS } from "@/lib/tasks/time-options";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__none__";

interface TimeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function TimeSelect({
  value,
  onValueChange,
  placeholder = "Pilih jam",
}: TimeSelectProps) {
  return (
    <Select
      value={value ? value : NONE}
      onValueChange={(v) => onValueChange(v === NONE ? "" : v)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Tanpa jam</SelectItem>
        {TIME_OPTIONS.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
