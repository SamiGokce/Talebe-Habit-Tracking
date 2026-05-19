import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { disabledHabitKeys, getHabitSettings } from "@/lib/habit-settings";
import { getStudentSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const url = new URL(req.url);
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days") ?? 30)));

  const rows = await sql`
    SELECT * FROM entries
    WHERE student_id = ${session.studentId}
      AND entry_date >= CURRENT_DATE - (${days}::int - 1)
    ORDER BY entry_date DESC
  `;
  const habitSettings = await getHabitSettings(session.studentId);
  return NextResponse.json({
    entries: rows,
    habitSettings,
    disabledHabitKeys: disabledHabitKeys(habitSettings),
  });
}
