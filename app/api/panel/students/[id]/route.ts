import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { setupErrorResponse } from "@/lib/api-errors";
import { getAccountSession } from "@/lib/session";
import { canAccessStudent, canUsePanel } from "@/lib/panel-access";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const account = await getAccountSession();
    if (!canUsePanel(account)) {
      return NextResponse.json({ error: "Admin or uniteci only." }, { status: 403 });
    }

    const { id } = await ctx.params;
    if (!(await canAccessStudent(account!, id))) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const students = await sql`
      SELECT
        s.id,
        s.display_name,
        s.created_at,
        g.id AS group_id,
        g.name AS group_name,
        u.id AS unite_id,
        u.name AS unite_name
      FROM students s
      JOIN groups g ON g.id = s.group_id
      LEFT JOIN unites u ON u.id = g.unite_id
      WHERE s.id = ${id}
    `;
    if (students.length === 0) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const entries = await sql`
      SELECT *
      FROM entries
      WHERE student_id = ${id}
        AND entry_date >= CURRENT_DATE - 90
      ORDER BY entry_date DESC
    `;

    const goalEntries = await sql`
      SELECT
        ge.entry_date,
        ge.completed,
        ge.amount,
        g.title,
        g.kind,
        g.unit
      FROM goal_entries ge
      JOIN goals g ON g.id = ge.goal_id
      WHERE ge.student_id = ${id}
        AND ge.entry_date >= CURRENT_DATE - 90
      ORDER BY ge.entry_date DESC, g.title ASC
    `;

    return NextResponse.json({ student: students[0], entries, goalEntries });
  } catch (err) {
    const setupError = setupErrorResponse(err);
    if (setupError) return setupError;
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
