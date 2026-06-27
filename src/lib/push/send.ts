import webpush from "web-push";
import type { PushSubscriptionRecord } from "@/lib/types";

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID keys are not configured");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPushNotification(
  subscription: PushSubscriptionRecord,
  payload: { title: string; body: string; url?: string },
): Promise<boolean> {
  configureWebPush();

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
    );
    return true;
  } catch (error) {
    console.error("Push failed:", subscription.endpoint, error);
    return false;
  }
}

export async function sendPushToAll(
  subscriptions: PushSubscriptionRecord[],
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  await Promise.all(
    subscriptions.map((sub) => sendPushNotification(sub, payload)),
  );
}

export function getVapidPublicKey(): string {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) throw new Error("VAPID_PUBLIC_KEY is not configured");
  return key;
}
