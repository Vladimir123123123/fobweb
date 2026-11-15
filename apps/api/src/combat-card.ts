import { sql } from "./db.js";

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
  teamkills: number | null;
  enemy: { name: string; count: number } | null;
  target: { name: string; count: number } | null;
  weapons: Array<{ name: string; kills: number; headshots: number }>;
  since: string | null;
  last: string | null;
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
             MAX(meters) AS longest,
             ROUND(AVG(meters)) AS average
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
  const feedKills = num(shots[0]?.kills);
  const hasFeed = feedKills > 0;
  const playedNow = num(row.match_kills) > 0 || num(row.match_deaths) > 0;
  const matchCount = num(finished[0]?.n) + (playedNow ? 1 : 0);
  const matches = matchCount > 0 ? matchCount : num(row.kills) + num(row.deaths) > 0 ? 1 : null;
  const best = Math.max(num(finished[0]?.best), num(row.match_kills));
  const kills = num(row.kills);
  const deaths = num(row.deaths);
  const headshots = hasFeed ? num(shots[0]?.headshots) : null;
  return {
    kills,
    deaths,
    kd: kills + deaths > 0 ? num(row.kd) : null,
    place: num(ahead[0]?.n) + 1,
    of: num(totals[0]?.n),
    headshots,
    headshotPct: hasFeed ? Math.round((headshots! / feedKills) * 1000) / 10 : null,
    longest: hasFeed && shots[0]?.longest != null ? num(shots[0].longest) : null,
    average: hasFeed && shots[0]?.average != null ? num(shots[0].average) : null,
    bestMatch: best > 0 ? best : null,
    matches,
    perMatch: matches ? Math.round((kills / matches) * 10) / 10 : null,
    faction: String(row.faction || "").trim() || null,
    teamkills: hasFeed ? num(teamRows[0]?.n) : null,
    enemy: person(foes[0]?.name, foes[0]?.n),
    target: person(marks[0]?.name, marks[0]?.n),
    weapons: hasFeed ? guns.map((gun) => ({
      name: String(gun.name || "неизвестно"),
      kills: num(gun.kills),
      headshots: num(gun.headshots),
    })) : [],
    since: iso(row.first_seen),
    last: iso(row.seen_at),
  };
}
