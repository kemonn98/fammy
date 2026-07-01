"use client";

import { useState } from "react";
import { Clock, Lock, MoreVertical, Pencil, Trash2, Users } from "lucide-react";
import type { Task } from "@/lib/types";
import { completeTaskLocal, deleteTaskLocal } from "@/lib/sync/engine";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SwipeableTaskRow } from "@/components/swipeable-task-row";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import { TaskDetailDialog } from "@/components/task-detail-dialog";

interface TaskItemProps {
  task: Task;
  userEmail: string;
  onComplete?: (task: Task) => void;
  showDate?: boolean;
  isVirtualPreview?: boolean;
}

export function TaskItem({
  task,
  userEmail,
  onComplete,
  showDate = false,
  isVirtualPreview = false,
}: TaskItemProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const done = task.status === "done";

  async function handleComplete() {
    if (!userEmail || done || isVirtualPreview) return;
    if (onComplete) {
      await onComplete(task);
    } else {
      await completeTaskLocal(task, userEmail);
    }
  }

  async function handleDelete() {
    if (isVirtualPreview) return;
    await deleteTaskLocal(task);
  }

  const readOnly = isVirtualPreview;

  return (
    <>
      <SwipeableTaskRow
        onSwipeLeft={handleDelete}
        onSwipeRight={handleComplete}
        canSwipeRight={!done && !!userEmail && !readOnly}
        canSwipeLeft={!!userEmail && !readOnly}
      >
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/5 shadow-xs transition-opacity",
            done && "opacity-60",
            readOnly && "opacity-80",
          )}
        >
          <Checkbox
            checked={done}
            disabled={done || !userEmail || readOnly}
            onCheckedChange={handleComplete}
            aria-label="Mark complete"
            className="mt-0.5 size-6 rounded-full"
          />

          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="min-w-0 flex-1 text-left"
            aria-label={`View details: ${task.title}`}
          >
            <p
              className={cn(
                "truncate font-medium text-foreground",
                done && "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {task.visibility === "private" ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Users className="h-3 w-3" />
                )}
                {task.visibility === "private" ? "Personal" : "Shared"}
              </span>
              {task.type === "event" && task.dueTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.dueTime}
                </span>
              )}
              {showDate && task.dueDate && <span>{task.dueDate}</span>}
              {readOnly && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                  Preview
                </span>
              )}
            </div>
          </button>

          {!readOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-0.5 shrink-0 text-muted-foreground"
                aria-label="Task options"
              >
                <MoreVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem
                className="h-11 text-base"
                onClick={() => setEditOpen(true)}
              >
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="h-11 text-base"
                onClick={handleDelete}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </SwipeableTaskRow>

      <TaskDetailDialog
        task={task}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canComplete={!done && !!userEmail && !readOnly}
        onComplete={handleComplete}
      />

      <EditTaskDialog
        key={`${task.id}-${task.updatedAt}`}
        task={task}
        open={editOpen && !readOnly}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
