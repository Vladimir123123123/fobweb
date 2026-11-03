import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import EmbeddedPostgres from "embedded-postgres";

const dir = fileURLToPath(new URL("../.pgdata", import.meta.url));
await mkdir(dir, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: "wardogs",
  password: "wardogs",
  port: 5432,
  persistent: true,
  autoRehydrateSymlinks: true,
});

try {
  if (!existsSync(`${dir}/PG_VERSION`)) await pg.initialise();
  await pg.start();
  try {
    await pg.createDatabase("wardogs");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) throw error;
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message || "PostgreSQL не запустился.");
  console.error("Если учётка Windows с правами администратора, Postgres так не стартует. Нужна обычная служба PostgreSQL или уже готовый DATABASE_URL.");
  process.exit(1);
}

console.log("PostgreSQL слушает localhost:5432, база wardogs");
await new Promise(() => {});
