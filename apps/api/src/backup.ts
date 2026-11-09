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
  "squad_reports",
  "events",
  "builds",
  "build_votes",
  "build_notes",
];

const KEEP = 7;

function literal(value: unknown) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) {
    const pad = (part: number, size = 2) => String(part).padStart(size, "0");
    return `'${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())} ${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:${pad(value.getUTCSeconds())}.${pad(value.getUTCMilliseconds(), 3)}'`;
  }
  return `'${String(value).replaceAll("\\", "\\\\").replaceAll("'", "''")}'`;
}

export async function dumpDatabase() {
  const dir = fileURLToPath(new URL("../data/backups", import.meta.url));
  await mkdir(dir, { recursive: true });
  const lines = ["BEGIN;"];
  for (const table of TABLES) {
    if (!/^[a-z_]+$/.test(table)) continue;
    const columns = await sql<{ column_name: string; extra: string }[]>`
      SELECT column_name, extra
      FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ${table}
      ORDER BY ordinal_position
    `;
    if (!columns.length) continue;
    const names = columns.map((column) => column.column_name);
    const listed = names.map((name) => `\`${name}\``).join(", ");
    const rows = await sql.unsafe(`SELECT ${listed} FROM \`${table}\``);
    if (!rows.length) continue;
    for (const row of rows) {
      const values = names.map((name) => literal(row[name])).join(", ");
      lines.push(`INSERT INTO \`${table}\` (${listed}) VALUES (${values});`);
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
