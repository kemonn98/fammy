"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AddTaskForm } from "@/components/add-task-form";

const QUICK_ADD_PATHS = ["/today", "/all"];

export function QuickAddBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userEmail = session?.user?.email ?? "";

  if (!QUICK_ADD_PATHS.includes(pathname)) return null;

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-lg px-4 py-2">
        <AddTaskForm
          variant="bar"
          userEmail={userEmail}
          defaultType="todo"
          onSaved={() => undefined}
        />
      </div>
    </div>
  );
}
