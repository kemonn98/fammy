"use client";

import { useState, useSyncExternalStore } from "react";
import { Bell } from "lucide-react";

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

function shouldShowPushBanner(): boolean {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;
  if (Notification.permission === "granted") return false;
  return !localStorage.getItem("push-banner-dismissed");
}

export function PushPermissionBanner() {
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const res = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await res.json();
      if (!publicKey) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(json),
      });

      setDismissed(true);
    } catch (error) {
      console.error("Push subscribe failed:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated || dismissed || !shouldShowPushBanner()) return null;

  return (
    <div className="mb-4 rounded-2xl bg-[var(--accent-light)] p-4 text-sm text-stone-800 ring-1 ring-[var(--accent)]/20">
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
        <div className="flex-1">
          <p className="font-medium">Aktifkan notifikasi</p>
          <p className="mt-1 text-stone-600">
            {isStandalone()
              ? "Dapatkan ringkasan harian dan pengingat event."
              : "Pasang dulu ke Home Screen (iOS), lalu aktifkan notifikasi."}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={subscribe}
              disabled={loading}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {loading ? "..." : "Aktifkan"}
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("push-banner-dismissed", "1");
                setDismissed(true);
              }}
              className="rounded-xl px-4 py-2 text-xs text-stone-500"
            >
              Nanti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
