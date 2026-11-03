import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { config } from "./config.js";

export const sql = postgres(config.databaseUrl, { max: 10 });

export async function migrate() {
  const schema = readFileSync(fileURLToPath(new URL("./schema.sql", import.meta.url)), "utf8");
  const statements = schema.split(/;\s*\n/).map((part) => part.trim()).filter(Boolean);
  for (const statement of statements) await sql.unsafe(statement);
  if (config.ownerSteamId) {
    await sql`INSERT INTO admins (steam_id) VALUES (${config.ownerSteamId}) ON CONFLICT DO NOTHING`;
  }
}
