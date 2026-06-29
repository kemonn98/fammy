"use client";

import { useMemo, useState } from "react";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Task } from "@/lib/types";
import { completeTaskLocal } from "@/lib/sync/engine";
import { canViewTask } from "@/lib/tasks/filters";
import { useTasks } from "@/hooks/use-tasks";
import { TaskItem } from "@/components/task-item";
import { AddTaskForm } from "@/components/add-task-form";
import { AgendaCalendar } from "@/components/agenda-calendar";
import { Button } from "@/components/ui/button";

interface AgendaPageClientProps {
  userEmail: string;
}

export function AgendaPageClient({ userEmail }: AgendaPageClientProps) {
  const tasks = useTasks();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [month, setMonth] = useState<Date>(startOfDay(new Date()));

  const events = useMemo(
    () =>
      tasks.filter(
        (t) =>
          !t.deleted &&
          t.type === "event" &&
          t.dueDate &&
          t.status !== "skipped" &&
          canViewTask(t, userEmail),
      ),
    [tasks, userEmail],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const event of events) {
      if (!event.dueDate) continue;
      const list = map.get(event.dueDate) ?? [];
      list.push(event);
      map.set(event.dueDate, list);
    }
    return map;
  }, [events]);

  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => {
          try {
            return isSameDay(parseISO(e.dueDate as string), selectedDate);
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          const byTime = (a.dueTime ?? "99:99").localeCompare(
            b.dueTime ?? "99:99",
          );
          if (byTime !== 0) return byTime;
          return a.updatedAt.localeCompare(b.updatedAt);
        }),
    [events, selectedDate],
  );

  async function handleComplete(task: Task) {
    if (!userEmail) return;
    await completeTaskLocal(task, userEmail);
  }

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-card p-2 ring-1 ring-foreground/10">
        <AgendaCalendar
          mode="single"
          required
          selected={selectedDate}
          onSelect={(date: Date | undefined) => date && setSelectedDate(date)}
          month={month}
          onMonthChange={setMonth}
          locale={idLocale}
          eventsByDate={eventsByDate}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">
            {format(selectedDate, "EEEE, d MMMM yyyy", { locale: idLocale })}
          </h2>
          {!isToday && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = startOfDay(new Date());
                setSelectedDate(today);
                setMonth(today);
              }}
            >
              Hari ini
            </Button>
          )}
        </div>

        {dayEvents.length > 0 && (
          <div className="space-y-2">
            {dayEvents.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                userEmail={userEmail}
                onComplete={
                  task.status === "active" ? handleComplete : undefined
                }
              />
            ))}
          </div>
        )}

        <AddTaskForm
          key={format(selectedDate, "yyyy-MM-dd")}
          userEmail={userEmail}
          type="event"
          defaultDate={format(selectedDate, "yyyy-MM-dd")}
          onSaved={() => undefined}
        />
      </div>
    </div>
  );
}
