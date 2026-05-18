import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getLeaderSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getLeaderSession();
    if (!session) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const rows = await sql`
      SELECT
        s.id,
        s.display_name,
        s.created_at,
        e.entry_date AS last_entry_date,
        e.fajr, e.fajr_cemaat,
        e.dhuhr, e.dhuhr_cemaat,
        e.asr, e.asr_cemaat,
        e.maghrib, e.maghrib_cemaat,
        e.isha, e.isha_cemaat,
        e.tahajjud, e.duha, e.evvabin, e.cevsen,
        e.quran_pages, e.zikr_count, e.book_pages
      FROM students s
      LEFT JOIN LATERAL (
        SELECT * FROM entries
        WHERE student_id = s.id
        ORDER BY entry_date DESC
        LIMIT 1
      ) e ON TRUE
      WHERE s.group_id = ${session.groupId}
      ORDER BY s.created_at ASC
    `;
    return NextResponse.json({ members: rows });
  } catch (err) {
    console.error("Could not load leader members", err);
    return NextResponse.json(
      {
        error:
          "Could not load members. Check that the production database schema is up to date.",
      },
      { status: 500 }
    );
  }
}
