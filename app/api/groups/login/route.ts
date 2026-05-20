import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { normalizeCode } from "@/lib/codes";
import { getAccountSession, setLeaderSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const account = await getAccountSession();
  if (!account) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { code } = await req.json();
  const normalized = normalizeCode(String(code ?? ""));
  if (!normalized) {
    return NextResponse.json({ error: "Group code required." }, { status: 400 });
  }

  const rows =
    account.role === "mentor"
      ? await sql`
          SELECT id, code, name, school_level, mentor_name
          FROM groups
          WHERE code = ${normalized} AND mentor_user_id = ${account.userId}
        `
      : account.role === "uniteci"
        ? await sql`
            SELECT g.id, g.code, g.name, g.school_level, g.mentor_name
            FROM groups g
            JOIN unites u ON u.id = g.unite_id
            WHERE g.code = ${normalized} AND u.uniteci_user_id = ${account.userId}
          `
      : account.role === "admin"
        ? await sql`
            SELECT id, code, name, school_level, mentor_name
            FROM groups
            WHERE code = ${normalized}
          `
        : [];

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Group not found or not assigned to your account." },
      { status: 404 }
    );
  }

  const group = rows[0] as {
    id: string;
    code: string;
    name: string;
    school_level: "middle_school" | "high_school" | "mixed";
    mentor_name: string | null;
  };

  await setLeaderSession({
    groupId: group.id,
    groupCode: group.code,
    groupName: group.name,
    schoolLevel: group.school_level,
    mentorName: group.mentor_name,
  });

  return NextResponse.json({ ok: true, group });
}
