import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getHabitSettings } from "@/lib/habit-settings";
import { getLeaderSession } from "@/lib/session";
import {
  MENTOR_TOGGLE_HABIT_KEYS,
} from "@/lib/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getLeaderSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const students = await sql`
    SELECT id, display_name, created_at
    FROM students
    WHERE id = ${id} AND group_id = ${session.groupId}
  `;
  if (students.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entries = await sql`
    SELECT * FROM entries
    WHERE student_id = ${id}
      AND entry_date >= CURRENT_DATE - 60
    ORDER BY entry_date DESC
  `;
  const habitSettings = await getHabitSettings(id);
  return NextResponse.json({ student: students[0], entries, habitSettings });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getLeaderSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const students = await sql`
    SELECT id
    FROM students
    WHERE id = ${id} AND group_id = ${session.groupId}
  `;
  if (students.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const settings = body.habitSettings as Record<string, unknown> | undefined;
  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "Habit settings required." }, { status: 400 });
  }

  for (const key of MENTOR_TOGGLE_HABIT_KEYS) {
    if (key in settings) {
      await sql`
        INSERT INTO student_habit_settings (student_id, habit_key, enabled)
        VALUES (${id}, ${key}, ${Boolean(settings[key])})
        ON CONFLICT (student_id, habit_key) DO UPDATE SET
          enabled = EXCLUDED.enabled,
          updated_at = NOW()
      `;
    }
  }

  const habitSettings = await getHabitSettings(id);
  return NextResponse.json({ ok: true, habitSettings });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getLeaderSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await sql`DELETE FROM students WHERE id = ${id} AND group_id = ${session.groupId}`;
  return NextResponse.json({ ok: true });
}
