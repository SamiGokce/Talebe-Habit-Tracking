import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  callbackUrl,
  getOAuthConfig,
  isOAuthProvider,
  upsertOAuthUser,
  verifyOAuthIdToken,
} from "@/lib/oauth";
import { setAccountSession } from "@/lib/session";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ provider: string }> };

async function callbackParams(req: Request) {
  if (req.method === "POST") {
    const form = await req.formData();
    return {
      code: String(form.get("code") ?? ""),
      state: String(form.get("state") ?? ""),
    };
  }
  const url = new URL(req.url);
  return {
    code: url.searchParams.get("code") ?? "",
    state: url.searchParams.get("state") ?? "",
  };
}

async function handle(req: Request, ctx: Ctx) {
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

  const { code, state } = await callbackParams(req);
  const jar = await cookies();
  const saved = jar.get("talebe_oauth_state")?.value;
  jar.delete("talebe_oauth_state");
  const parsed = saved ? (JSON.parse(saved) as { state: string; next: string }) : null;

  if (!code || !state || !parsed || parsed.state !== state) {
    return NextResponse.json({ error: "Invalid sign-in state." }, { status: 400 });
  }

  const tokenRes = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl(req, providerParam),
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.id_token) {
    return NextResponse.json({ error: "Could not complete sign-in." }, { status: 401 });
  }

  const profile = await verifyOAuthIdToken(
    providerParam,
    String(tokenData.id_token),
    config.clientId
  );
  const user = await upsertOAuthUser({
    provider: providerParam,
    providerId: profile.sub,
    email: profile.email,
    displayName: profile.name,
  });

  await setAccountSession({
    userId: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
  });

  return NextResponse.redirect(new URL(parsed.next || "/student/today", req.url));
}

export async function GET(req: Request, ctx: Ctx) {
  return handle(req, ctx);
}

export async function POST(req: Request, ctx: Ctx) {
  return handle(req, ctx);
}
