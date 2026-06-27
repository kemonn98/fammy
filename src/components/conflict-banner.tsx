"use client";

import { AlertTriangle } from "lucide-react";

interface ConflictBannerProps {
  onResolve: () => void;
}

export function ConflictBanner({ onResolve }: ConflictBannerProps) {
  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex items-center gap-3 bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p className="flex-1">Ada perubahan di Sheet. Muat ulang?</p>
      <button
        type="button"
        onClick={onResolve}
        className="shrink-0 rounded-lg bg-amber-900 px-3 py-1 text-xs font-medium text-white"
      >
        Muat ulang
      </button>
    </div>
  );
}
