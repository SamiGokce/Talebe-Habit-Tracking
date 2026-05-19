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

    const students = await sql`
      SELECT
        s.id,
        s.display_name,
        s.created_at,
        s.group_id,
        g.name AS group_name,
        g.code AS group_code,
        g.unite_id,
        u.name AS unite_name,
        account.email AS account_email,
        account.display_name AS account_name,
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
      JOIN groups g ON g.id = s.group_id
      LEFT JOIN unites u ON u.id = g.unite_id
      LEFT JOIN users account ON account.id = s.user_id
      LEFT JOIN LATERAL (
        SELECT *
        FROM entries
        WHERE student_id = s.id
        ORDER BY entry_date DESC
        LIMIT 1
      ) e ON TRUE
      ORDER BY u.name ASC NULLS LAST, g.name ASC, s.display_name ASC
    `;

    return NextResponse.json({ students });
  } catch (err) {
    const setupError = setupErrorResponse(err);
    if (setupError) return setupError;
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
