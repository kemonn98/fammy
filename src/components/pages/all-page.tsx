"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Task, VisibilityFilter } from "@/lib/types";
import { completeTaskLocal } from "@/lib/sync/engine";
import { VisibilityToggle } from "@/components/visibility-toggle";
import { TaskList } from "@/components/task-list";
import { useTasks } from "@/hooks/use-tasks";

interface AllPageClientProps {
  partnerEmail: string | null;
}

export function AllPageClient({ partnerEmail }: AllPageClientProps) {
  const { data: session } = useSession();
  const tasks = useTasks();
  const [filter, setFilter] = useState<VisibilityFilter>("all");
  const userEmail = session?.user?.email ?? "";

  async function handleComplete(task: Task) {
    if (!userEmail) return;
    await completeTaskLocal(task, userEmail);
  }

  return (
    <div className="space-y-4">
      <VisibilityToggle value={filter} onChange={setFilter} />
      <TaskList
        tasks={tasks}
        filter={filter}
        userEmail={userEmail}
        partnerEmail={partnerEmail}
        mode="all"
        onComplete={handleComplete}
      />
    </div>
  );
}
