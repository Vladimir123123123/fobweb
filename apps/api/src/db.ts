import { existsSync, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { config } from "./config.js";

async function localDatabase() {
  const url = new URL(config.databaseUrl);
  if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return;
  const probe = postgres(config.databaseUrl, { max: 1, connect_timeout: 3 });
  try {
    await probe`SELECT 1`;
    return;
  } catch {
    // На машине Node своей базы ещё нет: поднимаем её рядом с API.
  } finally {
    await probe.end({ timeout: 1 }).catch(() => {});
  }

  const { default: EmbeddedPostgres } = await import("embedded-postgres");
  const dir = fileURLToPath(new URL("../data/pg", import.meta.url));
  await mkdir(dir, { recursive: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dir,
    user: decodeURIComponent(url.username || "wardogs"),
    password: decodeURIComponent(url.password || "wardogs"),
    port: Number(url.port || 5432),
    persistent: true,
    autoRehydrateSymlinks: true,
  });
  if (!existsSync(`${dir}/PG_VERSION`)) await pg.initialise();
  await pg.start();
  const name = decodeURIComponent(url.pathname.replace(/^\//, "") || "wardogs");
  try {
    await pg.createDatabase(name);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) throw error;
  }
}

await localDatabase();

export const sql = postgres(config.databaseUrl, { max: 10 });

export async function migrate() {
  const schema = readFileSync(fileURLToPath(new URL("./schema.sql", import.meta.url)), "utf8");
  const statements = schema.split(/;\s*\n/).map((part) => part.trim()).filter(Boolean);
  for (const statement of statements) await sql.unsafe(statement);
  if (config.ownerSteamId) {
    await sql`INSERT INTO admins (steam_id) VALUES (${config.ownerSteamId}) ON CONFLICT DO NOTHING`;
  }
}
