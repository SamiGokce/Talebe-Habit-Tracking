import { NextResponse } from "next/server";
import {
  getAccountSession,
  getLeaderSession,
  getStudentSession,
} from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const account = await getAccountSession();
  const leader = await getLeaderSession();
  const student = await getStudentSession();
  return NextResponse.json({ account, leader, student });
}
