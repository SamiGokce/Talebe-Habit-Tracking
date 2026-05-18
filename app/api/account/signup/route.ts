import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { normalizeName } from "@/lib/codes";
import { setAccountSession } from "@/lib/session";
import type { AppRole } from "@/lib/types";

export const runtime = "nodejs";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function roleForEmail(email: string): AppRole {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return adminEmail && email === adminEmail ? "admin" : "talebe";
}

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();
    const normalizedEmail = normalizeEmail(String(email ?? ""));
    const displayName = normalizeName(String(name ?? ""));

    if (
      !normalizedEmail.includes("@") ||
      displayName.length < 2 ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return NextResponse.json(
        {
          error:
            "Name, valid email, and password with at least 8 characters are required.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const role = roleForEmail(normalizedEmail);

    const rows = await sql`
      INSERT INTO users (email, display_name, password_hash, role)
      VALUES (${normalizedEmail}, ${displayName}, ${passwordHash}, ${role})
      RETURNING id, email, display_name, role
    `;
    const user = rows[0] as {
      id: string;
      email: string;
      display_name: string;
      role: AppRole;
    };

    await setAccountSession({
      userId: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    });

    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    if (String(err?.message || "").includes("duplicate key")) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
