"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Task, VisibilityFilter } from "@/lib/types";
import { completeTaskLocal } from "@/lib/sync/engine";
import { VisibilityToggle } from "@/components/visibility-toggle";
import { TaskList } from "@/components/task-list";
import { AddTaskForm } from "@/components/add-task-form";
import { IosInstallPrompt } from "@/components/ios-install-prompt";
import { PushPermissionBanner } from "@/components/push-permission-banner";
import { useTasks } from "@/hooks/use-tasks";

interface TodayPageClientProps {
  partnerEmail: string | null;
}

export function TodayPageClient({ partnerEmail }: TodayPageClientProps) {
  const { data: session } = useSession();
  const tasks = useTasks();
  const [filter, setFilter] = useState<VisibilityFilter>("all");
  const userEmail = session?.user?.email ?? "";

  async function handleComplete(task: Task) {
    if (!userEmail) return;
    await completeTaskLocal(task, userEmail);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <VisibilityToggle value={filter} onChange={setFilter} />
        <TaskList
          tasks={tasks}
          filter={filter}
          userEmail={userEmail}
          partnerEmail={partnerEmail}
          mode="today"
          onComplete={handleComplete}
        />
      </div>

      <AddTaskForm
        variant="inline"
        userEmail={userEmail}
        partnerEmail={partnerEmail}
        onSaved={() => undefined}
      />

      <div className="space-y-3 pt-2">
        <IosInstallPrompt />
        <PushPermissionBanner />
      </div>
    </div>
  );
}
