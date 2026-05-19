import { NextResponse } from "next/server";

export function setupErrorResponse(err: unknown) {
  const message = err instanceof Error ? err.message : String(err ?? "");

  if (message.includes("DATABASE_URL") || message.includes("POSTGRES_URL")) {
    return NextResponse.json(
      {
        error:
          "Database is not configured. Add DATABASE_URL or POSTGRES_URL in Vercel environment variables.",
      },
      { status: 500 }
    );
  }

  if (message.includes("SESSION_SECRET")) {
    return NextResponse.json(
      {
        error:
          "SESSION_SECRET is missing or too short in Vercel environment variables.",
      },
      { status: 500 }
    );
  }

  if (
    message.includes("relation") &&
    (message.includes("users") || message.includes("does not exist"))
  ) {
    return NextResponse.json(
      {
        error:
          "Database schema is not initialized. Run the latest schema.sql in your production database.",
      },
      { status: 500 }
    );
  }

  return null;
}
