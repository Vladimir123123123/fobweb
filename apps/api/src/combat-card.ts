import { sql } from "./db.js";
import { cleanSide } from "./sides.js";

export type CombatCard = {
  kills: number;
  deaths: number;
  kd: number | null;
  place: number;
  of: number;
  headshots: number | null;
  headshotPct: number | null;
  longest: number | null;
  average: number | null;
  bestMatch: number | null;
  matches: number | null;
  perMatch: number | null;
  faction: string | null;
  side: "lone" | "valk" | "mant" | null;
  teamkills: number | null;
  enemy: { name: string; count: number } | null;
  target: { name: string; count: number } | null;
  weapons: Array<{ name: string; kills: number; headshots: number }>;
  winrate: number | null;
  /** Сколько последних решённых игр вошло в винрейт, не больше 10. */
  winGames: number;
  /** Последние решённые игры, новые первыми. */
  form: Array<"win" | "loss">;
  history: PlayedMatch[];
  since: string | null;
  last: string | null;
};

export type PlayedMatch = {
  endedAt: string | null;
  server: string;
  map: string;
  minutes: number | null;
  faction: string;
  result: string;
  place: number | null;
  field: number | null;
  kills: number;
  deaths: number;
  kd: number | null;
  headshots: number;
  teamkills: number;
  weapon: string;
};

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function iso(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function sideKey(name: string) {
  const key = name.toLowerCase();
  if (key.includes("lone") || key.includes("star")) return "lone" as const;
  if (key.includes("valk")) return "valk" as const;
  if (key.includes("mant")) return "mant" as const;
  return null;
}

function person(name: unknown, count: unknown) {
  const label = String(name || "").trim();
  const times = Math.round(num(count));
  return label && times > 0 ? { name: label, count: times } : null;
}

/** Карточка боя на нашем сервере: счёт из ростера, оружие и дистанции из киллфида. */
export async function combatCard(steamId: string): Promise<CombatCard | null> {
  if (!/^\d{17}$/.test(steamId)) return null;
  const rows = await sql<Array<{
    kills: number;
    deaths: number;
    kd: number | string | null;
    faction: string | null;
    match_kills: number;
    match_deaths: number;
    seen_at: unknown;
    first_seen: unknown;
  }>>`
    SELECT kills, deaths, faction, match_kills, match_deaths, seen_at, first_seen,
           CASE WHEN deaths = 0 THEN kills ELSE ROUND(kills / deaths, 2) END AS kd
    FROM server_combat
    WHERE steam_id = ${steamId}
  `;
  const row = rows[0];
  if (!row) return null;
  const [totals, ahead, finished, shots, foes, marks, guns] = await Promise.all([
    sql<Array<{ n: number }>>`SELECT COUNT(*) AS n FROM server_combat`,
    sql<Array<{ n: number }>>`SELECT COUNT(*) AS n FROM server_combat WHERE kills > ${row.kills}`,
    sql<Array<{ n: number; best: number | null }>>`
      SELECT COUNT(*) AS n, MAX(kills) AS best FROM server_matches WHERE steam_id = ${steamId}
    `,
    sql<Array<{ kills: number; headshots: number | null; longest: number | null; average: number | null }>>`
      SELECT COUNT(*) AS kills,
             SUM(headshot) AS headshots,
             MAX(CASE WHEN meters BETWEEN 1 AND 300 THEN meters END) AS longest,
             ROUND(AVG(CASE WHEN meters BETWEEN 1 AND 300 THEN meters END)) AS average
      FROM server_kills
      WHERE killer_steam = ${steamId} AND suicide = 0
    `,
    sql<Array<{ name: string; n: number }>>`
      SELECT killer_name AS name, COUNT(*) AS n
      FROM server_kills
      WHERE victim_steam = ${steamId} AND suicide = 0 AND killer_steam <> '' AND killer_steam <> ${steamId}
      GROUP BY killer_name
      ORDER BY n DESC
      LIMIT 1
    `,
    sql<Array<{ name: string; n: number }>>`
      SELECT victim_name AS name, COUNT(*) AS n
      FROM server_kills
      WHERE killer_steam = ${steamId} AND suicide = 0 AND victim_name <> ''
      GROUP BY victim_name
      ORDER BY n DESC
      LIMIT 1
    `,
    sql<Array<{ name: string; kills: number; headshots: number | null }>>`
      SELECT weapon AS name, COUNT(*) AS kills, SUM(headshot) AS headshots
      FROM server_kills
      WHERE killer_steam = ${steamId} AND suicide = 0 AND weapon <> ''
      GROUP BY weapon
      ORDER BY kills DESC
      LIMIT 6
    `,
  ]);
  const teamRows = await sql<Array<{ n: number }>>`
    SELECT COUNT(*) AS n FROM server_kills WHERE killer_steam = ${steamId} AND teamkill = 1
  `;
  const deathRows = await sql<Array<{ n: number }>>`
    SELECT COUNT(*) AS n FROM server_kills WHERE victim_steam = ${steamId}
  `;
  // Только матчи от начала до конца (не досрочный выход). Винрейт — по ним же.
  const historyRows = await sql<Array<Record<string, unknown>>>`
    SELECT ended_at, server_name, map_name, minutes, faction, result, place, field_size,
           kills, deaths, headshots, teamkills, weapon
    FROM played_matches
    WHERE steam_id = ${steamId}
      AND field_size BETWEEN 2 AND 120
      AND result IN ('win', 'loss')
      AND (map_name <> '' OR result <> '')
    ORDER BY ended_at IS NULL, ended_at DESC, id DESC
    LIMIT 40
  `;
  const lastRows = await sql<Array<{ result: string }>>`
    SELECT result FROM played_matches
    WHERE steam_id = ${steamId} AND result IN ('win', 'loss') AND field_size BETWEEN 2 AND 120
    ORDER BY ended_at IS NULL, ended_at DESC, id DESC
    LIMIT 10
  `;
  const rateRows = await sql<Array<{ n: number; best: number | null }>>`
    SELECT COUNT(*) AS n, MAX(kills) AS best
    FROM played_matches
    WHERE steam_id = ${steamId} AND result IN ('win', 'loss') AND field_size BETWEEN 2 AND 120
  `;
  const history = historyRows.map((item) => {
    const kills = num(item.kills);
    const deaths = num(item.deaths);
    return {
      endedAt: iso(item.ended_at),
      server: String(item.server_name || ""),
      map: String(item.map_name || ""),
      minutes: item.minutes == null ? null : num(item.minutes),
      faction: String(item.faction || ""),
      result: String(item.result || ""),
      place: item.place == null ? null : num(item.place),
      field: item.field_size == null ? null : num(item.field_size),
      kills,
      deaths,
      kd: kills + deaths > 0 ? Math.round((deaths ? kills / deaths : kills) * 100) / 100 : 0,
      headshots: num(item.headshots),
      teamkills: num(item.teamkills),
      weapon: String(item.weapon || ""),
    };
  });
  const favoriteRows = await sql<Array<{ faction: string }>>`
    SELECT faction
    FROM played_matches
    WHERE steam_id = ${steamId} AND faction <> '' AND field_size BETWEEN 2 AND 120 AND (map_name <> '' OR result <> '')
    GROUP BY faction
    ORDER BY COUNT(*) DESC, MAX(ended_at) DESC
    LIMIT 1
  `;
  const form = lastRows.map((item) => (item.result === "win" ? "win" : "loss") as "win" | "loss");
  const decided = form.length;
  const wins = form.filter((item) => item === "win").length;
  const winrate = decided > 0 ? Math.round((wins / decided) * 1000) / 10 : null;
  const feedKills = num(shots[0]?.kills);
  const hasFeed = feedKills > 0;
  const playedNow = num(row.match_kills) > 0 || num(row.match_deaths) > 0;
  const logged = num(rateRows[0]?.n);
  const rounds = num(finished[0]?.n);
  const matchCount = rounds > 0 ? rounds : logged;
  const kills = hasFeed ? feedKills : num(row.kills);
  const deaths = num(deathRows[0]?.n) > 0 ? num(deathRows[0]?.n) : num(row.deaths);
  const matches = matchCount > 0 ? matchCount + (playedNow && rounds > 0 ? 1 : 0) : kills + deaths > 0 ? 1 : null;
  const best = Math.max(num(finished[0]?.best), num(row.match_kills));
  const headshots = hasFeed ? num(shots[0]?.headshots) : null;
  const faction = cleanSide(favoriteRows[0]?.faction) || cleanSide(row.faction);
  return {
    kills,
    deaths,
    kd: kills + deaths > 0 ? Math.round((deaths ? kills / deaths : kills) * 100) / 100 : null,
    place: num(ahead[0]?.n) + 1,
    of: num(totals[0]?.n),
    headshots,
    headshotPct: hasFeed ? Math.round((headshots! / feedKills) * 1000) / 10 : null,
    longest: hasFeed && shots[0]?.longest != null ? num(shots[0].longest) : null,
    average: hasFeed && shots[0]?.average != null ? num(shots[0].average) : null,
    bestMatch: best > 0 ? best : null,
    matches,
    perMatch: matches ? Math.round((kills / matches) * 10) / 10 : null,
    faction: faction || null,
    side: sideKey(faction),
    teamkills: hasFeed ? num(teamRows[0]?.n) : null,
    enemy: person(foes[0]?.name, foes[0]?.n),
    target: person(marks[0]?.name, marks[0]?.n),
    weapons: hasFeed ? guns.map((gun) => ({
      name: String(gun.name || "неизвестно"),
      kills: num(gun.kills),
      headshots: num(gun.headshots),
    })) : [],
    winrate,
    winGames: decided,
    form,
    history,
    since: iso(row.first_seen),
    last: iso(row.seen_at),
  };
}
