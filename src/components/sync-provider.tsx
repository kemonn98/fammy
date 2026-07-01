"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import {
  hasConflicts,
  resolveConflictsByPull,
  resumeSync,
  syncAll,
} from "@/lib/sync/engine";
import { ConflictBanner } from "@/components/conflict-banner";

const SYNC_INTERVAL_MS = 30_000;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [conflict, setConflict] = useState(false);

  useLiveQuery(() => getDb().tasks.toArray());

  useEffect(() => {
    void syncAll();

    const onOnline = () => resumeSync();
    window.addEventListener("online", onOnline);

    const interval = setInterval(() => {
      if (!navigator.onLine) return;
      if (document.visibilityState !== "visible") return;
      void syncAll();
    }, SYNC_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      resumeSync();
      void hasConflicts().then(setConflict);
    };
    document.addEventListener("visibilitychange", onVisible);

    const onFocus = () => {
      if (document.visibilityState === "visible") resumeSync();
      void hasConflicts().then(setConflict);
    };
    window.addEventListener("focus", onFocus);

    void hasConflicts().then(setConflict);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {conflict && (
        <ConflictBanner
          onResolve={async () => {
            await resolveConflictsByPull();
            setConflict(false);
          }}
        />
      )}
      {children}
    </>
  );
}
