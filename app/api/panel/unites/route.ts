import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { setupErrorResponse } from "@/lib/api-errors";
import { getAccountSession } from "@/lib/session";
import { canUsePanel } from "@/lib/panel-access";

export const runtime = "nodejs";

export async function GET() {
  try {
    const account = await getAccountSession();
    if (!canUsePanel(account)) {
      return NextResponse.json({ error: "Admin or uniteci only." }, { status: 403 });
    }

    const unites =
      account!.role === "admin"
        ? await sql`
            SELECT
              u.id,
              u.name,
              u.description,
              u.uniteci_user_id,
              u.created_at,
              owner.display_name AS uniteci_name,
              COUNT(DISTINCT g.id)::int AS group_count,
              COUNT(DISTINCT s.id)::int AS student_count
            FROM unites u
            LEFT JOIN users owner ON owner.id = u.uniteci_user_id
            LEFT JOIN groups g ON g.unite_id = u.id
            LEFT JOIN students s ON s.group_id = g.id
            GROUP BY u.id, owner.display_name
            ORDER BY u.created_at DESC
          `
        : await sql`
            SELECT
              u.id,
              u.name,
              u.description,
              u.uniteci_user_id,
              u.created_at,
              owner.display_name AS uniteci_name,
              COUNT(DISTINCT g.id)::int AS group_count,
              COUNT(DISTINCT s.id)::int AS student_count
            FROM unites u
            LEFT JOIN users owner ON owner.id = u.uniteci_user_id
            LEFT JOIN groups g ON g.unite_id = u.id
            LEFT JOIN students s ON s.group_id = g.id
            WHERE u.uniteci_user_id = ${account!.userId}
            GROUP BY u.id, owner.display_name
            ORDER BY u.created_at DESC
          `;

    const unitecis =
      account!.role === "admin"
        ? await sql`
            SELECT id, display_name, email
            FROM users
            WHERE role IN ('uniteci', 'admin')
            ORDER BY display_name ASC
          `
        : [];

    return NextResponse.json({ unites, unitecis });
  } catch (err) {
    const setupError = setupErrorResponse(err);
    if (setupError) return setupError;
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const account = await getAccountSession();
    if (account?.role !== "admin") {
      return NextResponse.json({ error: "Admin only." }, { status: 403 });
    }

    const { name, description, uniteci_user_id } = await req.json();
    const title = String(name ?? "").trim();
    const desc = description ? String(description).trim() : null;
    const uniteciUserId = uniteci_user_id ? String(uniteci_user_id) : null;

    if (title.length < 2) {
      return NextResponse.json(
        { error: "Unite name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (uniteciUserId) {
      const rows = await sql`
        SELECT id FROM users
        WHERE id = ${uniteciUserId} AND role IN ('uniteci', 'admin')
      `;
      if (rows.length === 0) {
        return NextResponse.json({ error: "Uniteci not found." }, { status: 404 });
      }
    }

    const rows = await sql`
      INSERT INTO unites (name, description, uniteci_user_id)
      VALUES (${title}, ${desc}, ${uniteciUserId})
      RETURNING id, name, description, uniteci_user_id, created_at
    `;

    return NextResponse.json({ ok: true, unite: rows[0] });
  } catch (err) {
    const setupError = setupErrorResponse(err);
    if (setupError) return setupError;
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
