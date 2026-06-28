"use client";

import type { Task, VisibilityFilter } from "@/lib/types";
import {
  canViewTask,
  groupTasksByDate,
  isActiveTask,
  isDueTodayOrNoDate,
  matchesVisibilityFilter,
} from "@/lib/tasks/filters";
import { TaskItem } from "@/components/task-item";

interface TaskListProps {
  tasks: Task[];
  filter: VisibilityFilter;
  userEmail: string;
  mode: "today" | "all";
  onComplete?: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
}

export function TaskList({
  tasks,
  filter,
  userEmail,
  mode,
  onComplete,
  onTaskClick,
}: TaskListProps) {
  const filtered = tasks.filter(
    (t) =>
      !t.deleted &&
      canViewTask(t, userEmail) &&
      matchesVisibilityFilter(t, filter, userEmail),
  );

  if (mode === "today") {
    const todos = filtered.filter(
      (t) => isActiveTask(t) && t.type === "todo" && isDueTodayOrNoDate(t),
    );

    if (todos.length === 0) {
      return (
        <p className="rounded-xl bg-muted/50 px-4 py-10 text-center text-sm text-muted-foreground">
          Tidak ada todo hari ini
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {todos.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onComplete={onComplete}
            onClick={onTaskClick}
          />
        ))}
      </div>
    );
  }

  const groups = groupTasksByDate(filtered.filter((t) => t.status !== "skipped"));

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([label, items]) => {
        if (items.length === 0) return null;
        return (
          <section key={label}>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              {label}
            </h2>
            <div className="space-y-2">
              {items.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={
                    task.status === "active" ? onComplete : undefined
                  }
                  onClick={onTaskClick}
                  showDate
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
