import { NextResponse } from "next/server";
import { clearStudentSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  await clearStudentSession();
  return NextResponse.json({ ok: true });
}
