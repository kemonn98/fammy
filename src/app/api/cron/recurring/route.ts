import { NextRequest, NextResponse } from "next/server";
import { unauthorizedCron, verifyCronSecret } from "@/lib/cron-auth";
import { getAllTasks, upsertTasks } from "@/lib/sheets/client";
import { processRecurringTasks } from "@/lib/recurring";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) return unauthorizedCron();

  try {
    const tasks = await getAllTasks();
    const newInstances = processRecurringTasks(tasks);

    if (newInstances.length > 0) {
      await upsertTasks(newInstances);
    }

    return NextResponse.json({
      ok: true,
      generated: newInstances.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Recurring failed" }, { status: 500 });
  }
}
