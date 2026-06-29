"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BellRing, LogOut, Share } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  getPushStatus,
  isIos,
  pushSupported,
  sendTestPush,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/client";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface SettingsPageClientProps {
  userEmail: string;
}

export function SettingsPageClient({ userEmail }: SettingsPageClientProps) {
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [testing, setTesting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const [standalone, setStandalone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const status = await getPushStatus();
    setSubscribed(status.subscribed);
    setPermission(status.permission);
    setStandalone(status.standalone);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleToggle(checked: boolean) {
    setToggling(true);
    setMessage(null);
    try {
      if (checked) {
        const result = await subscribeToPush();
        if (!result.ok) {
          setMessage(result.error ?? "Gagal mengaktifkan notifikasi.");
        }
      } else {
        const result = await unsubscribeFromPush();
        if (!result.ok) {
          setMessage(result.error ?? "Gagal menonaktifkan notifikasi.");
        }
      }
      await refresh();
    } finally {
      setToggling(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);
    try {
      if (!subscribed) {
        const sub = await subscribeToPush();
        if (!sub.ok) {
          setMessage(sub.error ?? "Aktifkan notifikasi dulu.");
          return;
        }
        await refresh();
      }
      const result = await sendTestPush();
      setMessage(result.message);
    } finally {
      setTesting(false);
    }
  }

  const pushHint = !pushSupported()
    ? "Browser ini tidak mendukung push notifikasi."
    : !standalone && isIos()
      ? "Pasang Fammy ke Home Screen dulu agar notifikasi bisa aktif."
      : permission === "denied"
        ? "Notifikasi diblokir di iPhone. Buka Settings → Fammy → Notifications."
        : "Ringkasan harian & pengingat event agenda.";

  return (
    <div className="space-y-6">
      <Link
        href="/today"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <header>
        <h1 className="text-2xl font-semibold text-foreground">Pengaturan</h1>
      </header>

      <section className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/5">
        <h2 className="text-sm font-medium text-foreground">Akun</h2>
        <p className="text-sm text-muted-foreground">{userEmail}</p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => void signOut({ redirectTo: "/login" })}
        >
          <LogOut className="size-4" />
          Keluar
        </Button>
      </section>

      {isIos() && !standalone && (
        <section className="flex gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/5">
          <Share className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Pasang ke Home Screen
            </p>
            <p className="text-xs text-muted-foreground">
              Tap Share di Safari → Tambah ke Layar Utama. Diperlukan untuk
              notifikasi di iPhone.
            </p>
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/5">
        <h2 className="text-sm font-medium text-foreground">Notifikasi</h2>

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-0.5">
            <Label htmlFor="push-toggle" className="text-sm font-medium">
              Push notifikasi
            </Label>
            <p className="text-xs text-muted-foreground">{pushHint}</p>
          </div>
          <Switch
            id="push-toggle"
            checked={subscribed}
            disabled={loading || toggling || !pushSupported()}
            onCheckedChange={handleToggle}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Tes notifikasi
            </p>
            <p className="text-xs text-muted-foreground">
              Kirim notifikasi instan ke device ini
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleTest}
            disabled={testing || loading}
          >
            <BellRing className="size-4" />
            {testing ? "..." : "Kirim"}
          </Button>
        </div>

        {message && (
          <p className="text-xs text-muted-foreground">{message}</p>
        )}
      </section>
    </div>
  );
}
