import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  getAccountSession,
  getLeaderSession,
  getStudentSession,
  setStudentSession,
} from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const account = await getAccountSession();
  const leader = await getLeaderSession();
  let student = await getStudentSession();

  if (account && !student) {
    const rows = await sql`
      SELECT
        s.id,
        s.display_name,
        g.id AS group_id,
        g.code AS group_code
      FROM students s
      JOIN groups g ON g.id = s.group_id
      WHERE s.user_id = ${account.userId}
      ORDER BY s.created_at DESC
      LIMIT 1
    `;
    if (rows.length > 0) {
      const row = rows[0] as {
        id: string;
        display_name: string;
        group_id: string;
        group_code: string;
      };
      student = {
        studentId: row.id,
        groupId: row.group_id,
        groupCode: row.group_code,
        displayName: row.display_name,
      };
      await setStudentSession(student);
    }
  }

  return NextResponse.json({ account, leader, student });
}
