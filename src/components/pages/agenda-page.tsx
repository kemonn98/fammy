"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Task, VisibilityFilter } from "@/lib/types";
import { completeTaskLocal } from "@/lib/sync/engine";
import { canViewTask, matchesVisibilityFilter } from "@/lib/tasks/filters";
import { useTasks } from "@/hooks/use-tasks";
import { VisibilityToggle } from "@/components/visibility-toggle";
import { TaskItem } from "@/components/task-item";
import { AddTaskForm } from "@/components/add-task-form";
import { AgendaCalendar } from "@/components/agenda-calendar";
import { Button } from "@/components/ui/button";

interface AgendaPageClientProps {
  partnerEmail: string | null;
}

export function AgendaPageClient({ partnerEmail }: AgendaPageClientProps) {
  const { data: session } = useSession();
  const tasks = useTasks();
  const userEmail = session?.user?.email ?? "";
  const [filter, setFilter] = useState<VisibilityFilter>("all");
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
          canViewTask(t, userEmail) &&
          matchesVisibilityFilter(t, filter, userEmail),
      ),
    [tasks, userEmail, filter],
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
        .sort((a, b) => (a.dueTime ?? "99:99").localeCompare(b.dueTime ?? "99:99")),
    [events, selectedDate],
  );

  async function handleComplete(task: Task) {
    if (!userEmail) return;
    await completeTaskLocal(task, userEmail);
  }

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="space-y-6">
      <VisibilityToggle value={filter} onChange={setFilter} />

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

        {dayEvents.length === 0 ? (
          <p className="rounded-xl bg-muted/50 px-4 py-10 text-center text-sm text-muted-foreground">
            Tidak ada agenda di tanggal ini
          </p>
        ) : (
          <div className="space-y-2">
            {dayEvents.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={task.status === "active" ? handleComplete : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <AddTaskForm
        key={format(selectedDate, "yyyy-MM-dd")}
        variant="inline"
        userEmail={userEmail}
        partnerEmail={partnerEmail}
        defaultType="event"
        defaultDate={format(selectedDate, "yyyy-MM-dd")}
        onSaved={() => undefined}
      />
    </div>
  );
}
