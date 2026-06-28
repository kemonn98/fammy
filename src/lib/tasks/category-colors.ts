import type { Task } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  belanja: "bg-amber-500",
  rumah: "bg-sky-500",
  acara: "bg-violet-500",
  hewan: "bg-emerald-500",
  kesehatan: "bg-rose-500",
  lainnya: "bg-muted-foreground/50",
};

export function getCategoryDotColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.lainnya;
}

export function getEventDotsForDay(events: Task[]): {
  dots: string[];
  overflow: number;
} {
  const colors = events.map((e) => getCategoryDotColor(e.category));
  if (colors.length <= 3) {
    return { dots: colors, overflow: 0 };
  }
  return { dots: colors.slice(0, 3), overflow: colors.length - 3 };
}
