"use client";

import { Clock, Lock, Users } from "lucide-react";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface TaskItemProps {
  task: Task;
  onComplete?: (task: Task) => void;
  onClick?: (task: Task) => void;
  showDate?: boolean;
}

const priorityDot: Record<Task["priority"], string> = {
  low: "bg-muted-foreground/40",
  medium: "bg-primary",
  high: "bg-destructive",
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
        "flex items-start gap-3 rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/5 shadow-xs transition-opacity",
        done && "opacity-60",
      )}
    >
      <Checkbox
        checked={done}
        disabled={done || !onComplete}
        onCheckedChange={() => onComplete?.(task)}
        aria-label="Tandai selesai"
        className="mt-0.5 size-6 rounded-full"
      />

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
              "truncate font-medium text-foreground",
              done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.visibility === "private" ? (
            <Lock className="h-3 w-3" />
          ) : (
            <Users className="h-3 w-3" />
          )}
          {task.category && (
            <Badge variant="secondary" className="capitalize">
              {task.category}
            </Badge>
          )}
          {task.type === "event" && task.dueTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.dueTime}
            </span>
          )}
          {showDate && task.dueDate && <span>{task.dueDate}</span>}
        </div>
      </button>
    </div>
  );
}
