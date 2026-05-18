import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { generateInviteCode } from "@/lib/codes";
import { setLeaderSession } from "@/lib/session";

export const runtime = "nodejs";

const SCHOOL_LEVELS = new Set(["middle_school", "high_school", "mixed"]);

export async function POST(req: Request) {
  try {
    const { name, passphrase, school_level, mentor_name } = await req.json();
    const schoolLevel = SCHOOL_LEVELS.has(String(school_level))
      ? String(school_level)
      : "middle_school";
    const mentorName =
      typeof mentor_name === "string" && mentor_name.trim()
        ? mentor_name.trim()
        : null;

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      typeof passphrase !== "string" ||
      passphrase.length < 4
    ) {
      return NextResponse.json(
        { error: "Group name (2+ chars) and passphrase (4+ chars) required." },
        { status: 400 }
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

    const hash = await bcrypt.hash(passphrase, 10);

    const rows = await sql`
      INSERT INTO groups (
        code, name, school_level, mentor_name, leader_passphrase_hash
      )
      VALUES (${code}, ${name.trim()}, ${schoolLevel}, ${mentorName}, ${hash})
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
