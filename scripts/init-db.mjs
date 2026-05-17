import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set. Create .env.local from .env.example.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const schema = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");

const statements = schema
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

for (const stmt of statements) {
  try {
    await sql.query(stmt);
    console.log("✔", stmt.split("\n")[0].slice(0, 70));
  } catch (err) {
    console.error("✘", stmt.split("\n")[0].slice(0, 70));
    console.error(err.message);
    process.exit(1);
  }
}

console.log("\nDatabase ready.");
