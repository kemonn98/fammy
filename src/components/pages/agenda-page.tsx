"use client";

import { useMemo, useState } from "react";
import { format, isSameDay, startOfDay } from "date-fns";
import { enUS } from "date-fns/locale";
import type { Task } from "@/lib/types";
import { completeTaskLocal } from "@/lib/sync/engine";
import { canViewTask } from "@/lib/tasks/filters";
import { buildAgendaEventsByDate, buildAgendaDayTasks } from "@/lib/recurring";
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
          !t.recurrenceParentId &&
          t.type === "event" &&
          t.dueDate &&
          t.status !== "skipped" &&
          canViewTask(t, userEmail),
      ),
    [tasks, userEmail],
  );

  const eventsByDate = useMemo(
    () => buildAgendaEventsByDate(events, month),
    [events, month],
  );

  const dayEvents = useMemo(
    () => buildAgendaDayTasks(events, selectedDate),
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
          locale={enUS}
          eventsByDate={eventsByDate}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">
            {format(selectedDate, "EEEE, d MMMM yyyy", { locale: enUS })}
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
              Today
            </Button>
          )}
        </div>

        {dayEvents.length > 0 && (
          <div className="space-y-2">
            {dayEvents.map(({ key, task, isVirtualPreview }) => (
              <TaskItem
                key={key}
                task={task}
                userEmail={userEmail}
                isVirtualPreview={isVirtualPreview}
                onComplete={
                  !isVirtualPreview && task.status === "active"
                    ? handleComplete
                    : undefined
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
