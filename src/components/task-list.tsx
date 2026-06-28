"use client";

import type { Task, VisibilityFilter } from "@/lib/types";
import {
  canViewTask,
  groupTasksByDate,
  isActiveTask,
  isDueTodayOrNoDate,
  matchesVisibilityFilter,
  sortTasksOldestFirst,
} from "@/lib/tasks/filters";
import { TaskItem } from "@/components/task-item";

interface TaskListProps {
  tasks: Task[];
  filter: VisibilityFilter;
  userEmail: string;
  mode: "today" | "all";
  onComplete?: (task: Task) => void;
}

export function TaskList({
  tasks,
  filter,
  userEmail,
  mode,
  onComplete,
}: TaskListProps) {
  const filtered = tasks.filter(
    (t) =>
      !t.deleted &&
      canViewTask(t, userEmail) &&
      matchesVisibilityFilter(t, filter),
  );

  if (mode === "today") {
    const todos = sortTasksOldestFirst(
      filtered.filter(
        (t) => isActiveTask(t) && t.type === "todo" && isDueTodayOrNoDate(t),
      ),
    );

    if (todos.length === 0) return null;

    return (
      <div className="space-y-2">
        {todos.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            userEmail={userEmail}
            onComplete={onComplete}
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
        const sorted = sortTasksOldestFirst(items);
        return (
          <section key={label}>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              {label}
            </h2>
            <div className="space-y-2">
              {sorted.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  userEmail={userEmail}
                  onComplete={
                    task.status === "active" ? onComplete : undefined
                  }
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
