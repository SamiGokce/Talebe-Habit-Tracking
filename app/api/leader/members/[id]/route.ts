import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getLeaderSession } from "@/lib/session";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getLeaderSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const students = await sql`
    SELECT id, display_name, created_at
    FROM students
    WHERE id = ${id} AND group_id = ${session.groupId}
  `;
  if (students.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entries = await sql`
    SELECT * FROM entries
    WHERE student_id = ${id}
      AND entry_date >= CURRENT_DATE - 60
    ORDER BY entry_date DESC
  `;
  return NextResponse.json({ student: students[0], entries });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getLeaderSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await sql`DELETE FROM students WHERE id = ${id} AND group_id = ${session.groupId}`;
  return NextResponse.json({ ok: true });
}
