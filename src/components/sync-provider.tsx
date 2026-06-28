"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import {
  hasConflicts,
  pullFromServer,
  resolveConflictsByPull,
  syncAll,
} from "@/lib/sync/engine";
import { ConflictBanner } from "@/components/conflict-banner";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [conflict, setConflict] = useState(false);

  useLiveQuery(() => getDb().tasks.toArray());

  useEffect(() => {
    void syncAll();

    const onOnline = () => void syncAll();
    window.addEventListener("online", onOnline);

    const interval = setInterval(() => {
      if (!navigator.onLine) return;
      if (document.visibilityState !== "visible") return;
      void syncAll();
    }, 10 * 1000);

    const onFocus = () => {
      if (navigator.onLine) void pullFromServer();
      void hasConflicts().then(setConflict);
    };
    window.addEventListener("focus", onFocus);

    void hasConflicts().then(setConflict);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
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
