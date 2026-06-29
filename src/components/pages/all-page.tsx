"use client";

import type { Task } from "@/lib/types";
import { completeTaskLocal } from "@/lib/sync/engine";
import { TaskList } from "@/components/task-list";
import { AddTaskForm } from "@/components/add-task-form";
import { useTasks } from "@/hooks/use-tasks";

interface AllPageClientProps {
  userEmail: string;
}

export function AllPageClient({ userEmail }: AllPageClientProps) {
  const tasks = useTasks();

  async function handleComplete(task: Task) {
    if (!userEmail) return;
    await completeTaskLocal(task, userEmail);
  }

  return (
    <div className="space-y-4">
      <TaskList
        tasks={tasks}
        filter="all"
        userEmail={userEmail}
        mode="all"
        onComplete={handleComplete}
      />

      <AddTaskForm
        userEmail={userEmail}
        type="todo"
        visibility="private"
        onSaved={() => undefined}
      />
    </div>
  );
}
