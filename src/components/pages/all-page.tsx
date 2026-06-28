"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Task, VisibilityFilter } from "@/lib/types";
import { completeTaskLocal } from "@/lib/sync/engine";
import { VisibilityToggle } from "@/components/visibility-toggle";
import { TaskList } from "@/components/task-list";
import { AddTaskForm } from "@/components/add-task-form";
import { useTasks } from "@/hooks/use-tasks";

export function AllPageClient() {
  const { data: session } = useSession();
  const tasks = useTasks();
  const [filter, setFilter] = useState<VisibilityFilter>("shared");
  const userEmail = session?.user?.email ?? "";

  async function handleComplete(task: Task) {
    if (!userEmail) return;
    await completeTaskLocal(task, userEmail);
  }

  return (
    <div className="space-y-4">
      <VisibilityToggle value={filter} onChange={setFilter} />

      <AddTaskForm
        userEmail={userEmail}
        type="todo"
        visibility={filter === "shared" ? "shared" : "private"}
        onSaved={() => undefined}
      />

      <TaskList
        tasks={tasks}
        filter={filter}
        userEmail={userEmail}
        mode="all"
        onComplete={handleComplete}
      />
    </div>
  );
}
