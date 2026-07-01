import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import type { Repeat, Task } from "@/lib/types";
import { nowIso, todayInAppTz, zonedDateTimeToUtcMs } from "@/lib/utils";

const MAX_VIRTUAL_OCCURRENCES = 500;

export type AgendaDayTask = {
  key: string;
  task: Task;
  isVirtualPreview: boolean;
};

function startOfTodayInAppTz(): Date {
  return startOfDay(parseISO(todayInAppTz()));
}

export function isRecurringParent(task: Task): boolean {
  return (
    task.repeat !== "none" &&
    !task.recurrenceParentId &&
    !task.deleted &&
    task.status === "active"
  );
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

/** When the current occurrence is considered finished (app timezone). */
export function getOccurrenceEndUtcMs(task: Task): number | null {
  if (!task.dueDate) return null;
  if (task.dueTime) {
    return zonedDateTimeToUtcMs(task.dueDate, task.dueTime);
  }
  return zonedDateTimeToUtcMs(task.dueDate, "23:59");
}

export function hasOccurrencePassed(
  task: Task,
  nowMs: number = Date.now(),
): boolean {
  const endMs = getOccurrenceEndUtcMs(task);
  if (endMs === null) return false;
  return nowMs > endMs;
}

function isOnOrBeforeRepeatUntil(task: Task, dateStr: string): boolean {
  if (!task.repeatUntil) return true;
  try {
    const until = startOfDay(parseISO(task.repeatUntil));
    const date = startOfDay(parseISO(dateStr));
    return !isBefore(until, date);
  } catch {
    return false;
  }
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
    lastNotifiedAt: null,
    updatedAt: nowIso(),
  };
}

/** Advance parent dueDate to the next future occurrence (server-side). */
export function processRecurringTasks(tasks: Task[]): Task[] {
  const updates: Task[] = [];

  for (const parent of tasks) {
    if (!isRecurringParent(parent)) continue;

    let current = parent;
    let changed = false;

    while (hasOccurrencePassed(current)) {
      const next = advanceRecurringParent(current);
      if (!next.dueDate || next.dueDate === current.dueDate) break;
      if (!isOnOrBeforeRepeatUntil(parent, next.dueDate)) break;
      current = next;
      changed = true;
    }

    if (changed) {
      updates.push(current);
    }
  }

  return updates;
}

/** Virtual occurrence dates for calendar preview (not stored in DB). */
export function getVirtualOccurrenceDatesInRange(
  task: Task,
  rangeStart: Date,
  rangeEnd: Date,
): string[] {
  if (!isRecurringParent(task) || !task.dueDate) return [];

  const dates: string[] = [];
  const rangeStartDay = startOfDay(rangeStart);
  const rangeEndDay = startOfDay(rangeEnd);

  let cursor: string | null = task.dueDate;
  let iterations = 0;

  while (cursor && iterations < MAX_VIRTUAL_OCCURRENCES) {
    iterations++;

    let cursorDate: Date;
    try {
      cursorDate = startOfDay(parseISO(cursor));
    } catch {
      break;
    }

    if (cursorDate > rangeEndDay) break;

    if (cursorDate >= rangeStartDay && isOnOrBeforeRepeatUntil(task, cursor)) {
      dates.push(cursor);
    }

    if (
      task.repeatUntil &&
      isBefore(startOfDay(parseISO(task.repeatUntil)), cursorDate) &&
      !isSameDay(parseISO(task.repeatUntil), cursorDate)
    ) {
      break;
    }

    const next = getNextDueDate(cursor, task.repeat, task.repeatInterval);
    if (!next || next === cursor) break;
    cursor = next;
  }

  return dates;
}

function addEventToMap(
  map: Map<string, Task[]>,
  dateKey: string,
  task: Task,
): void {
  const list = map.get(dateKey) ?? [];
  if (list.some((t) => t.id === task.id)) return;
  list.push(task);
  map.set(dateKey, list);
}

/** Merge real events with virtual recurring occurrences for the calendar. */
export function buildAgendaEventsByDate(
  events: Task[],
  month: Date,
): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  const rangeStart = startOfMonth(month);
  const rangeEnd = endOfMonth(month);

  const parents = events.filter((e) => !e.recurrenceParentId);

  for (const event of parents) {
    if (!event.dueDate) continue;
    addEventToMap(map, event.dueDate, event);
  }

  for (const parent of parents) {
    if (parent.repeat === "none") continue;
    const virtualDates = getVirtualOccurrenceDatesInRange(
      parent,
      rangeStart,
      rangeEnd,
    );
    for (const dateKey of virtualDates) {
      addEventToMap(map, dateKey, parent);
    }
  }

  return map;
}

function sortAgendaDayTasks(a: AgendaDayTask, b: AgendaDayTask): number {
  const byTime = (a.task.dueTime ?? "99:99").localeCompare(
    b.task.dueTime ?? "99:99",
  );
  if (byTime !== 0) return byTime;
  return a.task.updatedAt.localeCompare(b.task.updatedAt);
}

/** Real + virtual recurring tasks for the selected agenda day. */
export function buildAgendaDayTasks(
  events: Task[],
  selectedDate: Date,
): AgendaDayTask[] {
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const dayStart = startOfDay(selectedDate);
  const result: AgendaDayTask[] = [];

  for (const event of events) {
    if (event.dueDate === dateKey) {
      result.push({
        key: event.id,
        task: event,
        isVirtualPreview: false,
      });
    }
  }

  for (const parent of events) {
    if (parent.repeat === "none") continue;
    if (parent.dueDate === dateKey) continue;

    const virtualDates = getVirtualOccurrenceDatesInRange(
      parent,
      dayStart,
      dayStart,
    );
    if (!virtualDates.includes(dateKey)) continue;

    result.push({
      key: `${parent.id}:${dateKey}`,
      task: { ...parent, dueDate: dateKey },
      isVirtualPreview: true,
    });
  }

  return result.sort(sortAgendaDayTasks);
}
