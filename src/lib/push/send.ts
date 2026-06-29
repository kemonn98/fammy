import webpush from "web-push";
import type { PushSubscriptionRecord } from "@/lib/types";

export type PushSendResult = {
  subscriptionId: string;
  endpoint: string;
  ok: boolean;
  statusCode?: number;
  expired?: boolean;
  error?: string;
};

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
): Promise<PushSendResult> {
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
    return {
      subscriptionId: subscription.id,
      endpoint: subscription.endpoint,
      ok: true,
    };
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode: number }).statusCode)
        : undefined;
    const expired = statusCode === 410;
    const message =
      error instanceof Error ? error.message : "Push delivery failed";

    console.error("Push failed:", subscription.endpoint, statusCode, error);

    return {
      subscriptionId: subscription.id,
      endpoint: subscription.endpoint,
      ok: false,
      statusCode,
      expired,
      error: message,
    };
  }
}

export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionRecord[],
  payload: { title: string; body: string; url?: string },
): Promise<PushSendResult[]> {
  return Promise.all(
    subscriptions.map((sub) => sendPushNotification(sub, payload)),
  );
}

export async function sendPushToAll(
  subscriptions: PushSubscriptionRecord[],
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  await sendPushToSubscriptions(subscriptions, payload);
}

export function getVapidPublicKey(): string {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) throw new Error("VAPID_PUBLIC_KEY is not configured");
  return key;
}
