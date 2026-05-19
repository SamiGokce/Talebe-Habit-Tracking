import { NextResponse } from "next/server";
import { setupErrorResponse } from "@/lib/api-errors";
import { sql } from "@/lib/db";
import { getAccountSession } from "@/lib/session";

export const runtime = "nodejs";

async function requireAdmin() {
  const account = await getAccountSession();
  return account?.role === "admin" ? account : null;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin only." }, { status: 403 });
    }

    const groups = await sql`
      SELECT
        g.id,
        g.code,
        g.name,
        g.created_at,
        g.unite_id,
        u.name AS unite_name,
        g.mentor_name,
        mentor.display_name AS mentor_account_name,
        COUNT(DISTINCT s.id)::int AS student_count,
        MAX(e.entry_date) AS last_entry_date
      FROM groups g
      LEFT JOIN unites u ON u.id = g.unite_id
      LEFT JOIN users mentor ON mentor.id = g.mentor_user_id
      LEFT JOIN students s ON s.group_id = g.id
      LEFT JOIN entries e ON e.student_id = s.id
      GROUP BY g.id, u.name, mentor.display_name
      ORDER BY u.name ASC NULLS LAST, g.name ASC
    `;

    return NextResponse.json({ groups });
  } catch (err) {
    const setupError = setupErrorResponse(err);
    if (setupError) return setupError;
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
