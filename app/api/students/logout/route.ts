import { NextResponse } from "next/server";
import { clearAccountSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  await clearAccountSession();
  return NextResponse.json({ ok: true });
}
