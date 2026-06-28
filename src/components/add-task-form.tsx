"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, ChevronDown, Plus } from "lucide-react";
import { format, parse } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Task, TaskType, Visibility } from "@/lib/types";
import { CATEGORIES } from "@/lib/tasks/filters";
import { createTaskLocal } from "@/lib/sync/engine";
import { cn, createId, nowIso } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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

interface AddTaskFormProps {
  userEmail: string;
  visibility?: Visibility;
  type?: TaskType;
  defaultDate?: string;
  onSaved?: () => void;
}

const REPEAT_LABELS: Record<Task["repeat"], string> = {
  none: "Tidak berulang",
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  custom: "Tiap 14 hari",
};

export function AddTaskForm({
  userEmail,
  visibility = "shared",
  type = "todo",
  defaultDate = "",
  onSaved,
}: AddTaskFormProps) {
  const router = useRouter();
  const isEvent = type === "event";

  const [title, setTitle] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("lainnya");
  const [dueDate, setDueDate] = useState(defaultDate);
  const [dateOpen, setDateOpen] = useState(false);
  const [dueTime, setDueTime] = useState("");
  const [repeat, setRepeat] = useState<Task["repeat"]>("none");
  const [eventVisibility, setEventVisibility] = useState<Visibility>(visibility);
  const [saving, setSaving] = useState(false);

  const dueDateObj = dueDate
    ? parse(dueDate, "yyyy-MM-dd", new Date())
    : undefined;

  function reset() {
    setTitle("");
    setShowMore(false);
    setNote("");
    setCategory("lainnya");
    setDueDate(defaultDate);
    setDueTime("");
    setRepeat("none");
    setEventVisibility(visibility);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const resolvedVisibility: Visibility = isEvent ? eventVisibility : visibility;
    const task: Task = {
      id: createId(),
      title: title.trim(),
      note: isEvent ? note : "",
      type,
      visibility: resolvedVisibility,
      assignee: resolvedVisibility === "shared" ? "both" : userEmail,
      createdBy: userEmail,
      dueDate: isEvent ? dueDate || null : null,
      dueTime: isEvent ? dueTime || null : null,
      repeat: isEvent ? repeat : "none",
      repeatInterval: isEvent && repeat === "custom" ? 14 : null,
      repeatUntil: null,
      priority: "medium",
      category: isEvent ? category : "",
      status: "active",
      completedAt: null,
      completedBy: null,
      remindBefore: isEvent ? 30 : null,
      updatedAt: nowIso(),
      deleted: false,
      recurrenceParentId: null,
      lastNotifiedAt: null,
    };

    await createTaskLocal(task);
    setSaving(false);

    if (onSaved) {
      reset();
      onSaved();
    } else {
      router.push("/today");
    }
  }

  const placeholder = isEvent ? "Tambah agenda..." : "Tambah tugas...";

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-start gap-3 rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/5 shadow-xs">
        <span
          aria-hidden
          className="mt-0.5 size-6 shrink-0 rounded-full border-2 border-muted-foreground/30"
        />

        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />

          {isEvent && (
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              More Details
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  showMore && "rotate-180",
                )}
              />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!title.trim() || saving}
          aria-label={isEvent ? "Tambah agenda" : "Tambah tugas"}
          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {isEvent && (
        <>
          {showMore && (
            <div className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/5">
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

              <div className="flex items-center justify-between rounded-md bg-muted/60 px-4 py-3">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="event-visibility-switch"
                    className="text-sm font-medium"
                  >
                    Agenda bersama
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {eventVisibility === "shared"
                      ? "Terlihat oleh pasangan"
                      : "Hanya untuk kamu"}
                  </p>
                </div>
                <Switch
                  id="event-visibility-switch"
                  checked={eventVisibility === "shared"}
                  onCheckedChange={(checked) =>
                    setEventVisibility(checked ? "shared" : "private")
                  }
                />
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
                <Label htmlFor="note">Catatan</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tambahkan detail..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={!title.trim() || saving}
                className="w-full"
              >
                <Plus />
                {saving ? "Menyimpan..." : "Tambah agenda"}
              </Button>
            </div>
          )}
        </>
      )}
    </form>
  );
}
