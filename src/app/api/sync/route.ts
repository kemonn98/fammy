import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllTasks, upsertTasks } from "@/lib/sheets/client";
import { canViewTask } from "@/lib/tasks/filters";
import type { PendingMutation, SyncResponse } from "@/lib/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const mutations: PendingMutation[] = body.mutations ?? [];
    const existing = await getAllTasks();
    const map = new Map(existing.map((t) => [t.id, t]));
    const applied: string[] = [];
    const conflicts: string[] = [];
    const userEmail = session.user.email;

    for (const mutation of mutations) {
      const { payload, action } = mutation;
      if (!canViewTask({ ...payload, deleted: false }, userEmail) && action !== "create") {
        continue;
      }

      const serverTask = map.get(payload.id);

      if (serverTask && serverTask.updatedAt > payload.updatedAt) {
        conflicts.push(payload.id);
        continue;
      }

      if (action === "delete") {
        map.set(payload.id, {
          ...payload,
          deleted: true,
          updatedAt: new Date().toISOString(),
        });
      } else {
        map.set(payload.id, {
          ...payload,
          updatedAt: new Date().toISOString(),
        });
      }
      applied.push(payload.id);
    }

    const allTasks = Array.from(map.values());
    await upsertTasks(allTasks);

    const visible = allTasks.filter((t) => canViewTask(t, userEmail));

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
