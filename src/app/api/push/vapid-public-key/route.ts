import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push/send";

export async function GET() {
  try {
    return NextResponse.json({ publicKey: getVapidPublicKey() });
  } catch {
    return NextResponse.json({ publicKey: null });
  }
}
