"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import type { Task } from "@/lib/types";

export function useTasks(): Task[] {
  const tasks = useLiveQuery(
    () => getDb().tasks.filter((t) => !t.deleted).toArray(),
    [],
    [],
  );
  return tasks ?? [];
}
