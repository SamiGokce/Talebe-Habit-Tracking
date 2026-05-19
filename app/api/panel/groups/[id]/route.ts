import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { setupErrorResponse } from "@/lib/api-errors";
import { getAccountSession } from "@/lib/session";
import { canAccessGroup, canUsePanel } from "@/lib/panel-access";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const account = await getAccountSession();
    if (!canUsePanel(account)) {
      return NextResponse.json({ error: "Admin or uniteci only." }, { status: 403 });
    }

    const { id } = await ctx.params;
    if (!(await canAccessGroup(account!, id))) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const groups = await sql`
      SELECT
        g.id,
        g.code,
        g.name,
        g.school_level,
        g.mentor_name,
        g.unite_id,
        u.name AS unite_name,
        mentor.display_name AS mentor_account_name
      FROM groups g
      LEFT JOIN unites u ON u.id = g.unite_id
      LEFT JOIN users mentor ON mentor.id = g.mentor_user_id
      WHERE g.id = ${id}
    `;
    if (groups.length === 0) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const students = await sql`
      SELECT
        s.id,
        s.display_name,
        s.created_at,
        e.entry_date AS last_entry_date,
        e.fajr,
        e.dhuhr,
        e.asr,
        e.maghrib,
        e.isha,
        e.quran_pages,
        e.zikr_count,
        e.book_pages
      FROM students s
      LEFT JOIN LATERAL (
        SELECT *
        FROM entries
        WHERE student_id = s.id
        ORDER BY entry_date DESC
        LIMIT 1
      ) e ON TRUE
      WHERE s.group_id = ${id}
      ORDER BY s.display_name ASC
    `;

    return NextResponse.json({ group: groups[0], students });
  } catch (err) {
    const setupError = setupErrorResponse(err);
    if (setupError) return setupError;
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const account = await getAccountSession();
    if (!canUsePanel(account)) {
      return NextResponse.json({ error: "Admin or uniteci only." }, { status: 403 });
    }

    const { id } = await ctx.params;
    if (!(await canAccessGroup(account!, id))) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const rows = await sql`
      DELETE FROM groups
      WHERE id = ${id}
      RETURNING id, unite_id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, group: rows[0] });
  } catch (err) {
    const setupError = setupErrorResponse(err);
    if (setupError) return setupError;
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
