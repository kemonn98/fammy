"use client";

import { useState, useSyncExternalStore } from "react";
import { Share, X } from "lucide-react";

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
    <div className="mb-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-blue-100">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">Pasang Fammy di Home Screen</p>
          <p className="mt-1 text-blue-700">
            Tap <Share className="inline h-4 w-4" /> Share → Tambah ke Layar Utama
            untuk notifikasi dan akses cepat.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("ios-install-dismissed", "1");
            setDismissed(true);
          }}
          className="text-blue-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
