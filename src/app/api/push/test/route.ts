import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  deletePushSubscription,
  getAllPushSubscriptions,
} from "@/lib/sheets/client";
import { sendPushToSubscriptions } from "@/lib/push/send";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscriptions = await getAllPushSubscriptions();
    const userSubs = subscriptions.filter(
      (s) => s.userEmail === session.user!.email!,
    );

    if (userSubs.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Belum ada subscription. Aktifkan notifikasi dulu dari banner di Hari Ini.",
          sent: 0,
          failed: 0,
          results: [],
        },
        { status: 400 },
      );
    }

    const results = await sendPushToSubscriptions(userSubs, {
      title: "Fammy — Tes notifikasi",
      body: "Notifikasi berhasil dikirim! Tap untuk buka app.",
      url: "/today",
    });

    for (const result of results) {
      if (result.expired) {
        await deletePushSubscription(result.subscriptionId);
      }
    }

    const sent = results.filter((r) => r.ok).length;
    const failed = results.length - sent;

    return NextResponse.json({
      ok: sent > 0,
      sent,
      failed,
      results: results.map((r) => ({
        ok: r.ok,
        statusCode: r.statusCode,
        expired: r.expired,
        endpoint: r.endpoint.includes("apple.com") ? "apple" : "fcm",
        error: r.error,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengirim tes notifikasi" },
      { status: 500 },
    );
  }
}
