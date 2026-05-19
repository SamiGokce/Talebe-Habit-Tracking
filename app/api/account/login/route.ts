import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { setupErrorResponse } from "@/lib/api-errors";
import { setAccountSession } from "@/lib/session";
import type { AppRole } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    if (!normalizedEmail || typeof password !== "string" || !password) {
      return NextResponse.json(
        { error: "Email and password required." },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, email, display_name, password_hash, role
      FROM users
      WHERE email = ${normalizedEmail}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }

    const user = rows[0] as {
      id: string;
      email: string;
      display_name: string;
      password_hash: string;
      role: AppRole;
    };
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (adminEmail && user.email === adminEmail && user.role !== "admin") {
      await sql`UPDATE users SET role = 'admin' WHERE id = ${user.id}`;
      user.role = "admin";
    }

    await setAccountSession({
      userId: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
      },
    });
  } catch (err) {
    const setupError = setupErrorResponse(err);
    if (setupError) return setupError;
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
