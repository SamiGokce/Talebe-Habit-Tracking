import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAccountSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const account = await getAccountSession();
  if (!account) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const groups =
    account.role === "mentor"
      ? await sql`
          SELECT id, code, name, school_level, mentor_name
          FROM groups
          WHERE mentor_user_id = ${account.userId}
          ORDER BY created_at DESC
        `
      : ["uniteci", "admin"].includes(account.role)
        ? await sql`
            SELECT id, code, name, school_level, mentor_name
            FROM groups
            ORDER BY created_at DESC
          `
        : [];

  const mentors =
    ["uniteci", "admin"].includes(account.role)
      ? await sql`
          SELECT id, email, display_name, role
          FROM users
          WHERE role IN ('mentor', 'uniteci', 'admin')
          ORDER BY display_name ASC
        `
      : [];

  return NextResponse.json({ groups, mentors });
}
