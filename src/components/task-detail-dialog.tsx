"use client";

import { format, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Calendar,
  Bell,
  Check,
  Clock,
  Lock,
  Users,
} from "lucide-react";
import type { Task } from "@/lib/types";
import { formatRemindBefore } from "@/lib/tasks/remind-before";
import { REPEAT_LABELS, getCategoryLabel } from "@/lib/tasks/labels";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function MetaItem({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      <Icon className="size-3.5 shrink-0" />
      {children}
    </span>
  );
}

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  canComplete?: boolean;
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onComplete,
  canComplete = false,
}: TaskDetailDialogProps) {
  if (!task) return null;

  const done = task.status === "done";
  const isEvent = task.type === "event";

  let formattedDate: string | null = null;
  if (task.dueDate) {
    try {
      formattedDate = format(parseISO(task.dueDate), "EEEE, d MMMM yyyy", {
        locale: enUS,
      });
    } catch {
      formattedDate = task.dueDate;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle
            className={cn(
              "pr-8 text-lg leading-snug font-semibold break-words whitespace-pre-wrap",
              done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <MetaItem icon={task.visibility === "private" ? Lock : Users}>
              {task.visibility === "private" ? "Personal" : "Shared"}
            </MetaItem>

            {isEvent && formattedDate && (
              <MetaItem icon={Calendar}>{formattedDate}</MetaItem>
            )}

            {isEvent && task.dueTime && (
              <MetaItem icon={Clock}>{task.dueTime}</MetaItem>
            )}

            {isEvent && task.dueTime && task.remindBefore !== null && (
              <MetaItem icon={Bell}>
                {formatRemindBefore(task.remindBefore)}
              </MetaItem>
            )}

            {isEvent && task.category && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                {getCategoryLabel(task.category)}
              </span>
            )}

            {isEvent && task.repeat !== "none" && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                {REPEAT_LABELS[task.repeat]}
              </span>
            )}

            {done && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                Done
              </span>
            )}
          </div>

          {isEvent && task.note.trim() && (
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Notes
              </p>
              <p className="text-sm break-words whitespace-pre-wrap text-foreground">
                {task.note}
              </p>
            </div>
          )}
        </div>

        {canComplete && !done && onComplete ? (
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                onComplete();
                onOpenChange(false);
              }}
            >
              <Check />
              Mark complete
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
