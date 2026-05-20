import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  callbackUrl,
  getOAuthConfig,
  isOAuthProvider,
} from "@/lib/oauth";
import { signupRoleFrom, validateSignupRole } from "@/lib/signup-roles";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ provider: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { provider: providerParam } = await ctx.params;
  if (!isOAuthProvider(providerParam)) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 404 });
  }

  const config = getOAuthConfig(providerParam);
  if (!config) {
    return NextResponse.json(
      { error: `${providerParam} sign-in is not configured yet.` },
      { status: 503 }
    );
  }

  const reqUrl = new URL(req.url);
  const next = reqUrl.searchParams.get("next") || "/student/today";
  const requestedRole = signupRoleFrom(reqUrl.searchParams.get("requested_role"));
  const roleCode = reqUrl.searchParams.get("role_code");
  const email = reqUrl.searchParams.get("email")?.trim().toLowerCase() || "";
  if (requestedRole !== "talebe") {
    const roleResult = validateSignupRole({
      email,
      requestedRole,
      code: roleCode,
    });
    if (!roleResult.ok) {
      return NextResponse.json(
        { error: roleResult.error },
        { status: roleResult.status }
      );
    }
  }

  const state = crypto.randomUUID();
  const jar = await cookies();
  jar.set("talebe_oauth_state", JSON.stringify({ state, next, signupRole: requestedRole }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  const authUrl = new URL(config.authorizeUrl);
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", callbackUrl(req, providerParam));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scope);
  authUrl.searchParams.set("state", state);
  if (config.responseMode) {
    authUrl.searchParams.set("response_mode", config.responseMode);
  }
  if (providerParam === "google") {
    authUrl.searchParams.set("prompt", "select_account");
  }

  return NextResponse.redirect(authUrl);
}
