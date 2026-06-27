import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export function unauthorizedCron() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
