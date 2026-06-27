import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isBefore,
  parseISO,
  startOfDay,
} from "date-fns";
import type { Repeat, Task } from "@/lib/types";
import { createId, nowIso } from "@/lib/utils";

export function getNextDueDate(
  currentDueDate: string | null,
  repeat: Repeat,
  repeatInterval: number | null,
): string | null {
  const base = currentDueDate
    ? startOfDay(parseISO(currentDueDate))
    : startOfDay(new Date());

  let next: Date;
  switch (repeat) {
    case "daily":
      next = addDays(base, 1);
      break;
    case "weekly":
      next = addWeeks(base, 1);
      break;
    case "monthly":
      next = addMonths(base, 1);
      break;
    case "custom":
      next = addDays(base, repeatInterval ?? 1);
      break;
    default:
      return null;
  }

  return format(next, "yyyy-MM-dd");
}

export function shouldGenerateRecurringToday(task: Task): boolean {
  if (task.repeat === "none" || task.status !== "active" || task.deleted) {
    return false;
  }

  if (task.repeatUntil) {
    try {
      if (isBefore(parseISO(task.repeatUntil), startOfDay(new Date()))) {
        return false;
      }
    } catch {
      return false;
    }
  }

  if (!task.dueDate) return true;

  try {
    const due = startOfDay(parseISO(task.dueDate));
    const today = startOfDay(new Date());
    return due.getTime() <= today.getTime();
  } catch {
    return false;
  }
}

export function createRecurringInstance(parent: Task): Task {
  const today = format(new Date(), "yyyy-MM-dd");
  return {
    ...parent,
    id: createId(),
    recurrenceParentId: parent.id,
    dueDate: today,
    status: "active",
    completedAt: null,
    completedBy: null,
    lastNotifiedAt: null,
    updatedAt: nowIso(),
    deleted: false,
  };
}

export function advanceRecurringParent(parent: Task): Task {
  const nextDate = getNextDueDate(
    parent.dueDate ?? format(new Date(), "yyyy-MM-dd"),
    parent.repeat,
    parent.repeatInterval,
  );

  return {
    ...parent,
    dueDate: nextDate,
    status: "active",
    completedAt: null,
    completedBy: null,
    updatedAt: nowIso(),
  };
}

export function processRecurringTasks(tasks: Task[]): Task[] {
  const updates: Task[] = [];
  const parents = tasks.filter(
    (t) =>
      t.repeat !== "none" &&
      !t.recurrenceParentId &&
      t.status === "active" &&
      !t.deleted,
  );

  for (const parent of parents) {
    if (!shouldGenerateRecurringToday(parent)) continue;

    const hasInstanceToday = tasks.some(
      (t) =>
        t.recurrenceParentId === parent.id &&
        t.dueDate === format(new Date(), "yyyy-MM-dd") &&
        !t.deleted,
    );

    if (!hasInstanceToday) {
      updates.push(createRecurringInstance(parent));
    }
  }

  return updates;
}
