import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  deletePushSubscription,
  getAllPushSubscriptions,
} from "@/lib/sheets/client";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const endpoint = body.endpoint as string | undefined;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint is required" },
        { status: 400 },
      );
    }

    const subscriptions = await getAllPushSubscriptions();
    const match = subscriptions.find(
      (s) =>
        s.endpoint === endpoint && s.userEmail === session.user!.email!,
    );

    if (match) {
      await deletePushSubscription(match.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 },
    );
  }
}
