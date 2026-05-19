import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { setupErrorResponse } from "@/lib/api-errors";
import { getAccountSession } from "@/lib/session";
import { canAccessUnite, canUsePanel } from "@/lib/panel-access";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const account = await getAccountSession();
    if (!canUsePanel(account)) {
      return NextResponse.json({ error: "Admin or uniteci only." }, { status: 403 });
    }

    const { id } = await ctx.params;
    if (!(await canAccessUnite(account!, id))) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const unites = await sql`
      SELECT
        u.id,
        u.name,
        u.description,
        u.uniteci_user_id,
        owner.display_name AS uniteci_name
      FROM unites u
      LEFT JOIN users owner ON owner.id = u.uniteci_user_id
      WHERE u.id = ${id}
    `;
    if (unites.length === 0) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const groups = await sql`
      SELECT
        g.id,
        g.code,
        g.name,
        g.school_level,
        g.mentor_name,
        mentor.display_name AS mentor_account_name,
        COUNT(s.id)::int AS student_count
      FROM groups g
      LEFT JOIN users mentor ON mentor.id = g.mentor_user_id
      LEFT JOIN students s ON s.group_id = g.id
      WHERE g.unite_id = ${id}
      GROUP BY g.id, mentor.display_name
      ORDER BY g.name ASC
    `;

    return NextResponse.json({ unite: unites[0], groups });
  } catch (err) {
    const setupError = setupErrorResponse(err);
    if (setupError) return setupError;
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
