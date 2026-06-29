"use client";

import { useMemo, useState } from "react";
import type { Task, VisibilityFilter } from "@/lib/types";
import { completeTaskLocal } from "@/lib/sync/engine";
import {
  canViewTask,
  isActiveTask,
  isDueTodayOrNoDate,
} from "@/lib/tasks/filters";
import { VisibilityToggle } from "@/components/visibility-toggle";
import { TaskList } from "@/components/task-list";
import { AddTaskForm } from "@/components/add-task-form";
import { useTasks } from "@/hooks/use-tasks";

interface TodayPageClientProps {
  userEmail: string;
}

export function TodayPageClient({ userEmail }: TodayPageClientProps) {
  const tasks = useTasks();
  const [filter, setFilter] = useState<VisibilityFilter>("shared");

  const visibilityCounts = useMemo(() => {
    const todayTodos = tasks.filter(
      (t) =>
        !t.deleted &&
        canViewTask(t, userEmail) &&
        isActiveTask(t) &&
        t.type === "todo" &&
        isDueTodayOrNoDate(t),
    );
    return {
      shared: todayTodos.filter((t) => t.visibility === "shared").length,
      mine: todayTodos.filter((t) => t.visibility === "private").length,
    };
  }, [tasks, userEmail]);

  async function handleComplete(task: Task) {
    if (!userEmail) return;
    await completeTaskLocal(task, userEmail);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <VisibilityToggle
          value={filter}
          onChange={setFilter}
          counts={visibilityCounts}
        />

        <TaskList
          tasks={tasks}
          filter={filter}
          userEmail={userEmail}
          mode="today"
          onComplete={handleComplete}
        />

        <AddTaskForm
          userEmail={userEmail}
          type="todo"
          visibility={filter === "shared" ? "shared" : "private"}
          onSaved={() => undefined}
        />
      </div>
    </div>
  );
}
