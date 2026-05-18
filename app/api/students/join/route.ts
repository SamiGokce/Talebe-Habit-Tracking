import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { normalizeCode } from "@/lib/codes";
import { getAccountSession, setStudentSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const account = await getAccountSession();
    if (!account) {
      return NextResponse.json({ error: "Create an account first." }, { status: 401 });
    }

    const { code } = await req.json();
    const normalizedCode = normalizeCode(String(code ?? ""));
    const displayName = account.displayName;

    if (!normalizedCode) {
      return NextResponse.json(
        { error: "Group code required." },
        { status: 400 }
      );
    }

    const groups = await sql`
      SELECT id, code, name FROM groups WHERE code = ${normalizedCode}
    `;
    if (groups.length === 0) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }
    const g = groups[0] as { id: string; code: string; name: string };

    const existing = await sql`
      SELECT id, display_name FROM students
      WHERE group_id = ${g.id} AND user_id = ${account.userId}
    `;
    let studentId: string;
    let finalDisplayName = displayName;
    if (existing.length > 0) {
      studentId = (existing[0] as { id: string }).id;
      finalDisplayName = (existing[0] as { display_name: string }).display_name;
    } else {
      const created = await sql`
        INSERT INTO students (group_id, user_id, display_name)
        VALUES (${g.id}, ${account.userId}, ${displayName})
        RETURNING id, display_name
      `;
      studentId = (created[0] as { id: string }).id;
      finalDisplayName = (created[0] as { display_name: string }).display_name;
    }

    await setStudentSession({
      studentId,
      groupId: g.id,
      groupCode: g.code,
      displayName: finalDisplayName,
    });

    return NextResponse.json({
      ok: true,
      student: { id: studentId, displayName: finalDisplayName },
      group: g,
    });
  } catch (err: any) {
    if (String(err?.message || "").includes("students_group_id_display_name_key")) {
      return NextResponse.json(
        { error: "Someone in this group already uses your display name." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
