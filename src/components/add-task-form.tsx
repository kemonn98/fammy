"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { Task, TaskType, Visibility } from "@/lib/types";
import { CATEGORIES } from "@/lib/tasks/filters";
import { createTaskLocal } from "@/lib/sync/engine";
import { createId, nowIso } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AddTaskFormProps {
  userEmail: string;
  partnerEmail: string | null;
}

export function AddTaskForm({ userEmail, partnerEmail }: AddTaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("todo");
  const [visibility, setVisibility] = useState<Visibility>("shared");
  const [showMore, setShowMore] = useState(false);
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("lainnya");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [repeat, setRepeat] = useState<Task["repeat"]>("none");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [assignee, setAssignee] = useState("both");
  const [saving, setSaving] = useState(false);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const task: Task = {
      id: createId(),
      title: title.trim(),
      note,
      type,
      visibility,
      assignee,
      createdBy: userEmail,
      dueDate: dueDate || null,
      dueTime: type === "event" ? dueTime || null : null,
      repeat,
      repeatInterval: repeat === "custom" ? 14 : null,
      repeatUntil: null,
      priority,
      category,
      status: "active",
      completedAt: null,
      completedBy: null,
      remindBefore: type === "event" ? 30 : null,
      updatedAt: nowIso(),
      deleted: false,
      recurrenceParentId: null,
      lastNotifiedAt: null,
    };

    await createTaskLocal(task);
    setSaving(false);
    router.push("/today");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Apa yang perlu dilakukan?"
        className="w-full border-0 bg-transparent text-2xl font-medium text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-0"
        autoFocus
      />

      <div className="flex gap-2">
        {(["todo", "event"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              type === t
                ? "bg-[var(--accent)] text-white"
                : "bg-stone-100 text-stone-600",
            )}
          >
            {t === "todo" ? "Todo" : "Event"}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {(["shared", "private"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVisibility(v)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              visibility === v
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600",
            )}
          >
            {v === "shared" ? "Bersama" : "Pribadi"}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowMore(!showMore)}
        className="flex items-center gap-1 text-sm text-stone-500"
      >
        Lainnya
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", showMore && "rotate-180")}
        />
      </button>

      {showMore && (
        <div className="space-y-4 rounded-2xl bg-stone-50 p-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan"
            rows={2}
            className="w-full resize-none rounded-xl border-0 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl border-0 bg-white px-3 py-2 text-sm"
          />

          {type === "event" && (
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full rounded-xl border-0 bg-white px-3 py-2 text-sm"
            />
          )}

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border-0 bg-white px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as Task["priority"])
            }
            className="w-full rounded-xl border-0 bg-white px-3 py-2 text-sm"
          >
            <option value="low">Prioritas rendah</option>
            <option value="medium">Prioritas sedang</option>
            <option value="high">Prioritas tinggi</option>
          </select>

          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full rounded-xl border-0 bg-white px-3 py-2 text-sm"
          >
            <option value="both">Keduanya</option>
            <option value={userEmail}>Kamu</option>
            {partnerEmail && (
              <option value={partnerEmail}>Pasangan</option>
            )}
          </select>

          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as Task["repeat"])}
            className="w-full rounded-xl border-0 bg-white px-3 py-2 text-sm"
          >
            <option value="none">Tidak berulang</option>
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
            <option value="custom">Tiap 14 hari</option>
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={!title.trim() || saving}
        className="w-full rounded-2xl bg-[var(--accent)] py-4 text-base font-semibold text-white transition-opacity disabled:opacity-40"
      >
        {saving ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
