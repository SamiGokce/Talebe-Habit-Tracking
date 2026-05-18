import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url || url === "postgres://placeholder") {
    throw new Error(
      "DATABASE_URL or POSTGRES_URL is not set. Add one in .env.local or in Vercel project settings."
    );
  }
  _sql = neon(url);
  return _sql;
}

// Proxy so we can still call sql`...` from route handlers
// without doing getSql() everywhere.
export const sql: NeonQueryFunction<false, false> = new Proxy(
  (() => {}) as unknown as NeonQueryFunction<false, false>,
  {
    apply(_t, _this, args: unknown[]) {
      return (getSql() as unknown as (...a: unknown[]) => unknown)(...args);
    },
    get(_t, prop, _r) {
      const s = getSql() as unknown as Record<string | symbol, unknown>;
      return s[prop];
    },
  }
);
