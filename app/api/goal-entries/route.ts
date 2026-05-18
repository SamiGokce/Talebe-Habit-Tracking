import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { todayISO } from "@/lib/codes";
import { getStudentSession } from "@/lib/session";

export const runtime = "nodejs";

type GoalEntryInput = {
  goal_id?: unknown;
  completed?: unknown;
  amount?: unknown;
};

export async function PUT(req: Request) {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json();
  const date = String(body.entry_date ?? todayISO()).slice(0, 10);
  const goals: GoalEntryInput[] = Array.isArray(body.goals) ? body.goals : [];

  if (goals.length === 0) {
    return NextResponse.json({ ok: true, goals: [] });
  }

  const saved = [];
  for (const input of goals) {
    const goalId = String(input.goal_id ?? "");
    if (!goalId) continue;

    const allowed = await sql`
      SELECT id, kind FROM goals
      WHERE id = ${goalId}
        AND group_id = ${session.groupId}
        AND active = TRUE
        AND (student_id IS NULL OR student_id = ${session.studentId})
        AND (starts_on IS NULL OR starts_on <= ${date})
        AND (ends_on IS NULL OR ends_on >= ${date})
    `;
    if (allowed.length === 0) continue;

    const kind = (allowed[0] as { kind: string }).kind;
    const amountInput = Number(input.amount ?? 0);
    const amount =
      kind === "count" && Number.isFinite(amountInput)
        ? Math.min(9999, Math.max(0, Math.floor(amountInput)))
        : 0;
    const completed =
      kind === "count" ? amount > 0 : Boolean(input.completed);

    const rows = await sql`
      INSERT INTO goal_entries (
        goal_id, student_id, entry_date, completed, amount
      ) VALUES (
        ${goalId}, ${session.studentId}, ${date}, ${completed}, ${amount}
      )
      ON CONFLICT (goal_id, student_id, entry_date) DO UPDATE SET
        completed = EXCLUDED.completed,
        amount = EXCLUDED.amount,
        updated_at = NOW()
      RETURNING goal_id, completed, amount
    `;
    saved.push(rows[0]);
  }

  return NextResponse.json({ ok: true, goals: saved });
}
