"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Task, VisibilityFilter } from "@/lib/types";
import { completeTaskLocal } from "@/lib/sync/engine";
import { VisibilityToggle } from "@/components/visibility-toggle";
import { TaskList } from "@/components/task-list";
import { IosInstallPrompt } from "@/components/ios-install-prompt";
import { PushPermissionBanner } from "@/components/push-permission-banner";
import { useTasks } from "@/hooks/use-tasks";

export function TodayPageClient() {
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
      <IosInstallPrompt />
      <PushPermissionBanner />
      <VisibilityToggle value={filter} onChange={setFilter} />
      <TaskList
        tasks={tasks}
        filter={filter}
        userEmail={userEmail}
        mode="today"
        onComplete={handleComplete}
      />
    </div>
  );
}
