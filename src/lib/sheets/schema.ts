import type { PushSubscriptionRecord, Task } from "@/lib/types";

export const TASK_COLUMNS = [
  "id",
  "title",
  "note",
  "type",
  "visibility",
  "assignee",
  "createdBy",
  "dueDate",
  "dueTime",
  "repeat",
  "repeatInterval",
  "repeatUntil",
  "priority",
  "category",
  "status",
  "completedAt",
  "completedBy",
  "remindBefore",
  "updatedAt",
  "deleted",
  "recurrenceParentId",
  "lastNotifiedAt",
] as const;

export const PUSH_COLUMNS = [
  "id",
  "userEmail",
  "endpoint",
  "p256dh",
  "auth",
  "createdAt",
  "deleted",
] as const;

export const SETTINGS_COLUMNS = ["key", "value"] as const;

export const TASK_TAB = "tasks";
export const PUSH_TAB = "push_subscriptions";
export const SETTINGS_TAB = "settings";

function parseBool(value: string | undefined): boolean {
  return value === "true";
}

function parseNullableNumber(value: string | undefined): number | null {
  if (!value || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function parseNullableString(value: string | undefined): string | null {
  if (!value || value === "") return null;
  return value;
}

export function rowToTask(row: string[]): Task | null {
  if (!row[0] || row[0] === "id") return null;

  return {
    id: row[0],
    title: row[1] ?? "",
    note: row[2] ?? "",
    type: (row[3] as Task["type"]) || "todo",
    visibility: (row[4] as Task["visibility"]) || "shared",
    assignee: row[5] ?? "both",
    createdBy: row[6] ?? "",
    dueDate: parseNullableString(row[7]),
    dueTime: parseNullableString(row[8]),
    repeat: (row[9] as Task["repeat"]) || "none",
    repeatInterval: parseNullableNumber(row[10]),
    repeatUntil: parseNullableString(row[11]),
    priority: (row[12] as Task["priority"]) || "medium",
    category: row[13] ?? "",
    status: (row[14] as Task["status"]) || "active",
    completedAt: parseNullableString(row[15]),
    completedBy: parseNullableString(row[16]),
    remindBefore: parseNullableNumber(row[17]),
    updatedAt: row[18] ?? new Date().toISOString(),
    deleted: parseBool(row[19]),
    recurrenceParentId: parseNullableString(row[20]),
    lastNotifiedAt: parseNullableString(row[21]),
  };
}

export function taskToRow(task: Task): string[] {
  return [
    task.id,
    task.title,
    task.note,
    task.type,
    task.visibility,
    task.assignee,
    task.createdBy,
    task.dueDate ?? "",
    task.dueTime ?? "",
    task.repeat,
    task.repeatInterval?.toString() ?? "",
    task.repeatUntil ?? "",
    task.priority,
    task.category,
    task.status,
    task.completedAt ?? "",
    task.completedBy ?? "",
    task.remindBefore?.toString() ?? "",
    task.updatedAt,
    task.deleted ? "true" : "false",
    task.recurrenceParentId ?? "",
    task.lastNotifiedAt ?? "",
  ];
}

export function rowToPushSubscription(
  row: string[],
): PushSubscriptionRecord | null {
  if (!row[0] || row[0] === "id") return null;

  return {
    id: row[0],
    userEmail: row[1] ?? "",
    endpoint: row[2] ?? "",
    p256dh: row[3] ?? "",
    auth: row[4] ?? "",
    createdAt: row[5] ?? new Date().toISOString(),
    deleted: parseBool(row[6]),
  };
}

export function pushSubscriptionToRow(sub: PushSubscriptionRecord): string[] {
  return [
    sub.id,
    sub.userEmail,
    sub.endpoint,
    sub.p256dh,
    sub.auth,
    sub.createdAt,
    sub.deleted ? "true" : "false",
  ];
}

export function getTaskHeaders(): string[][] {
  return [Array.from(TASK_COLUMNS)];
}

export function getPushHeaders(): string[][] {
  return [Array.from(PUSH_COLUMNS)];
}

export function getSettingsHeaders(): string[][] {
  return [Array.from(SETTINGS_COLUMNS)];
}
