import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { config } from "./config.js";

const url = new URL(config.databaseUrl);
const pool = mysql.createPool({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.replace(/^\//, "")),
  connectionLimit: 10,
  connectTimeout: 10_000,
  charset: "utf8mb4",
  timezone: "Z",
  typeCast(field, next) {
    if (field.type === "TINY" && field.length === 1) {
      const value = field.string();
      return value === null ? null : value === "1";
    }
    return next();
  },
});

type Row = RowDataPacket & Record<string, unknown>;
type Runner = Pool | PoolConnection;

async function run(conn: Runner, text: string, params: unknown[]) {
  const [result] = await conn.query(text, params);
  if (Array.isArray(result)) return result as Row[];
  const header = result as ResultSetHeader;
  if (header.insertId) return [{ id: Number(header.insertId) } as Row];
  if (header.affectedRows > 0) return [{ affected: header.affectedRows } as Row];
  return [] as Row[];
}

function compile(strings: TemplateStringsArray, values: unknown[]) {
  let text = "";
  const params: unknown[] = [];
  strings.forEach((part, index) => {
    text += part;
    if (index < values.length) {
      text += "?";
      params.push(values[index] === undefined ? null : values[index]);
    }
  });
  return { text, params };
}

export type Sql = {
  <T = Row[]>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  unsafe<T = Row[]>(query: string, params?: unknown[]): Promise<T>;
  begin<T>(fn: (tx: Sql) => Promise<T>): Promise<T>;
};

function createSql(conn: Runner): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = compile(strings, values);
    return run(conn, query.text, query.params);
  }) as Sql;
  sql.unsafe = async (query, params = []) => run(conn, query, params) as never;
  sql.begin = async (fn) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await fn(createSql(connection));
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };
  return sql;
}

export const sql = createSql(pool);

async function ensureColumn(table: string, column: string, definition: string) {
  const rows = await sql.unsafe<Array<{ n: number }>>(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  if (Number(rows[0]?.n)) return;
  await sql.unsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

export async function migrate() {
  const schema = readFileSync(fileURLToPath(new URL("./schema.sql", import.meta.url)), "utf8");
  const statements = schema.split(/;\s*\n/).map((part) => part.trim()).filter(Boolean);
  for (const statement of statements) await sql.unsafe(statement);
  await ensureColumn("users", "motto", "varchar(80) NULL");
  await ensureColumn("users", "accent", "varchar(16) NULL");
  await ensureColumn("server_combat", "persona", "varchar(80) NULL");
  await ensureColumn("server_combat", "avatar", "varchar(300) NULL");
  // Топ по умолчанию: все в рейтинге, пока сами/админ не скроют.
  await sql.unsafe("ALTER TABLE users MODIFY cis_opt_in tinyint(1) NOT NULL DEFAULT 1");
  await sql`UPDATE users SET cis_opt_in = 1 WHERE cis_opt_in = 0`;
  if (config.ownerSteamId) {
    await sql`INSERT IGNORE INTO admins (steam_id) VALUES (${config.ownerSteamId})`;
  }
}
