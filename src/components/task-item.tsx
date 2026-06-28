"use client";

import { useState } from "react";
import { Clock, Lock, MoreVertical, Pencil, Trash2, Users } from "lucide-react";
import type { Task } from "@/lib/types";
import { completeTaskLocal, deleteTaskLocal } from "@/lib/sync/engine";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SwipeableTaskRow } from "@/components/swipeable-task-row";
import { EditTaskDialog } from "@/components/edit-task-dialog";

interface TaskItemProps {
  task: Task;
  userEmail: string;
  onComplete?: (task: Task) => void;
  showDate?: boolean;
}

export function TaskItem({
  task,
  userEmail,
  onComplete,
  showDate = false,
}: TaskItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const done = task.status === "done";

  async function handleComplete() {
    if (!userEmail || done) return;
    if (onComplete) {
      await onComplete(task);
    } else {
      await completeTaskLocal(task, userEmail);
    }
  }

  async function handleDelete() {
    await deleteTaskLocal(task);
  }

  return (
    <>
      <SwipeableTaskRow
        onSwipeLeft={handleDelete}
        onSwipeRight={handleComplete}
        canSwipeRight={!done && !!userEmail}
        canSwipeLeft={!!userEmail}
      >
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/5 shadow-xs transition-opacity",
            done && "opacity-60",
          )}
        >
          <Checkbox
            checked={done}
            disabled={done || !userEmail}
            onCheckedChange={handleComplete}
            aria-label="Tandai selesai"
            className="mt-0.5 size-6 rounded-full"
          />

          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate font-medium text-foreground",
                done && "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </p>

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
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-0.5 shrink-0 text-muted-foreground"
                aria-label="Opsi tugas"
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
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SwipeableTaskRow>

      <EditTaskDialog
        task={task}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
