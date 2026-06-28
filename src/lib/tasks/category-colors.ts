import type { Task } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  belanja: "bg-amber-500",
  rumah: "bg-sky-500",
  kebersihan: "bg-cyan-500",
  masak: "bg-orange-500",
  cucian: "bg-blue-400",
  finansial: "bg-emerald-600",
  kerja: "bg-indigo-500",
  anak: "bg-pink-500",
  hewan: "bg-emerald-500",
  acara: "bg-violet-500",
  pertemuan: "bg-purple-500",
  kesehatan: "bg-rose-500",
  olahraga: "bg-lime-600",
  keluarga: "bg-fuchsia-500",
  "ulang tahun": "bg-yellow-500",
  liburan: "bg-teal-500",
  pesta: "bg-pink-400",
  pendidikan: "bg-indigo-400",
  kerohanian: "bg-amber-700",
  transport: "bg-blue-600",
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
