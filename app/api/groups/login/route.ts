import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { normalizeCode } from "@/lib/codes";
import { setLeaderSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { code, passphrase } = await req.json();
    const normalized = normalizeCode(String(code ?? ""));

    if (!normalized || typeof passphrase !== "string" || !passphrase) {
      return NextResponse.json(
        { error: "Group code and passphrase required." },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, code, name, school_level, mentor_name, leader_passphrase_hash
      FROM groups WHERE code = ${normalized}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    const g = rows[0] as {
      id: string;
      code: string;
      name: string;
      school_level: "middle_school" | "high_school" | "mixed";
      mentor_name: string | null;
      leader_passphrase_hash: string;
    };
    const ok = await bcrypt.compare(passphrase, g.leader_passphrase_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "Wrong passphrase." },
        { status: 401 }
      );
    }

    await setLeaderSession({
      groupId: g.id,
      groupCode: g.code,
      groupName: g.name,
      schoolLevel: g.school_level,
      mentorName: g.mentor_name,
    });

    return NextResponse.json({
      ok: true,
      group: {
        id: g.id,
        code: g.code,
        name: g.name,
        school_level: g.school_level,
        mentor_name: g.mentor_name,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
