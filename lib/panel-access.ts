import { sql } from "@/lib/db";
import type { AccountSession } from "@/lib/session";

export function canUsePanel(account: AccountSession | null) {
  return account?.role === "admin" || account?.role === "uniteci";
}

export async function canAccessUnite(account: AccountSession, uniteId: string) {
  if (account.role === "admin") return true;
  if (account.role !== "uniteci") return false;

  const rows = await sql`
    SELECT 1 FROM unites
    WHERE id = ${uniteId} AND uniteci_user_id = ${account.userId}
  `;
  return rows.length > 0;
}

export async function canAccessGroup(account: AccountSession, groupId: string) {
  if (account.role === "admin") return true;
  if (account.role !== "uniteci") return false;

  const rows = await sql`
    SELECT 1
    FROM groups g
    JOIN unites u ON u.id = g.unite_id
    WHERE g.id = ${groupId} AND u.uniteci_user_id = ${account.userId}
  `;
  return rows.length > 0;
}

export async function canAccessStudent(account: AccountSession, studentId: string) {
  if (account.role === "admin") return true;
  if (account.role !== "uniteci") return false;

  const rows = await sql`
    SELECT 1
    FROM students s
    JOIN groups g ON g.id = s.group_id
    JOIN unites u ON u.id = g.unite_id
    WHERE s.id = ${studentId} AND u.uniteci_user_id = ${account.userId}
  `;
  return rows.length > 0;
}
