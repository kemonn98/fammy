import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteTasks, getAllTasks, upsertTasks } from "@/lib/sheets/client";
import { canViewTask } from "@/lib/tasks/filters";
import {
  notifyPartnerOfCompletedSharedTask,
  wasSharedTaskJustCompleted,
} from "@/lib/push/notify-shared-task";
import { taskSchema, toTask } from "@/lib/tasks/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const tasks = await getAllTasks();
  const task = tasks.find((t) => t.id === id);

  if (!task || !canViewTask(task, session.user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const tasks = await getAllTasks();
  const existing = tasks.find((t) => t.id === id);

  if (!existing || !canViewTask(existing, session.user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = taskSchema.parse({ ...existing, ...body, id });
    const task = toTask(parsed, session.user.email, id);
    task.updatedAt = new Date().toISOString();

    await upsertTasks([task]);

    if (wasSharedTaskJustCompleted(existing, task, session.user.email)) {
      try {
        await notifyPartnerOfCompletedSharedTask(task, session.user.email);
      } catch (error) {
        console.error("Partner complete notify failed:", task.id, error);
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal memperbarui tugas" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const tasks = await getAllTasks();
  const existing = tasks.find((t) => t.id === id);

  if (!existing || !canViewTask(existing, session.user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteTasks([id]);
  return NextResponse.json({ ok: true, id });
}
