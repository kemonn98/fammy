import { addDays, format, parseISO } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { unauthorizedCron, verifyCronSecret } from "@/lib/cron-auth";
import {
  getAllPushSubscriptions,
  getAllTasks,
  getSettings,
} from "@/lib/sheets/client";
import { isActiveTask } from "@/lib/tasks/filters";
import { sendPushToAll } from "@/lib/push/send";
import { nowPartsInAppTz, parseAllowedEmails, todayInAppTz } from "@/lib/utils";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) return unauthorizedCron();

  try {
    const settings = await getSettings();
    const digestHour = Number(settings.digestHour ?? "7");
    const digestMinute = Number(settings.digestMinute ?? "0");
    const { hour, minute } = nowPartsInAppTz();

    if (hour !== digestHour || minute !== digestMinute) {
      return NextResponse.json({ skipped: true, reason: "not digest time" });
    }

    const tasks = await getAllTasks();
    const todayStr = todayInAppTz();
    const threeDaysLater = format(addDays(parseISO(todayStr), 3), "yyyy-MM-dd");

    const todosToday = tasks.filter(
      (t) =>
        isActiveTask(t) &&
        t.type === "todo" &&
        (!t.dueDate || t.dueDate === todayStr),
    );

    const upcomingEvents = tasks.filter(
      (t) =>
        isActiveTask(t) &&
        t.type === "event" &&
        t.dueDate &&
        t.dueDate >= todayStr &&
        t.dueDate <= threeDaysLater,
    );

    const subscriptions = await getAllPushSubscriptions();
    const allowed = new Set(parseAllowedEmails());

    for (const email of allowed) {
      const userSubs = subscriptions.filter((s) => s.userEmail === email);
      if (userSubs.length === 0) continue;

      const lines: string[] = [];
      if (todosToday.length > 0) {
        lines.push(`${todosToday.length} todo today`);
        todosToday.slice(0, 3).forEach((t) => lines.push(`• ${t.title}`));
      }
      if (upcomingEvents.length > 0) {
        lines.push(`${upcomingEvents.length} upcoming events`);
        upcomingEvents.slice(0, 3).forEach((t) => lines.push(`• ${t.title}`));
      }

      if (lines.length === 0) continue;

      await sendPushToAll(userSubs, {
        title: "Fammy — Today's summary",
        body: lines.join("\n"),
        url: "/today",
      });
    }

    return NextResponse.json({ ok: true, todos: todosToday.length, events: upcomingEvents.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}
