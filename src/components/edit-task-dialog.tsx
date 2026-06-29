"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Task } from "@/lib/types";
import { CATEGORIES } from "@/lib/tasks/filters";
import { updateTaskLocal } from "@/lib/sync/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeSelect } from "@/components/time-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCapitalizedInput } from "@/hooks/use-capitalized-input";

const REPEAT_LABELS: Record<Task["repeat"], string> = {
  none: "Tidak berulang",
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  custom: "Tiap 14 hari",
};

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const titleInput = useCapitalizedInput<HTMLInputElement>(title, setTitle);
  const [visibility, setVisibility] = useState<Task["visibility"]>(
    task?.visibility ?? "shared",
  );
  const [note, setNote] = useState(task?.note ?? "");
  const [category, setCategory] = useState(task?.category || "lainnya");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [dateOpen, setDateOpen] = useState(false);
  const [dueTime, setDueTime] = useState(task?.dueTime ?? "");
  const [repeat, setRepeat] = useState<Task["repeat"]>(task?.repeat ?? "none");
  const [saving, setSaving] = useState(false);

  const isEvent = task?.type === "event";

  const dueDateObj = dueDate
    ? parse(dueDate, "yyyy-MM-dd", new Date())
    : undefined;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !title.trim()) return;

    setSaving(true);
    await updateTaskLocal({
      ...task,
      title: title.trim(),
      visibility,
      note: isEvent ? note : task.note,
      category: isEvent ? category : task.category,
      dueDate: isEvent ? dueDate || null : task.dueDate,
      dueTime: isEvent ? dueTime || null : task.dueTime,
      repeat: isEvent ? repeat : task.repeat,
      repeatInterval: isEvent && repeat === "custom" ? 14 : task.repeatInterval,
    });
    setSaving(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>
              {isEvent ? "Edit agenda" : "Edit tugas"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Judul</Label>
              <Input
                id="edit-title"
                ref={titleInput.ref}
                value={title}
                onChange={titleInput.onChange}
                autoFocus
              />
            </div>

            {isEvent ? (
              <>
                <div className="space-y-2">
                  <Label>Jam</Label>
                  <TimeSelect value={dueTime} onValueChange={setDueTime} />
                </div>

                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start font-normal",
                          !dueDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon />
                        {dueDateObj
                          ? format(dueDateObj, "EEEE, d MMMM yyyy", {
                              locale: idLocale,
                            })
                          : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-(--radix-popover-trigger-width) p-3"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={dueDateObj}
                        onSelect={(date) => {
                          setDueDate(date ? format(date, "yyyy-MM-dd") : "");
                          setDateOpen(false);
                        }}
                        locale={idLocale}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pengulangan</Label>
                  <Select
                    value={repeat}
                    onValueChange={(v) => setRepeat(v as Task["repeat"])}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        ["none", "daily", "weekly", "monthly", "custom"] as const
                      ).map((r) => (
                        <SelectItem key={r} value={r}>
                          {REPEAT_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-note">Catatan</Label>
                  <Textarea
                    id="edit-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </>
            ) : null}

            <div className="flex items-center justify-between rounded-md bg-muted/60 px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="edit-visibility" className="text-sm font-medium">
                  {isEvent ? "Agenda bersama" : "Tugas bersama"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {visibility === "shared"
                    ? "Terlihat oleh pasangan"
                    : "Hanya untuk kamu"}
                </p>
              </div>
              <Switch
                id="edit-visibility"
                checked={visibility === "shared"}
                onCheckedChange={(checked) =>
                  setVisibility(checked ? "shared" : "private")
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!title.trim() || saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
