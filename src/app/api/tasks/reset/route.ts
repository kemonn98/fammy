import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resetAllTasks } from "@/lib/sheets/client";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await resetAllTasks();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal menghapus semua tugas" },
      { status: 500 },
    );
  }
}
