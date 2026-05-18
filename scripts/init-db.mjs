import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set. Create .env.local from .env.example.");
  process.exit(1);
}

try {
  const databaseUrl = new URL(process.env.DATABASE_URL);
  const placeholderParts = new Set(["host", "user", "pass", "db"]);
  const hasPlaceholder =
    placeholderParts.has(databaseUrl.hostname) ||
    placeholderParts.has(databaseUrl.username) ||
    placeholderParts.has(databaseUrl.password) ||
    placeholderParts.has(databaseUrl.pathname.replace(/^\//, ""));

  if (hasPlaceholder) {
    console.error(
      "DATABASE_URL still has placeholder values. Replace it in .env.local with your Neon or Vercel Postgres connection string."
    );
    process.exit(1);
  }
} catch {
  console.error("DATABASE_URL is not a valid Postgres connection string.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const schema = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");

const statements = schema
  .split(/;\s*\n/)
  .map((s) =>
    s
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim()
  )
  .filter((s) => s.length > 0);

for (const stmt of statements) {
  try {
    await sql(stmt);
    console.log("[ok]", stmt.split("\n")[0].slice(0, 70));
  } catch (err) {
    console.error("[fail]", stmt.split("\n")[0].slice(0, 70));
    console.error(err.message);
    if (err.cause?.message) {
      console.error(err.cause.message);
    }
    process.exit(1);
  }
}

console.log("\nDatabase ready.");
