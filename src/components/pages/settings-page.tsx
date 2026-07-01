"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BellRing, LogOut, Share, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  getPushStatus,
  isIos,
  pushSupported,
  sendTestPush,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/client";
import { clearLocalTaskData } from "@/lib/sync/engine";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SettingsPageClientProps {
  userEmail: string;
}

export function SettingsPageClient({ userEmail }: SettingsPageClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [testing, setTesting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const [standalone, setStandalone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

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
          setMessage(result.error ?? "Failed to enable notifications.");
        }
      } else {
        const result = await unsubscribeFromPush();
        if (!result.ok) {
          setMessage(result.error ?? "Failed to disable notifications.");
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
          setMessage(sub.error ?? "Enable notifications first.");
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

  async function handleResetTasks() {
    setResetting(true);
    setResetError(null);
    try {
      const res = await fetch("/api/tasks/reset", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Failed to delete all tasks.");
      }
      await clearLocalTaskData();
      setResetOpen(false);
      router.push("/today");
      router.refresh();
    } catch (error) {
      console.error("Reset tasks failed:", error);
      setResetError(
        error instanceof Error
          ? error.message
          : "Failed to delete all tasks.",
      );
    } finally {
      setResetting(false);
    }
  }

  const pushHint = !pushSupported()
    ? "This browser does not support push notifications."
    : !standalone && isIos()
      ? "Add Fammy to your Home Screen first to enable notifications."
      : permission === "denied"
        ? "Notifications are blocked. Open Settings → Fammy → Notifications."
        : "Daily digest & event reminders.";

  return (
    <div className="space-y-6">
      <Link
        href="/today"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <header>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      </header>

      <section className="space-y-2 rounded-xl bg-card p-4 ring-1 ring-foreground/5">
        <h2 className="text-sm font-medium text-foreground">Account</h2>
        <p className="text-sm text-muted-foreground">{userEmail}</p>
      </section>

      {isIos() && !standalone && (
        <section className="flex gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/5">
          <Share className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Add to Home Screen
            </p>
            <p className="text-xs text-muted-foreground">
              Tap Share in Safari → Add to Home Screen. Required for
              notifications on iPhone.
            </p>
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/5">
        <h2 className="text-sm font-medium text-foreground">Notifications</h2>

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-0.5">
            <Label htmlFor="push-toggle" className="text-sm font-medium">
              Push notifications
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
              Test notification
            </p>
            <p className="text-xs text-muted-foreground">
              Send an instant notification to this device
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
            {testing ? "..." : "Send"}
          </Button>
        </div>

        {message && (
          <p className="text-xs text-muted-foreground">{message}</p>
        )}
      </section>

      <section className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/5">
        <h2 className="text-sm font-medium text-foreground">Data</h2>
        <p className="text-xs text-muted-foreground">
          Delete all todos and events from the database. Applies to you and
          your partner.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            setResetError(null);
            setResetOpen(true);
          }}
        >
          <Trash2 className="size-4" />
          Delete all tasks
        </Button>
      </section>

      <Dialog
        open={resetOpen}
        onOpenChange={(open) => {
          if (!resetting) setResetOpen(open);
        }}
      >
        <DialogContent showCloseButton={!resetting}>
          <DialogHeader>
            <DialogTitle>Delete all tasks?</DialogTitle>
            <DialogDescription>
              All todos and events will be permanently deleted from the database
              — including your partner&apos;s data. This action{" "}
              <span className="font-medium text-foreground">
                cannot be undone
              </span>{" "}
              and data will be lost forever.
            </DialogDescription>
          </DialogHeader>

          {resetError && (
            <p className="text-sm text-destructive" role="alert">
              {resetError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={resetting}
              onClick={() => setResetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={resetting}
              onClick={() => void handleResetTasks()}
            >
              {resetting ? "Deleting..." : "Yes, delete forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => void signOut({ redirectTo: "/login" })}
      >
        <LogOut className="size-4" />
        Log out
      </Button>
    </div>
  );
}
