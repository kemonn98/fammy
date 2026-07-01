export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function pushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export type PushStatus = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  standalone: boolean;
};

export async function getPushStatus(): Promise<PushStatus> {
  if (!pushSupported()) {
    return {
      supported: false,
      permission: "unsupported",
      subscribed: false,
      standalone: isStandalone(),
    };
  }

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();

  return {
    supported: true,
    permission: Notification.permission,
    subscribed: !!sub,
    standalone: isStandalone(),
  };
}

export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
  if (!pushSupported()) {
    return { ok: false, error: "This browser does not support push notifications." };
  }

  if (!isStandalone()) {
    return {
      ok: false,
      error:
        "Open Fammy from the Home Screen icon (not Safari) to enable notifications.",
    };
  }

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return { ok: true };

  if (Notification.permission === "denied") {
    return {
      ok: false,
      error:
        "Notifications are blocked on this device. Open Settings → Fammy → Notifications and enable them.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Notification permission was not granted." };
  }

  const res = await fetch("/api/push/vapid-public-key");
  const { publicKey } = await res.json();
  if (!publicKey) return { ok: false, error: "VAPID key is not available." };

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  const saveRes = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(sub.toJSON()),
  });

  if (!saveRes.ok) {
    return { ok: false, error: "Failed to save subscription on the server." };
  }

  return { ok: true };
}

export async function unsubscribeFromPush(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!pushSupported()) {
    return { ok: false, error: "This browser does not support push notifications." };
  }

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { ok: true };

  const endpoint = sub.endpoint;
  await sub.unsubscribe();

  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ endpoint }),
  });

  return { ok: true };
}

export async function sendTestPush(): Promise<{
  ok: boolean;
  message: string;
}> {
  const res = await fetch("/api/push/test", {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();

  if (!res.ok) {
    return { ok: false, message: data.error ?? "Failed to send notification." };
  }

  if (data.sent > 0) {
    return {
      ok: true,
      message: `Sent to ${data.sent} device(s). Check your notifications.`,
    };
  }

  const detail = data.results?.[0]?.error ?? "Push rejected by server.";
  return { ok: false, message: `Failed: ${detail}` };
}
