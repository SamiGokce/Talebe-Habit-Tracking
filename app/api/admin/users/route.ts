import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAccountSession } from "@/lib/session";
import type { AppRole } from "@/lib/types";

export const runtime = "nodejs";

const ROLES = new Set(["talebe", "mentor", "uniteci", "admin"]);

async function requireAdmin() {
  const account = await getAccountSession();
  return account?.role === "admin" ? account : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const users = await sql`
    SELECT id, email, display_name, role, created_at
    FROM users
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const { user_id, role } = await req.json();
  const nextRole = String(role ?? "") as AppRole;
  if (!user_id || !ROLES.has(nextRole)) {
    return NextResponse.json({ error: "User and valid role required." }, { status: 400 });
  }

  const rows = await sql`
    UPDATE users
    SET role = ${nextRole}
    WHERE id = ${String(user_id)}
    RETURNING id, email, display_name, role, created_at
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, user: rows[0] });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const { user_id } = await req.json();
  const userId = String(user_id ?? "");
  if (!userId) {
    return NextResponse.json({ error: "User required." }, { status: 400 });
  }
  if (userId === admin.userId) {
    return NextResponse.json(
      { error: "You cannot delete your own admin account." },
      { status: 400 }
    );
  }

  const rows = await sql`
    DELETE FROM users
    WHERE id = ${userId}
    RETURNING id
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
