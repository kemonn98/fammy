import { isToday, isTomorrow, parseISO, startOfDay } from "date-fns";
import type { Task, VisibilityFilter } from "@/lib/types";

export function canViewTask(task: Task, userEmail: string): boolean {
  if (task.deleted) return false;
  if (task.visibility === "shared") return true;
  if (task.createdBy === userEmail) return true;
  if (task.assignee === "both") return true;
  if (task.assignee === userEmail) return true;
  return false;
}

export function matchesVisibilityFilter(
  task: Task,
  filter: VisibilityFilter,
  userEmail: string,
): boolean {
  if (filter === "all") return true;
  if (filter === "shared") return task.visibility === "shared";
  if (filter === "mine") {
    return (
      task.assignee === userEmail ||
      task.assignee === "both" ||
      task.createdBy === userEmail
    );
  }
  return true;
}

export function isActiveTask(task: Task): boolean {
  return task.status === "active" && !task.deleted;
}

export function isDueTodayOrNoDate(task: Task): boolean {
  if (!task.dueDate) return true;
  try {
    return isToday(parseISO(task.dueDate));
  } catch {
    return false;
  }
}

export function isEventTodayOrTomorrow(task: Task): boolean {
  if (!task.dueDate || task.type !== "event") return false;
  try {
    const date = parseISO(task.dueDate);
    return isToday(date) || isTomorrow(date);
  } catch {
    return false;
  }
}

export function groupTasksByDate(tasks: Task[]): Record<string, Task[]> {
  const groups: Record<string, Task[]> = {
    "Tanpa tanggal": [],
    "Hari ini": [],
    Besok: [],
    Mendatang: [],
    Selesai: [],
  };

  const today = startOfDay(new Date());

  for (const task of tasks) {
    if (task.status === "done" || task.status === "skipped") {
      groups["Selesai"].push(task);
      continue;
    }

    if (!task.dueDate) {
      groups["Tanpa tanggal"].push(task);
      continue;
    }

    try {
      const date = parseISO(task.dueDate);
      if (isToday(date)) {
        groups["Hari ini"].push(task);
      } else if (isTomorrow(date)) {
        groups["Besok"].push(task);
      } else if (date >= today) {
        groups["Mendatang"].push(task);
      } else {
        groups["Hari ini"].push(task);
      }
    } catch {
      groups["Tanpa tanggal"].push(task);
    }
  }

  return groups;
}

export const CATEGORIES = [
  // Tugas harian
  "belanja",
  "rumah",
  "kebersihan",
  "masak",
  "cucian",
  "finansial",
  "kerja",
  "anak",
  "hewan",
  // Agenda & acara
  "acara",
  "pertemuan",
  "kesehatan",
  "olahraga",
  "keluarga",
  "ulang tahun",
  "liburan",
  "pesta",
  "pendidikan",
  "kerohanian",
  "transport",
  "lainnya",
] as const;
