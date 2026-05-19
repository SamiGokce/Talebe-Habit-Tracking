import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { todayISO } from "@/lib/codes";
import { getLeaderSession, getStudentSession } from "@/lib/session";

export const runtime = "nodejs";

type Access =
  | { role: "mentor"; groupId: string; studentId?: never }
  | { role: "talebe"; groupId: string; studentId: string };

async function getAccess(preferStudent = false): Promise<Access | null> {
  const student = await getStudentSession();
  if (preferStudent && student) {
    return {
      role: "talebe",
      groupId: student.groupId,
      studentId: student.studentId,
    };
  }
  const leader = await getLeaderSession();
  if (leader) return { role: "mentor", groupId: leader.groupId };
  if (student) {
    return {
      role: "talebe",
      groupId: student.groupId,
      studentId: student.studentId,
    };
  }
  return null;
}

function cleanDate(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  return value.slice(0, 10);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const access = await getAccess(url.searchParams.get("scope") === "student");
  if (!access) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const date = url.searchParams.get("date") ?? todayISO();

  if (access.role === "talebe") {
    const rows = await sql`
      SELECT
        g.*,
        COALESCE(ge.completed, FALSE) AS completed,
        COALESCE(ge.amount, 0) AS amount
      FROM goals g
      LEFT JOIN goal_entries ge
        ON ge.goal_id = g.id
       AND ge.student_id = ${access.studentId}
       AND ge.entry_date = ${date}
      WHERE g.group_id = ${access.groupId}
        AND g.active = TRUE
        AND (g.student_id IS NULL OR g.student_id = ${access.studentId})
        AND (g.starts_on IS NULL OR g.starts_on <= ${date})
        AND (g.ends_on IS NULL OR g.ends_on >= ${date})
      ORDER BY g.created_at ASC
    `;
    return NextResponse.json({ goals: rows });
  }

  const rows = await sql`
    SELECT
      g.*,
      s.display_name AS student_name
    FROM goals g
    LEFT JOIN students s ON s.id = g.student_id
    WHERE g.group_id = ${access.groupId}
    ORDER BY g.active DESC, g.created_at DESC
  `;
  return NextResponse.json({ goals: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const access = await getAccess(body.scope === "student");
  if (!access) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const title = String(body.title ?? "").trim();
  const description = body.description
    ? String(body.description).trim().slice(0, 240)
    : null;
  const kind = body.kind === "count" ? "count" : "boolean";
  const unit = kind === "count" ? String(body.unit ?? "").trim().slice(0, 24) : null;
  const pointInput = Number(body.points ?? 1);
  const points = Number.isFinite(pointInput)
    ? Math.min(999, Math.max(0, Math.floor(pointInput)))
    : 1;
  const startsOn = cleanDate(body.starts_on);
  const endsOn = cleanDate(body.ends_on);

  if (title.length < 2) {
    return NextResponse.json(
      { error: "Goal title must be at least 2 characters." },
      { status: 400 }
    );
  }
  if (startsOn && endsOn && new Date(endsOn) < new Date(startsOn)) {
    return NextResponse.json(
      { error: "End date must be after start date." },
      { status: 400 }
    );
  }

  let studentId: string | null =
    access.role === "talebe" ? access.studentId : null;

  if (access.role === "mentor" && body.student_id) {
    const requestedStudentId = String(body.student_id);
    const students = await sql`
      SELECT id FROM students
      WHERE id = ${requestedStudentId} AND group_id = ${access.groupId}
    `;
    if (students.length === 0) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }
    studentId = requestedStudentId;
  }

  const rows = await sql`
    INSERT INTO goals (
      group_id, student_id, title, description, kind, unit,
      created_by_role, points, starts_on, ends_on
    ) VALUES (
      ${access.groupId}, ${studentId}, ${title}, ${description}, ${kind}, ${unit},
      ${access.role}, ${points}, ${startsOn}, ${endsOn}
    )
    RETURNING *
  `;

  return NextResponse.json({ ok: true, goal: rows[0] });
}
