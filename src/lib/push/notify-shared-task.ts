import {
  deletePushSubscription,
  getAllPushSubscriptions,
} from "@/lib/sheets/client";
import { sendPushToSubscriptions } from "@/lib/push/send";
import type { Task } from "@/lib/types";
import { getPartnerEmail } from "@/lib/utils";

async function notifyPartner(
  completerOrCreatorEmail: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  const partnerEmail = getPartnerEmail(completerOrCreatorEmail);
  if (!partnerEmail) return;

  const subscriptions = await getAllPushSubscriptions();
  const partnerSubs = subscriptions.filter(
    (s) => s.userEmail === partnerEmail,
  );
  if (partnerSubs.length === 0) return;

  const results = await sendPushToSubscriptions(partnerSubs, payload);

  for (const result of results) {
    if (result.expired) {
      await deletePushSubscription(result.subscriptionId);
    }
  }
}

function taskUrl(task: Task): string {
  return task.type === "event" ? "/agenda" : "/today";
}

export async function notifyPartnerOfNewSharedTask(
  task: Task,
  creatorEmail: string,
): Promise<void> {
  if (task.visibility !== "shared" || task.deleted) return;
  if (task.createdBy !== creatorEmail) return;

  const isEvent = task.type === "event";
  await notifyPartner(creatorEmail, {
    title: isEvent ? "New Event!" : "New Task!",
    body: task.title,
    url: taskUrl(task),
  });
}

export async function notifyPartnerOfCompletedSharedTask(
  task: Task,
  completedByEmail: string,
): Promise<void> {
  if (task.visibility !== "shared" || task.deleted) return;
  if (task.status !== "done") return;
  if (task.completedBy !== completedByEmail) return;

  await notifyPartner(completedByEmail, {
    title: "Task Done!",
    body: task.title,
    url: taskUrl(task),
  });
}

export function wasSharedTaskJustCompleted(
  before: Task | undefined,
  after: Task,
  userEmail: string,
): boolean {
  return (
    !!before &&
    before.status !== "done" &&
    after.status === "done" &&
    after.visibility === "shared" &&
    after.completedBy === userEmail
  );
}
