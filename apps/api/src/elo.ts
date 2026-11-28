import { sql } from "./db.js";
import { MIN_FIELD_WINRATE, MIN_PLAY_MINUTES } from "./match-rules.js";

export const ELO_START = 1000;
const ELO_K = 24;
const ELO_FLOOR = 100;
const ELO_CEIL = 3000;

type SideRow = {
  steam_id: string;
  faction: string;
  result: string;
  kills: number;
  deaths: number;
};

/** Уровень по ELO: 1…40. Старт 1000 ≈ уровень 6. */
export function eloLevel(rating: number) {
  const safe = Number.isFinite(rating) ? rating : ELO_START;
  return Math.max(1, Math.min(40, Math.floor((safe - 750) / 50) + 1));
}

function expectedScore(mine: number, opp: number) {
  return 1 / (1 + 10 ** ((opp - mine) / 400));
}

function clamp(value: number) {
  return Math.max(ELO_FLOOR, Math.min(ELO_CEIL, Math.round(value)));
}

function sideKey(faction: string) {
  const raw = faction.trim().toLowerCase();
  if (raw.includes("lone") || raw.includes("star")) return "ls";
  if (raw.includes("valk")) return "vk";
  if (raw.includes("mant")) return "mc";
  return "";
}

async function ensureTables() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS player_elo (
      steam_id varchar(20) NOT NULL PRIMARY KEY,
      rating int NOT NULL DEFAULT ${ELO_START},
      games int NOT NULL DEFAULT 0,
      wins int NOT NULL DEFAULT 0,
      losses int NOT NULL DEFAULT 0,
      updated_at datetime(3) NOT NULL DEFAULT current_timestamp(3)
        ON UPDATE current_timestamp(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS elo_applied (
      match_key varchar(80) NOT NULL PRIMARY KEY,
      applied_at datetime(3) NOT NULL DEFAULT current_timestamp(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ratingsOf(ids: string[]) {
  const map = new Map<string, number>();
  if (!ids.length) return map;
  const marks = ids.map(() => "?").join(", ");
  const rows = await sql.unsafe<Array<{ steam_id: string; rating: number }>>(
    `SELECT steam_id, rating FROM player_elo WHERE steam_id IN (${marks})`,
    ids,
  );
  for (const row of rows) map.set(String(row.steam_id), Number(row.rating) || ELO_START);
  for (const id of ids) if (!map.has(id)) map.set(id, ELO_START);
  return map;
}

async function writeRatings(
  updates: Array<{ steamId: string; rating: number; win: boolean }>,
) {
  for (const row of updates) {
    await sql`
      INSERT INTO player_elo (steam_id, rating, games, wins, losses)
      VALUES (
        ${row.steamId},
        ${row.rating},
        1,
        ${row.win ? 1 : 0},
        ${row.win ? 0 : 1}
      )
      ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        games = games + 1,
        wins = wins + ${row.win ? 1 : 0},
        losses = losses + ${row.win ? 0 : 1},
        updated_at = CURRENT_TIMESTAMP(3)
    `;
  }
}

/** Пересчёт ELO одного матча. Повторный вызов по тому же match_key пропускается. */
export async function applyMatchElo(matchKey: string) {
  const id = String(matchKey || "").trim();
  if (!id || id.startsWith("legacy-")) return false;
  await ensureTables();
  const seen = await sql<Array<{ n: number }>>`
    SELECT COUNT(*) AS n FROM elo_applied WHERE match_key = ${id}
  `;
  if (Number(seen[0]?.n || 0) > 0) return false;

  const rows = await sql<SideRow[]>`
    SELECT steam_id, faction, result, kills, deaths
    FROM played_matches
    WHERE match_key = ${id}
      AND result IN ('win', 'loss')
      AND faction <> ''
      AND steam_id REGEXP '^[0-9]{17}$'
      AND COALESCE(field_size, 0) BETWEEN ${MIN_FIELD_WINRATE} AND 120
      AND (minutes IS NULL OR minutes >= ${MIN_PLAY_MINUTES})
  `;
  if (rows.length < 4) {
    await sql`INSERT IGNORE INTO elo_applied (match_key) VALUES (${id})`;
    return false;
  }

  const bySide = new Map<string, SideRow[]>();
  for (const row of rows) {
    const key = sideKey(String(row.faction || ""));
    if (!key) continue;
    const list = bySide.get(key) ?? [];
    list.push(row);
    bySide.set(key, list);
  }
  if (bySide.size < 2) {
    await sql`INSERT IGNORE INTO elo_applied (match_key) VALUES (${id})`;
    return false;
  }

  const ids = rows.map((row) => String(row.steam_id));
  const current = await ratingsOf(ids);
  const sideAvg = new Map<string, number>();
  for (const [key, list] of bySide) {
    const sum = list.reduce((acc, row) => acc + (current.get(String(row.steam_id)) ?? ELO_START), 0);
    sideAvg.set(key, sum / list.length);
  }

  const updates: Array<{ steamId: string; rating: number; win: boolean }> = [];
  for (const [key, list] of bySide) {
    const foes = [...sideAvg.entries()].filter(([side]) => side !== key).map(([, avg]) => avg);
    if (!foes.length) continue;
    const opp = foes.reduce((a, b) => a + b, 0) / foes.length;
    for (const row of list) {
      const steamId = String(row.steam_id);
      const mine = current.get(steamId) ?? ELO_START;
      const win = String(row.result).toLowerCase() === "win";
      const score = win ? 1 : 0;
      // Слабый вклад личного K/D: лучше среднего чуть больше очков за победу / меньше за поражение.
      const kd = (Number(row.kills) || 0) / Math.max(1, Number(row.deaths) || 0);
      const tilt = Math.max(-0.15, Math.min(0.15, (kd - 1) * 0.05));
      const next = clamp(mine + ELO_K * (score - expectedScore(mine, opp) + (win ? tilt : -tilt)));
      updates.push({ steamId, rating: next, win });
      current.set(steamId, next);
    }
  }
  if (!updates.length) {
    await sql`INSERT IGNORE INTO elo_applied (match_key) VALUES (${id})`;
    return false;
  }
  await writeRatings(updates);
  await sql`INSERT IGNORE INTO elo_applied (match_key) VALUES (${id})`;
  return true;
}

export async function forgetMatchElo(matchKey: string) {
  const id = String(matchKey || "").trim();
  if (!id) return;
  await ensureTables();
  await sql`DELETE FROM elo_applied WHERE match_key = ${id}`;
}

/** Полный пересчёт с нуля по истории win/loss. */
export async function recomputeAllElo() {
  await ensureTables();
  await sql`DELETE FROM elo_applied`;
  await sql`DELETE FROM player_elo`;
  const matches = await sql<Array<{ match_key: string }>>`
    SELECT match_key
    FROM played_matches
    WHERE result IN ('win', 'loss')
      AND match_key NOT LIKE 'legacy-%'
      AND COALESCE(field_size, 0) BETWEEN ${MIN_FIELD_WINRATE} AND 120
      AND (minutes IS NULL OR minutes >= ${MIN_PLAY_MINUTES})
    GROUP BY match_key
    HAVING SUM(result = 'win') > 0 AND SUM(result = 'loss') > 0
    ORDER BY MIN(ended_at) ASC, match_key ASC
  `;
  let n = 0;
  for (const row of matches) {
    if (await applyMatchElo(String(row.match_key))) n += 1;
  }
  return n;
}

export async function ensureEloBootstrap() {
  await ensureTables();
  const mark = await sql`INSERT IGNORE INTO feed_keys (name, value) VALUES ('elo-v2', '1')`;
  if (!mark.length) return 0;
  return recomputeAllElo();
}

export async function playerElo(steamId: string) {
  await ensureTables();
  const rows = await sql<Array<{ rating: number; games: number; wins: number; losses: number }>>`
    SELECT rating, games, wins, losses FROM player_elo WHERE steam_id = ${steamId}
  `;
  const row = rows[0];
  if (!row) {
    return { rating: null, level: null, games: 0, wins: 0, losses: 0 };
  }
  const rating = Number(row.rating) || ELO_START;
  return {
    rating,
    level: eloLevel(rating),
    games: Number(row.games) || 0,
    wins: Number(row.wins) || 0,
    losses: Number(row.losses) || 0,
  };
}
