import type { LocalTask, PendingMutation, SyncResponse, Task } from "@/lib/types";
import { getDb } from "@/lib/db";
import { advanceRecurringParent } from "@/lib/recurring";
import { createId, nowIso } from "@/lib/utils";
import { withDbRetry } from "@/lib/sync/db-timeout";
import { fetchWithTimeout } from "@/lib/sync/fetch";

let syncInFlight: Promise<void> | null = null;
let syncQueued = false;
let syncAbortController: AbortController | null = null;

export function abortInFlightSync(): void {
  syncAbortController?.abort();
}

export function resumeSync(): void {
  abortInFlightSync();
  void syncAll();
}

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

  if (action === "delete") {
    await database.tasks.delete(payload.id);
  } else {
    await database.tasks.put({ ...payload, syncStatus: "pending" });
  }
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
    const serverIds = new Set(tasks.map((t) => t.id));
    const localTasks = await database.tasks.toArray();

    for (const local of localTasks) {
      if (
        !serverIds.has(local.id) &&
        !pendingIds.has(local.id) &&
        local.syncStatus === "synced"
      ) {
        await database.tasks.delete(local.id);
      }
    }

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

export async function pullFromServer(signal?: AbortSignal): Promise<Task[]> {
  const res = await fetchWithTimeout(
    "/api/tasks",
    { credentials: "include", signal },
  );
  if (!res.ok) throw new Error("Failed to load data");
  const tasks: Task[] = await res.json();
  await mergeServerTasks(tasks);
  await getDb().meta.put({ key: "lastPullAt", value: nowIso() });
  return tasks;
}

export async function pushToServer(
  signal?: AbortSignal,
): Promise<SyncResponse | null> {
  const database = getDb();
  const mutations = await database.pendingMutations.toArray();
  if (mutations.length === 0) return null;

  const res = await fetchWithTimeout("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ mutations }),
    signal,
  });

  if (!res.ok) throw new Error("Sync failed");

  const result: SyncResponse = await res.json();
  await mergeServerTasks(result.tasks);

  const deletedIds = new Set(
    mutations.filter((m) => m.action === "delete").map((m) => m.id),
  );

  for (const id of result.applied) {
    await database.pendingMutations.where("id").equals(id).delete();
    if (deletedIds.has(id)) {
      await database.tasks.delete(id);
      continue;
    }
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

async function runSync(): Promise<void> {
  do {
    syncQueued = false;
    syncAbortController = new AbortController();
    const signal = syncAbortController.signal;

    try {
      await pushToServer(signal);
      if (!signal.aborted) {
        await pullFromServer(signal);
      }
    } catch (error) {
      if (signal.aborted) {
        console.warn("Sync aborted");
      } else {
        console.error("Sync error:", error);
      }
    } finally {
      syncAbortController = null;
    }
  } while (syncQueued && navigator.onLine);
}

export async function syncAll(): Promise<void> {
  if (!navigator.onLine) return;

  if (syncInFlight) {
    syncQueued = true;
    return syncInFlight;
  }

  syncInFlight = runSync().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

export async function createTaskLocal(task: Task): Promise<void> {
  await withDbRetry(async () => {
    await saveTaskLocally(task, "pending");
    await enqueueMutation("create", task);
  });
  void syncAll();
}

export async function updateTaskLocal(task: Task): Promise<void> {
  const updated = { ...task, updatedAt: nowIso() };
  await withDbRetry(async () => {
    await saveTaskLocally(updated, "pending");
    await enqueueMutation("update", updated);
  });
  void syncAll();
}

export async function deleteTaskLocal(task: Task): Promise<void> {
  await withDbRetry(async () => {
    await enqueueMutation("delete", {
      ...task,
      updatedAt: nowIso(),
    });
  });
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

export async function clearLocalTaskData(): Promise<void> {
  abortInFlightSync();
  const database = getDb();
  await database.tasks.clear();
  await database.pendingMutations.clear();
  await database.meta.bulkDelete(["lastPullAt", "lastPushAt"]);
}
