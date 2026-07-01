import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteTasks, getAllTasks, upsertTasks } from "@/lib/sheets/client";
import { canViewTask } from "@/lib/tasks/filters";
import {
  notifyPartnerOfCompletedSharedTask,
  notifyPartnerOfNewSharedTask,
  wasSharedTaskJustCompleted,
} from "@/lib/push/notify-shared-task";
import type { PendingMutation, SyncResponse, Task } from "@/lib/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const mutations: PendingMutation[] = body.mutations ?? [];
    const existing = await getAllTasks();
    const byId = new Map(existing.map((t) => [t.id, t]));
    const applied: string[] = [];
    const conflicts: string[] = [];
    const upserts: Task[] = [];
    const deleteIds: string[] = [];
    const newSharedTasks: Task[] = [];
    const completedSharedTasks: Task[] = [];
    const userEmail = session.user.email;

    for (const mutation of mutations) {
      const { payload, action } = mutation;
      if (action !== "create" && !canViewTask(payload, userEmail)) {
        continue;
      }

      const serverTask = byId.get(payload.id);

      if (serverTask && serverTask.updatedAt > payload.updatedAt) {
        conflicts.push(payload.id);
        continue;
      }

      if (action === "delete") {
        deleteIds.push(payload.id);
        byId.delete(payload.id);
      } else {
        const updated = {
          ...payload,
          deleted: false,
          updatedAt: new Date().toISOString(),
        };
        byId.set(payload.id, updated);
        upserts.push(updated);

        if (
          action === "create" &&
          !serverTask &&
          updated.visibility === "shared"
        ) {
          newSharedTasks.push(updated);
        }

        if (wasSharedTaskJustCompleted(serverTask, updated, userEmail)) {
          completedSharedTasks.push(updated);
        }
      }
      applied.push(payload.id);
    }

    if (deleteIds.length > 0) await deleteTasks(deleteIds);
    if (upserts.length > 0) await upsertTasks(upserts);

    for (const task of newSharedTasks) {
      try {
        await notifyPartnerOfNewSharedTask(task, userEmail);
      } catch (error) {
        console.error("Partner notify failed:", task.id, error);
      }
    }

    for (const task of completedSharedTasks) {
      try {
        await notifyPartnerOfCompletedSharedTask(task, userEmail);
      } catch (error) {
        console.error("Partner complete notify failed:", task.id, error);
      }
    }

    const visible = Array.from(byId.values()).filter((t) =>
      canViewTask(t, userEmail),
    );

    const response: SyncResponse = {
      tasks: visible,
      applied,
      conflicts,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal sinkronisasi" },
      { status: 500 },
    );
  }
}
