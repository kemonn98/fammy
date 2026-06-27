import { z } from "zod";
import type { Task } from "@/lib/types";

export const taskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  note: z.string().default(""),
  type: z.enum(["todo", "event"]).default("todo"),
  visibility: z.enum(["private", "shared"]).default("shared"),
  assignee: z.string().default("both"),
  createdBy: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  dueTime: z.string().nullable().optional(),
  repeat: z
    .enum(["none", "daily", "weekly", "monthly", "custom"])
    .default("none"),
  repeatInterval: z.number().nullable().optional(),
  repeatUntil: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().default("lainnya"),
  status: z.enum(["active", "done", "skipped"]).default("active"),
  completedAt: z.string().nullable().optional(),
  completedBy: z.string().nullable().optional(),
  remindBefore: z.number().nullable().optional(),
  updatedAt: z.string().optional(),
  deleted: z.boolean().default(false),
  recurrenceParentId: z.string().nullable().optional(),
  lastNotifiedAt: z.string().nullable().optional(),
});

export function toTask(
  input: z.infer<typeof taskSchema>,
  userEmail: string,
  id?: string,
): Task {
  const now = new Date().toISOString();
  return {
    id: id ?? input.id ?? crypto.randomUUID(),
    title: input.title,
    note: input.note ?? "",
    type: input.type,
    visibility: input.visibility,
    assignee: input.assignee,
    createdBy: input.createdBy ?? userEmail,
    dueDate: input.dueDate ?? null,
    dueTime: input.dueTime ?? null,
    repeat: input.repeat,
    repeatInterval: input.repeatInterval ?? null,
    repeatUntil: input.repeatUntil ?? null,
    priority: input.priority,
    category: input.category,
    status: input.status,
    completedAt: input.completedAt ?? null,
    completedBy: input.completedBy ?? null,
    remindBefore: input.remindBefore ?? null,
    updatedAt: input.updatedAt ?? now,
    deleted: input.deleted ?? false,
    recurrenceParentId: input.recurrenceParentId ?? null,
    lastNotifiedAt: input.lastNotifiedAt ?? null,
  };
}
