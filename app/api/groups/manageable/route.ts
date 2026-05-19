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
          SELECT g.id, g.code, g.name, g.school_level, g.mentor_name, u.name AS unite_name
          FROM groups g
          LEFT JOIN unites u ON u.id = g.unite_id
          WHERE g.mentor_user_id = ${account.userId}
          ORDER BY g.created_at DESC
        `
      : account.role === "uniteci"
        ? await sql`
          SELECT g.id, g.code, g.name, g.school_level, g.mentor_name, u.name AS unite_name
          FROM groups g
          JOIN unites u ON u.id = g.unite_id
          WHERE u.uniteci_user_id = ${account.userId}
          ORDER BY g.created_at DESC
        `
        : account.role === "admin"
          ? await sql`
          SELECT g.id, g.code, g.name, g.school_level, g.mentor_name, u.name AS unite_name
          FROM groups
          g
          LEFT JOIN unites u ON u.id = g.unite_id
          ORDER BY g.created_at DESC
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

  const unites =
    account.role === "admin"
      ? await sql`
          SELECT id, name
          FROM unites
          ORDER BY name ASC
        `
      : account.role === "uniteci"
        ? await sql`
            SELECT id, name
            FROM unites
            WHERE uniteci_user_id = ${account.userId}
            ORDER BY name ASC
          `
        : [];

  return NextResponse.json({ groups, mentors, unites });
}
