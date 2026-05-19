import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AppRole } from "@/lib/types";

function getKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is not set or too short (need 16+ chars)."
    );
  }
  return new TextEncoder().encode(secret);
}

const ACCOUNT_COOKIE = "talebe_account";
const STUDENT_COOKIE = "talebe_student";
const LEADER_COOKIE = "talebe_leader";

export type AccountSession = {
  userId: string;
  email: string;
  displayName: string;
  role: AppRole;
};

export type StudentSession = {
  studentId: string;
  groupId: string;
  groupCode: string;
  displayName: string;
};

export type LeaderSession = {
  groupId: string;
  groupCode: string;
  groupName: string;
  schoolLevel?: "middle_school" | "high_school" | "mixed";
  mentorName?: string | null;
};

async function signToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getKey());
}

async function verifyToken<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, getKey());
    return payload as T;
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

export async function setAccountSession(s: AccountSession) {
  const token = await signToken({ ...s });
  const jar = await cookies();
  jar.set(ACCOUNT_COOKIE, token, cookieOptions());
}

export async function getAccountSession(): Promise<AccountSession | null> {
  const jar = await cookies();
  const token = jar.get(ACCOUNT_COOKIE)?.value;
  if (!token) return null;
  return verifyToken<AccountSession>(token);
}

export async function clearAccountSession() {
  const jar = await cookies();
  jar.delete(ACCOUNT_COOKIE);
  jar.delete(STUDENT_COOKIE);
  jar.delete(LEADER_COOKIE);
}

export async function setStudentSession(s: StudentSession) {
  const token = await signToken({ ...s });
  const jar = await cookies();
  jar.set(STUDENT_COOKIE, token, cookieOptions());
}

export async function getStudentSession(): Promise<StudentSession | null> {
  const jar = await cookies();
  const token = jar.get(STUDENT_COOKIE)?.value;
  if (!token) return null;
  return verifyToken<StudentSession>(token);
}

export async function clearStudentSession() {
  const jar = await cookies();
  jar.delete(STUDENT_COOKIE);
}

export async function setLeaderSession(s: LeaderSession) {
  const token = await signToken({ ...s });
  const jar = await cookies();
  jar.set(LEADER_COOKIE, token, cookieOptions());
}

export async function getLeaderSession(): Promise<LeaderSession | null> {
  const jar = await cookies();
  const token = jar.get(LEADER_COOKIE)?.value;
  if (!token) return null;
  return verifyToken<LeaderSession>(token);
}

export async function clearLeaderSession() {
  const jar = await cookies();
  jar.delete(LEADER_COOKIE);
}
