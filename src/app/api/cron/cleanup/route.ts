import { NextRequest, NextResponse } from "next/server";
import { unauthorizedCron, verifyCronSecret } from "@/lib/cron-auth";
import { deleteTasks, getAllTasks } from "@/lib/sheets/client";
import { findExpiredDoneTodos } from "@/lib/tasks/cleanup";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) return unauthorizedCron();

  try {
    const tasks = await getAllTasks();
    const expired = findExpiredDoneTodos(tasks);

    if (expired.length > 0) {
      await deleteTasks(expired.map((t) => t.id));
    }

    return NextResponse.json({
      ok: true,
      deleted: expired.length,
      ids: expired.map((t) => t.id),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
