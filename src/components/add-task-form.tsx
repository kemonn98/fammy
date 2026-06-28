"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, ChevronDown, Plus } from "lucide-react";
import { format, parse } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Task, TaskType, Visibility } from "@/lib/types";
import { CATEGORIES } from "@/lib/tasks/filters";
import { createTaskLocal } from "@/lib/sync/engine";
import { createId, nowIso } from "@/lib/utils";
import { cn } from "@/lib/utils";
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

interface AddTaskFormProps {
  userEmail: string;
  variant?: "inline" | "page" | "bar";
  onSaved?: () => void;
  defaultType?: TaskType;
  defaultDate?: string;
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
  variant = "page",
  onSaved,
  defaultType = "todo",
  defaultDate = "",
}: AddTaskFormProps) {
  const router = useRouter();
  const isInline = variant === "inline";
  const compact = variant === "inline" || variant === "bar";
  const isEvent = defaultType === "event";
  const type = defaultType;

  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("shared");
  const [showMore, setShowMore] = useState(false);
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("lainnya");
  const [dueDate, setDueDate] = useState(defaultDate);
  const [dateOpen, setDateOpen] = useState(false);
  const [dueTime, setDueTime] = useState("");
  const [repeat, setRepeat] = useState<Task["repeat"]>("none");
  const [saving, setSaving] = useState(false);

  const dueDateObj = dueDate
    ? parse(dueDate, "yyyy-MM-dd", new Date())
    : undefined;

  function reset() {
    setTitle("");
    setVisibility("shared");
    setShowMore(false);
    setNote("");
    setCategory("lainnya");
    setDueDate(defaultDate);
    setDueTime("");
    setRepeat("none");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const task: Task = {
      id: createId(),
      title: title.trim(),
      note: isEvent ? note : "",
      type,
      visibility,
      assignee: "both",
      createdBy: userEmail,
      dueDate: isEvent ? dueDate || null : null,
      dueTime: isEvent ? dueTime || null : null,
      repeat: isEvent ? repeat : "none",
      repeatInterval: isEvent && repeat === "custom" ? 14 : null,
      repeatUntil: null,
      priority: "medium",
      category: isEvent ? category : "lainnya",
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

  const placeholder = isEvent
    ? compact
      ? "Tambah agenda..."
      : "Apa acaranya?"
    : compact
      ? "Tambah tugas..."
      : "Apa yang perlu dilakukan?";

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-4",
        isInline && "rounded-xl bg-card p-4 ring-1 ring-foreground/10",
      )}
    >
      {isEvent ? (
        <>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "h-12 border-0 bg-transparent px-0 font-medium shadow-none focus-visible:ring-0",
              compact ? "text-lg" : "text-2xl",
            )}
            autoFocus={!compact}
          />

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant={showMore ? "secondary" : "outline"}
              onClick={() => setShowMore(!showMore)}
            >
              Detail
              <ChevronDown
                className={cn("transition-transform", showMore && "rotate-180")}
              />
            </Button>

            <Button type="submit" disabled={!title.trim() || saving}>
              <Plus />
              {saving ? "Menyimpan..." : compact ? "Tambah" : "Simpan"}
            </Button>
          </div>

          {showMore && (
            <div className="space-y-4 border-t border-border pt-4">
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
                    htmlFor="visibility-switch"
                    className="text-sm font-medium"
                  >
                    Agenda bersama
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {visibility === "shared"
                      ? "Terlihat oleh pasangan"
                      : "Hanya untuk kamu"}
                  </p>
                </div>
                <Switch
                  id="visibility-switch"
                  checked={visibility === "shared"}
                  onCheckedChange={(checked) =>
                    setVisibility(checked ? "shared" : "private")
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
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "min-w-0 flex-1 border-0 bg-transparent px-0 font-medium shadow-none focus-visible:ring-0",
              compact ? "h-11 text-lg" : "h-12 text-2xl",
            )}
            autoFocus={!compact}
          />
          <Button
            type="submit"
            disabled={!title.trim() || saving}
            className="shrink-0"
          >
            <Plus />
            {saving ? "..." : compact ? "Tambah" : "Simpan"}
          </Button>
        </div>
      )}
    </form>
  );
}
