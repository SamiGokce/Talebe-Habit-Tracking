import { NextResponse } from "next/server";
import { clearLeaderSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  await clearLeaderSession();
  return NextResponse.json({ ok: true });
}
