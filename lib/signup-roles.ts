import type { AppRole } from "@/lib/types";

export type SignupRole = "talebe" | "mentor" | "uniteci";

export function signupRoleFrom(value: unknown): SignupRole {
  return value === "mentor" || value === "uniteci" ? value : "talebe";
}

export function roleDestination(role: AppRole) {
  if (role === "mentor") return "/leader";
  if (role === "uniteci") return "/panel";
  if (role === "admin") return "/panel";
  return "/student/join";
}

export function validateSignupRole({
  email,
  requestedRole,
  code,
}: {
  email: string;
  requestedRole: SignupRole;
  code: unknown;
}): { ok: true; role: AppRole } | { ok: false; error: string; status: number } {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && email === adminEmail) {
    return { ok: true, role: "admin" };
  }

  if (requestedRole === "talebe") {
    return { ok: true, role: "talebe" };
  }

  const expected =
    requestedRole === "mentor"
      ? process.env.MENTOR_SIGNUP_CODE
      : process.env.UNITECI_SIGNUP_CODE;

  if (!expected) {
    return {
      ok: false,
      error: `${requestedRole} signup code is not configured yet.`,
      status: 503,
    };
  }

  if (String(code ?? "").trim() !== expected.trim()) {
    return {
      ok: false,
      error:
        requestedRole === "mentor"
          ? "Mentor signup code is incorrect."
          : "Uniteci signup code is incorrect.",
      status: 403,
    };
  }

  return { ok: true, role: requestedRole };
}
