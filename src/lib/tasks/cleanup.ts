import type { Task } from "@/lib/types";

export const DONE_TODO_RETENTION_MS = 48 * 60 * 60 * 1000;

export function isExpiredDoneTodo(
  task: Task,
  nowMs = Date.now(),
): boolean {
  if (task.type !== "todo") return false;
  if (task.status !== "done") return false;
  if (!task.completedAt) return false;

  const completedMs = new Date(task.completedAt).getTime();
  if (Number.isNaN(completedMs)) return false;

  return nowMs - completedMs > DONE_TODO_RETENTION_MS;
}

export function findExpiredDoneTodos(tasks: Task[]): Task[] {
  const nowMs = Date.now();
  return tasks.filter((task) => isExpiredDoneTodo(task, nowMs));
}
