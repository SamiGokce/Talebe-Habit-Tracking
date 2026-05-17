import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getLeaderSession, getStudentSession } from "@/lib/session";
import { ALL_HABIT_KEYS, type HabitKey, COUNT_KEYS } from "@/lib/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

async function getGroupAccess() {
  const leader = await getLeaderSession();
  if (leader) return { groupId: leader.groupId, isLeader: true };
  const student = await getStudentSession();
  if (student) return { groupId: student.groupId, isLeader: false, studentId: student.studentId };
  return null;
}

export async function GET(_req: Request, ctx: Ctx) {
  const access = await getGroupAccess();
  if (!access) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const rows = await sql`
    SELECT * FROM contests WHERE id = ${id} AND group_id = ${access.groupId}
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const contest = rows[0] as {
    id: string;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string;
    scoring: Record<HabitKey, number>;
  };

  const entries = await sql`
    SELECT e.*, s.id AS student_id, s.display_name
    FROM entries e
    JOIN students s ON s.id = e.student_id
    WHERE s.group_id = ${access.groupId}
      AND e.entry_date >= ${contest.start_date}
      AND e.entry_date <= ${contest.end_date}
  `;

  const totals = new Map<
    string,
    { student_id: string; display_name: string; points: number; days: number }
  >();
  const days = new Map<string, Set<string>>();

  const scoring = contest.scoring;
  for (const row of entries as any[]) {
    const studentId = row.student_id as string;
    const name = row.display_name as string;
    let pts = 0;
    for (const k of ALL_HABIT_KEYS) {
      const score = scoring[k] || 0;
      if (!score) continue;
      const v = row[k];
      if (COUNT_KEYS.includes(k as (typeof COUNT_KEYS)[number])) {
        pts += score * Number(v || 0);
      } else if (v) {
        pts += score;
      }
    }
    const t = totals.get(studentId) ?? {
      student_id: studentId,
      display_name: name,
      points: 0,
      days: 0,
    };
    t.points += pts;
    totals.set(studentId, t);
    const set = days.get(studentId) ?? new Set<string>();
    set.add(String(row.entry_date));
    days.set(studentId, set);
  }
  for (const [sid, t] of totals) {
    t.days = days.get(sid)?.size ?? 0;
  }
  const leaderboard = Array.from(totals.values()).sort(
    (a, b) => b.points - a.points
  );

  return NextResponse.json({ contest, leaderboard });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getLeaderSession();
  if (!session) {
    return NextResponse.json({ error: "Not a leader" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await sql`DELETE FROM contests WHERE id = ${id} AND group_id = ${session.groupId}`;
  return NextResponse.json({ ok: true });
}
