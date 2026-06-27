"use client";

import { Check, Clock, Lock, Users } from "lucide-react";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onComplete?: (task: Task) => void;
  onClick?: (task: Task) => void;
  showDate?: boolean;
}

const priorityDot: Record<Task["priority"], string> = {
  low: "bg-stone-300",
  medium: "bg-[var(--accent)]",
  high: "bg-rose-400",
};

export function TaskItem({
  task,
  onComplete,
  onClick,
  showDate = false,
}: TaskItemProps) {
  const done = task.status === "done";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-stone-100 transition-opacity",
        done && "opacity-50",
      )}
    >
      {onComplete && !done && (
        <button
          type="button"
          onClick={() => onComplete(task)}
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-stone-300 text-transparent transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          aria-label="Selesai"
        >
          <Check className="h-4 w-4" />
        </button>
      )}
      {done && (
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
          <Check className="h-4 w-4" />
        </div>
      )}

      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => onClick?.(task)}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              priorityDot[task.priority],
            )}
          />
          <p
            className={cn(
              "truncate font-medium text-stone-900",
              done && "line-through",
            )}
          >
            {task.title}
          </p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-400">
          {task.visibility === "private" ? (
            <Lock className="h-3 w-3" />
          ) : (
            <Users className="h-3 w-3" />
          )}
          {task.category && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5">
              {task.category}
            </span>
          )}
          {task.type === "event" && task.dueTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.dueTime}
            </span>
          )}
          {showDate && task.dueDate && (
            <span>{task.dueDate}</span>
          )}
        </div>
      </button>
    </div>
  );
}
