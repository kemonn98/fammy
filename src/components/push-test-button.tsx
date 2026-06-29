"use client";

import { useState, useSyncExternalStore } from "react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function pushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function ensureSubscription(): Promise<{ ok: boolean; error?: string }> {
  const reg = await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  if (existing) return { ok: true };

  if (Notification.permission === "denied") {
    return {
      ok: false,
      error:
        "Notifikasi diblokir. Buka Settings iPhone → Fammy → Notifications, lalu aktifkan.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Izin notifikasi belum diberikan." };
  }

  const res = await fetch("/api/push/vapid-public-key");
  const { publicKey } = await res.json();
  if (!publicKey) return { ok: false, error: "VAPID key tidak tersedia." };

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  const saveRes = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(sub.toJSON()),
  });

  if (!saveRes.ok) {
    return { ok: false, error: "Gagal menyimpan subscription ke server." };
  }

  return { ok: true };
}

export function PushTestButton() {
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!hydrated || !pushSupported()) return null;

  async function handleTest() {
    setLoading(true);
    setMessage(null);
    try {
      if (!isStandalone()) {
        setMessage(
          "Buka Fammy dari ikon Home Screen (bukan Safari) agar notifikasi bisa dites.",
        );
        return;
      }

      const ensured = await ensureSubscription();
      if (!ensured.ok) {
        setMessage(ensured.error ?? "Gagal menyiapkan notifikasi.");
        return;
      }

      const res = await fetch("/api/push/test", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error ?? "Gagal mengirim notifikasi.");
        return;
      }

      if (data.sent > 0) {
        setMessage(`Terkirim ke ${data.sent} device. Cek notifikasi di layar.`);
      } else {
        const detail = data.results?.[0]?.error ?? "Push ditolak oleh server.";
        setMessage(`Gagal: ${detail}`);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal menghubungi server.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-muted/50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Tes notifikasi</p>
          <p className="text-xs text-muted-foreground">
            Kirim notifikasi instan ke device ini
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={loading}
        >
          <BellRing className="size-4" />
          {loading ? "..." : "Kirim"}
        </Button>
      </div>
      {message && (
        <p className="mt-2 text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
