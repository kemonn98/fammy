import {
  deletePushSubscription,
  getAllPushSubscriptions,
} from "@/lib/sheets/client";
import { sendPushToSubscriptions } from "@/lib/push/send";
import type { Task } from "@/lib/types";
import { getPartnerEmail } from "@/lib/utils";

export async function notifyPartnerOfNewSharedTask(
  task: Task,
  creatorEmail: string,
): Promise<void> {
  if (task.visibility !== "shared" || task.deleted) return;
  if (task.createdBy !== creatorEmail) return;

  const partnerEmail = getPartnerEmail(creatorEmail);
  if (!partnerEmail) return;

  const subscriptions = await getAllPushSubscriptions();
  const partnerSubs = subscriptions.filter(
    (s) => s.userEmail === partnerEmail,
  );
  if (partnerSubs.length === 0) return;

  const isEvent = task.type === "event";
  const title = isEvent ? "New Event!" : "New Task!";

  const results = await sendPushToSubscriptions(partnerSubs, {
    title,
    body: task.title,
    url: isEvent ? "/agenda" : "/today",
  });

  for (const result of results) {
    if (result.expired) {
      await deletePushSubscription(result.subscriptionId);
    }
  }
}
