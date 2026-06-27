import { addMinutes, format, parseISO } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { unauthorizedCron, verifyCronSecret } from "@/lib/cron-auth";
import {
  getAllPushSubscriptions,
  getAllTasks,
  upsertTasks,
} from "@/lib/sheets/client";
import { isActiveTask } from "@/lib/tasks/filters";
import { sendPushToAll } from "@/lib/push/send";
import { nowIso } from "@/lib/utils";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) return unauthorizedCron();

  try {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const tasks = await getAllTasks();
    const subscriptions = await getAllPushSubscriptions();
    const toNotify: typeof tasks = [];

    for (const task of tasks) {
      if (!isActiveTask(task) || task.type !== "event") continue;
      if (!task.dueDate || task.dueDate !== todayStr || !task.dueTime) continue;

      const [hours, minutes] = task.dueTime.split(":").map(Number);
      const eventTime = new Date(now);
      eventTime.setHours(hours, minutes, 0, 0);

      const remindAt = addMinutes(eventTime, -(task.remindBefore ?? 0));
      const diffMs = Math.abs(now.getTime() - remindAt.getTime());
      if (diffMs > 60 * 1000) continue;

      if (task.lastNotifiedAt) {
        const last = parseISO(task.lastNotifiedAt);
        if (Math.abs(now.getTime() - last.getTime()) < 5 * 60 * 1000) continue;
      }

      toNotify.push(task);
    }

    for (const task of toNotify) {
      const targetSubs = subscriptions.filter(
        (s) =>
          s.userEmail === task.assignee ||
          task.assignee === "both" ||
          s.userEmail === task.createdBy,
      );

      if (targetSubs.length === 0) {
        await sendPushToAll(subscriptions, {
          title: task.title,
          body: task.note || `Event ${task.dueTime}`,
          url: "/today",
        });
      } else {
        await sendPushToAll(targetSubs, {
          title: task.title,
          body: task.note || `Event ${task.dueTime}`,
          url: "/today",
        });
      }

      await upsertTasks([
        { ...task, lastNotifiedAt: nowIso(), updatedAt: nowIso() },
      ]);
    }

    return NextResponse.json({ ok: true, notified: toNotify.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Reminders failed" }, { status: 500 });
  }
}
