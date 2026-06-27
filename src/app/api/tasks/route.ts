import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllTasks } from "@/lib/sheets/client";
import { canViewTask } from "@/lib/tasks/filters";
import { taskSchema, toTask } from "@/lib/tasks/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tasks = await getAllTasks();
    const visible = tasks.filter((t) =>
      canViewTask(t, session.user!.email!),
    );
    return NextResponse.json(visible);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal memuat tugas" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = taskSchema.parse(body);
    const task = toTask(parsed, session.user.email);

    const { upsertTasks } = await import("@/lib/sheets/client");
    await upsertTasks([task]);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal membuat tugas" },
      { status: 500 },
    );
  }
}
