import { NextResponse } from "next/server";
import { getLeaderSession, getStudentSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const leader = await getLeaderSession();
  const student = await getStudentSession();
  return NextResponse.json({ leader, student });
}
