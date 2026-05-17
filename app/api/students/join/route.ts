import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { normalizeCode, normalizeName } from "@/lib/codes";
import { setStudentSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { code, name } = await req.json();
    const normalizedCode = normalizeCode(String(code ?? ""));
    const normalizedName = normalizeName(String(name ?? ""));

    if (!normalizedCode || normalizedName.length < 1) {
      return NextResponse.json(
        { error: "Group code and your name required." },
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
      SELECT id FROM students
      WHERE group_id = ${g.id} AND lower(display_name) = lower(${normalizedName})
    `;
    let studentId: string;
    if (existing.length > 0) {
      studentId = (existing[0] as { id: string }).id;
    } else {
      const created = await sql`
        INSERT INTO students (group_id, display_name)
        VALUES (${g.id}, ${normalizedName})
        RETURNING id
      `;
      studentId = (created[0] as { id: string }).id;
    }

    await setStudentSession({
      studentId,
      groupId: g.id,
      groupCode: g.code,
      displayName: normalizedName,
    });

    return NextResponse.json({
      ok: true,
      student: { id: studentId, displayName: normalizedName },
      group: g,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
