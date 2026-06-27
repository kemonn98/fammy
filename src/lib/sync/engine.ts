import type { LocalTask, PendingMutation, SyncResponse, Task } from "@/lib/types";
import { getDb } from "@/lib/db";
import { advanceRecurringParent } from "@/lib/recurring";
import { createId, nowIso } from "@/lib/utils";

export async function enqueueMutation(
  action: PendingMutation["action"],
  payload: Task,
): Promise<void> {
  const database = getDb();
  await database.pendingMutations.put({
    id: payload.id,
    mutationId: createId(),
    action,
    payload,
    clientTimestamp: nowIso(),
    retryCount: 0,
  });
  await database.tasks.put({ ...payload, syncStatus: "pending" });
}

export async function saveTaskLocally(
  task: Task,
  syncStatus: LocalTask["syncStatus"] = "pending",
): Promise<void> {
  await getDb().tasks.put({ ...task, syncStatus });
}

export async function mergeServerTasks(tasks: Task[]): Promise<void> {
  const database = getDb();
  const pendingIds = new Set(
    (await database.pendingMutations.toArray()).map((m) => m.id),
  );

  await database.transaction("rw", database.tasks, async () => {
    for (const task of tasks) {
      if (pendingIds.has(task.id)) {
        const local = await database.tasks.get(task.id);
        if (local && local.updatedAt > task.updatedAt) {
          await database.tasks.put({ ...local, syncStatus: "conflict" });
          continue;
        }
      }
      await database.tasks.put({
        ...task,
        syncStatus: pendingIds.has(task.id) ? "pending" : "synced",
      });
    }
  });
}

export async function pullFromServer(): Promise<Task[]> {
  const res = await fetch("/api/tasks", { credentials: "include" });
  if (!res.ok) throw new Error("Gagal memuat data");
  const tasks: Task[] = await res.json();
  await mergeServerTasks(tasks);
  await getDb().meta.put({ key: "lastPullAt", value: nowIso() });
  return tasks;
}

export async function pushToServer(): Promise<SyncResponse | null> {
  const database = getDb();
  const mutations = await database.pendingMutations.toArray();
  if (mutations.length === 0) return null;

  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ mutations }),
  });

  if (!res.ok) throw new Error("Gagal sinkronisasi");

  const result: SyncResponse = await res.json();
  await mergeServerTasks(result.tasks);

  for (const id of result.applied) {
    await database.pendingMutations.where("id").equals(id).delete();
    const task = await database.tasks.get(id);
    if (task) {
      await database.tasks.put({ ...task, syncStatus: "synced" });
    }
  }

  for (const id of result.conflicts) {
    const task = await database.tasks.get(id);
    if (task) {
      await database.tasks.put({ ...task, syncStatus: "conflict" });
    }
  }

  await database.meta.put({ key: "lastPushAt", value: nowIso() });
  return result;
}

export async function syncAll(): Promise<void> {
  if (!navigator.onLine) return;
  try {
    await pushToServer();
    await pullFromServer();
  } catch (error) {
    console.error("Sync error:", error);
  }
}

export async function createTaskLocal(task: Task): Promise<void> {
  await saveTaskLocally(task, "pending");
  await enqueueMutation("create", task);
  void syncAll();
}

export async function updateTaskLocal(task: Task): Promise<void> {
  const updated = { ...task, updatedAt: nowIso() };
  await saveTaskLocally(updated, "pending");
  await enqueueMutation("update", updated);
  void syncAll();
}

export async function deleteTaskLocal(task: Task): Promise<void> {
  const deleted = {
    ...task,
    deleted: true,
    updatedAt: nowIso(),
  };
  await saveTaskLocally(deleted, "pending");
  await enqueueMutation("delete", deleted);
  void syncAll();
}

export async function completeTaskLocal(
  task: Task,
  userEmail: string,
): Promise<void> {
  if (task.repeat !== "none" && !task.recurrenceParentId) {
    const advanced = advanceRecurringParent({
      ...task,
      completedAt: nowIso(),
      completedBy: userEmail,
    });
    await updateTaskLocal(advanced);
    return;
  }

  const completed: Task = {
    ...task,
    status: "done",
    completedAt: nowIso(),
    completedBy: userEmail,
    updatedAt: nowIso(),
  };
  await updateTaskLocal(completed);
}

export function hasConflicts(): Promise<boolean> {
  return getDb()
    .tasks.filter((t) => t.syncStatus === "conflict")
    .count()
    .then((c) => c > 0);
}

export async function resolveConflictsByPull(): Promise<void> {
  await pullFromServer();
  const database = getDb();
  const conflicts = await database.tasks
    .filter((t) => t.syncStatus === "conflict")
    .toArray();
  for (const task of conflicts) {
    await database.tasks.put({ ...task, syncStatus: "synced" });
    await database.pendingMutations.where("id").equals(task.id).delete();
  }
}
