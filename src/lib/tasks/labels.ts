import type { Task } from "@/lib/types";
import { CATEGORIES } from "@/lib/tasks/filters";

export const REPEAT_LABELS: Record<Task["repeat"], string> = {
  none: "No repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  custom: "Every 14 days",
};

export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  belanja: "Shopping",
  rumah: "Home",
  kebersihan: "Cleaning",
  masak: "Cooking",
  cucian: "Laundry",
  finansial: "Finance",
  kerja: "Work",
  anak: "Kids",
  hewan: "Pets",
  acara: "Event",
  pertemuan: "Meeting",
  kesehatan: "Health",
  olahraga: "Exercise",
  keluarga: "Family",
  "ulang tahun": "Birthday",
  liburan: "Holiday",
  pesta: "Party",
  pendidikan: "Education",
  kerohanian: "Spiritual",
  transport: "Transport",
  lainnya: "Other",
};

export function getCategoryLabel(category: string): string {
  return (
    CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category
  );
}
