import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  callbackUrl,
  getOAuthConfig,
  isOAuthProvider,
} from "@/lib/oauth";

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
  const state = crypto.randomUUID();
  const jar = await cookies();
  jar.set("talebe_oauth_state", JSON.stringify({ state, next }), {
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
