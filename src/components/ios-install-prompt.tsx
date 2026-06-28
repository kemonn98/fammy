"use client";

import { useState, useSyncExternalStore } from "react";
import { Share, X } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function shouldShowIosPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (!isIos() || isStandalone()) return false;
  return !localStorage.getItem("ios-install-dismissed");
}

export function IosInstallPrompt() {
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);

  if (!hydrated || dismissed || !shouldShowIosPrompt()) return null;

  return (
    <Alert className="mb-4">
      <Share />
      <AlertTitle>Pasang Fammy di Home Screen</AlertTitle>
      <AlertDescription>
        Tap Share → Tambah ke Layar Utama untuk notifikasi dan akses cepat.
      </AlertDescription>
      <AlertAction>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Tutup"
          onClick={() => {
            localStorage.setItem("ios-install-dismissed", "1");
            setDismissed(true);
          }}
        >
          <X />
        </Button>
      </AlertAction>
    </Alert>
  );
}
