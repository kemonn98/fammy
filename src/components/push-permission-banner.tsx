"use client";

import { useState, useSyncExternalStore } from "react";
import { Bell } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
    <Alert className="mb-4 bg-accent/40">
      <Bell className="text-primary" />
      <AlertTitle>Aktifkan notifikasi</AlertTitle>
      <AlertDescription>
        {isStandalone()
          ? "Dapatkan ringkasan harian dan pengingat event."
          : "Pasang dulu ke Home Screen (iOS), lalu aktifkan notifikasi."}
      </AlertDescription>
      <div className="col-start-2 mt-2 flex gap-2">
        <Button type="button" size="sm" onClick={subscribe} disabled={loading}>
          {loading ? "..." : "Aktifkan"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            localStorage.setItem("push-banner-dismissed", "1");
            setDismissed(true);
          }}
        >
          Nanti
        </Button>
      </div>
    </Alert>
  );
}
