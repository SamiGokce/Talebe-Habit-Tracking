import { createRemoteJWKSet, jwtVerify } from "jose";
import { sql } from "@/lib/db";
import type { AppRole } from "@/lib/types";

export type OAuthProvider = "google" | "apple";

type OAuthConfig = {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  jwksUrl: string;
  issuer: string | string[];
  scope: string;
  responseMode?: string;
};

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "apple";
}

export function getOAuthConfig(provider: OAuthProvider): OAuthConfig | null {
  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      clientId,
      clientSecret,
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      scope: "openid email profile",
    };
  }

  const clientId = process.env.APPLE_CLIENT_ID;
  const clientSecret = process.env.APPLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    authorizeUrl: "https://appleid.apple.com/auth/authorize",
    tokenUrl: "https://appleid.apple.com/auth/token",
    jwksUrl: "https://appleid.apple.com/auth/keys",
    issuer: "https://appleid.apple.com",
    scope: "name email",
    responseMode: "form_post",
  };
}

export function callbackUrl(req: Request, provider: OAuthProvider) {
  const url = new URL(req.url);
  return `${url.origin}/api/account/oauth/${provider}/callback`;
}

export async function verifyOAuthIdToken(
  provider: OAuthProvider,
  idToken: string,
  clientId: string
) {
  const config = getOAuthConfig(provider);
  if (!config) throw new Error("OAuth provider is not configured.");

  const jwks = createRemoteJWKSet(new URL(config.jwksUrl));
  const { payload } = await jwtVerify(idToken, jwks, {
    audience: clientId,
    issuer: config.issuer,
  });

  const email = String(payload.email ?? "").trim().toLowerCase();
  const sub = String(payload.sub ?? "");
  const name =
    typeof payload.name === "string" && payload.name.trim()
      ? payload.name.trim()
      : email.split("@")[0] || "Talebe";

  if (!email || !sub) {
    throw new Error("OAuth account did not include email.");
  }

  return { email, sub, name };
}

export async function upsertOAuthUser({
  provider,
  providerId,
  email,
  displayName,
  role = "talebe",
}: {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  displayName: string;
  role?: AppRole;
}) {
  const rows = await sql`
    INSERT INTO users (
      email, display_name, password_hash, role, auth_provider, auth_provider_id
    )
    VALUES (
      ${email}, ${displayName}, ${`oauth:${provider}:${providerId}`}, ${role},
      ${provider}, ${providerId}
    )
    ON CONFLICT (email) DO UPDATE SET
      auth_provider = EXCLUDED.auth_provider,
      auth_provider_id = EXCLUDED.auth_provider_id
    RETURNING id, email, display_name, role
  `;

  const user = rows[0] as {
    id: string;
    email: string;
    display_name: string;
    role: AppRole;
  };

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && user.email === adminEmail && user.role !== "admin") {
    await sql`UPDATE users SET role = 'admin' WHERE id = ${user.id}`;
    user.role = "admin";
  }

  return user;
}
