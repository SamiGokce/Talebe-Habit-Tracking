import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { generateInviteCode } from "@/lib/codes";
import { getAccountSession, setLeaderSession } from "@/lib/session";

export const runtime = "nodejs";

const SCHOOL_LEVELS = new Set(["middle_school", "high_school", "mixed"]);

export async function POST(req: Request) {
  try {
    const account = await getAccountSession();
    if (!account || !["uniteci", "admin"].includes(account.role)) {
      return NextResponse.json(
        { error: "Only unitecis can create groups." },
        { status: 403 }
      );
    }

    const { name, school_level, mentor_name, mentor_user_id, unite_id } =
      await req.json();
    const schoolLevel = SCHOOL_LEVELS.has(String(school_level))
      ? String(school_level)
      : "middle_school";
    const mentorName =
      typeof mentor_name === "string" && mentor_name.trim()
        ? mentor_name.trim()
        : null;

    if (
      typeof name !== "string" ||
      name.trim().length < 2
    ) {
      return NextResponse.json(
        { error: "Group name must be at least 2 characters." },
        { status: 400 }
      );
    }

    let mentorUserId: string | null = null;
    if (mentor_user_id) {
      const mentors = await sql`
        SELECT id, display_name FROM users
        WHERE id = ${String(mentor_user_id)} AND role IN ('mentor', 'uniteci', 'admin')
      `;
      if (mentors.length === 0) {
        return NextResponse.json({ error: "Mentor not found." }, { status: 404 });
      }
      mentorUserId = (mentors[0] as { id: string }).id;
    }

    const uniteId = String(unite_id ?? "");
    if (!uniteId) {
      return NextResponse.json({ error: "Unite is required." }, { status: 400 });
    }
    const uniteRows =
      account.role === "admin"
        ? await sql`SELECT id FROM unites WHERE id = ${uniteId}`
        : await sql`
            SELECT id FROM unites
            WHERE id = ${uniteId} AND uniteci_user_id = ${account.userId}
          `;
    if (uniteRows.length === 0) {
      return NextResponse.json(
        { error: "You cannot create groups in this unite." },
        { status: 403 }
      );
    }

    let code = "";
    for (let i = 0; i < 6; i++) {
      code = generateInviteCode(6);
      const existing = await sql`SELECT 1 FROM groups WHERE code = ${code}`;
      if (existing.length === 0) break;
      code = "";
    }
    if (!code) {
      return NextResponse.json(
        { error: "Could not allocate invite code, please retry." },
        { status: 500 }
      );
    }

    const hash = await bcrypt.hash(crypto.randomUUID(), 10);

    const rows = await sql`
      INSERT INTO groups (
        unite_id, code, name, school_level, mentor_name, mentor_user_id, leader_passphrase_hash
      )
      VALUES (${uniteId}, ${code}, ${name.trim()}, ${schoolLevel}, ${mentorName}, ${mentorUserId}, ${hash})
      RETURNING id, code, name, school_level, mentor_name
    `;
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
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
