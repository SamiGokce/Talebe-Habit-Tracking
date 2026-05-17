import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getLeaderSession, getStudentSession } from "@/lib/session";
import { ALL_HABIT_KEYS, DEFAULT_SCORING, type HabitKey } from "@/lib/types";

export const runtime = "nodejs";

async function currentGroupId(): Promise<string | null> {
  const leader = await getLeaderSession();
  if (leader) return leader.groupId;
  const student = await getStudentSession();
  if (student) return student.groupId;
  return null;
}

export async function GET() {
  const groupId = await currentGroupId();
  if (!groupId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const rows = await sql`
    SELECT * FROM contests
    WHERE group_id = ${groupId}
    ORDER BY start_date DESC
  `;
  return NextResponse.json({ contests: rows });
}

export async function POST(req: Request) {
  const session = await getLeaderSession();
  if (!session) {
    return NextResponse.json({ error: "Not a leader" }, { status: 401 });
  }
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const description = body.description ? String(body.description).trim() : null;
  const start_date = String(body.start_date ?? "");
  const end_date = String(body.end_date ?? "");
  const inputScoring = body.scoring ?? {};

  if (!name || !start_date || !end_date) {
    return NextResponse.json(
      { error: "Name, start and end dates required." },
      { status: 400 }
    );
  }
  if (new Date(end_date) < new Date(start_date)) {
    return NextResponse.json(
      { error: "End date must be after start date." },
      { status: 400 }
    );
  }

  const scoring: Record<HabitKey, number> = { ...DEFAULT_SCORING };
  for (const k of ALL_HABIT_KEYS) {
    const v = Number(inputScoring[k]);
    scoring[k] = Number.isFinite(v) && v >= 0 ? Math.min(999, Math.floor(v)) : 0;
  }

  const rows = await sql`
    INSERT INTO contests (group_id, name, description, start_date, end_date, scoring)
    VALUES (${session.groupId}, ${name}, ${description}, ${start_date}, ${end_date}, ${JSON.stringify(scoring)}::jsonb)
    RETURNING *
  `;
  return NextResponse.json({ contest: rows[0], ok: true });
}
