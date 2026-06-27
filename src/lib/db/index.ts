import Dexie, { type Table } from "dexie";
import type { LocalTask, PendingMutation, SyncMeta } from "@/lib/types";

export class FammyDB extends Dexie {
  tasks!: Table<LocalTask, string>;
  pendingMutations!: Table<PendingMutation, string>;
  meta!: Table<SyncMeta, string>;

  constructor() {
    super("fammy");
    this.version(1).stores({
      tasks: "id, status, dueDate, visibility, assignee, updatedAt, syncStatus",
      pendingMutations: "id, mutationId, clientTimestamp",
      meta: "key",
    });
  }
}

export const db = typeof window !== "undefined" ? new FammyDB() : (null as unknown as FammyDB);

export function getDb(): FammyDB {
  if (!db) throw new Error("IndexedDB is only available in the browser");
  return db;
}
