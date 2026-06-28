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
import { createId, nowIso, todayInAppTz } from "@/lib/utils";

function startOfTodayInAppTz(): Date {
  return startOfDay(parseISO(todayInAppTz()));
}

export function getNextDueDate(
  currentDueDate: string | null,
  repeat: Repeat,
  repeatInterval: number | null,
): string | null {
  const base = currentDueDate
    ? startOfDay(parseISO(currentDueDate))
    : startOfTodayInAppTz();

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
      if (isBefore(parseISO(task.repeatUntil), startOfTodayInAppTz())) {
        return false;
      }
    } catch {
      return false;
    }
  }

  if (!task.dueDate) return true;

  try {
    const due = startOfDay(parseISO(task.dueDate));
    const today = startOfTodayInAppTz();
    return due.getTime() <= today.getTime();
  } catch {
    return false;
  }
}

export function createRecurringInstance(parent: Task): Task {
  const today = todayInAppTz();
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
    parent.dueDate ?? todayInAppTz(),
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

    const todayStr = todayInAppTz();
    const hasInstanceToday = tasks.some(
      (t) =>
        t.recurrenceParentId === parent.id &&
        t.dueDate === todayStr &&
        !t.deleted,
    );

    if (!hasInstanceToday) {
      updates.push(createRecurringInstance(parent));
    }
  }

  return updates;
}
