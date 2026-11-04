import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "./db.js";

const TABLES = [
  "users",
  "admins",
  "admin_invites",
  "snapshots",
  "sync_sessions",
  "squads",
  "squad_assets",
  "squad_members",
  "events",
  "builds",
  "build_votes",
  "build_notes",
];

const KEEP = 7;

function literal(value: unknown) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return `'${value.toISOString()}'`;
  return `'${String(value).replaceAll("'", "''")}'`;
}

export async function dumpDatabase() {
  const dir = fileURLToPath(new URL("../data/backups", import.meta.url));
  await mkdir(dir, { recursive: true });
  const lines = ["BEGIN;"];
  for (const table of TABLES) {
    if (!/^[a-z_]+$/.test(table)) continue;
    const columns = await sql<{ column_name: string; is_identity: string }[]>`
      SELECT column_name, is_identity
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table}
      ORDER BY ordinal_position
    `;
    if (!columns.length) continue;
    const names = columns.map((column) => column.column_name);
    const rows = await sql.unsafe(`SELECT ${names.map((name) => `"${name}"`).join(", ")} FROM ${table}`);
    if (!rows.length) continue;
    const identity = columns.some((column) => column.is_identity === "YES");
    const listed = names.map((name) => `"${name}"`).join(", ");
    for (const row of rows) {
      const values = names.map((name) => literal(row[name])).join(", ");
      lines.push(`INSERT INTO ${table} (${listed})${identity ? " OVERRIDING SYSTEM VALUE" : ""} VALUES (${values});`);
    }
  }
  lines.push("COMMIT;");
  const stamp = new Date().toISOString().slice(0, 10);
  const file = join(dir, `wardogs-${stamp}.sql`);
  await writeFile(file, lines.join("\n"));

  const files = await readdir(dir);
  const dumps = await Promise.all(files.filter((name) => name.endsWith(".sql")).map(async (name) => ({
    name,
    time: (await stat(join(dir, name))).mtimeMs,
  })));
  dumps.sort((a, b) => b.time - a.time);
  for (const old of dumps.slice(KEEP)) await unlink(join(dir, old.name));
  return file;
}
