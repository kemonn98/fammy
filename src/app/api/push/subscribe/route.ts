import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { upsertPushSubscription } from "@/lib/sheets/client";
import type { PushSubscriptionRecord } from "@/lib/types";
import { createId, nowIso } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const sub: PushSubscriptionRecord = {
      id: createId(),
      userEmail: session.user.email,
      endpoint: body.endpoint,
      p256dh: body.keys?.p256dh ?? body.p256dh,
      auth: body.keys?.auth ?? body.auth,
      createdAt: nowIso(),
      deleted: false,
    };

    await upsertPushSubscription(sub);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 },
    );
  }
}
