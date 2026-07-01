"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConflictBannerProps {
  onResolve: () => void;
}

export function ConflictBanner({ onResolve }: ConflictBannerProps) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center gap-3 border-b bg-card px-4 py-3 text-sm text-foreground shadow-sm">
      <AlertTriangle className="size-4 shrink-0 text-amber-500" />
      <p className="flex-1">Changes detected in Sheet. Reload?</p>
      <Button type="button" size="sm" onClick={onResolve}>
        Reload
      </Button>
    </div>
  );
}
