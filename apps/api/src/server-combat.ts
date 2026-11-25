import { config } from "./config.js";
import { sql } from "./db.js";
import { creditSeed } from "./shop.js";
import { recentKills } from "./kill-feed.js";
import { rememberRoster } from "./roster-cache.js";
import { steamProfile, wardogsHours } from "./steam.js";

const HOT_KILLS = 15;
const TEN_MINUTES = 10 * 60 * 1000;
const PUSH_TTL = 3 * 60 * 1000;
const PLAYABLE = ["lonestar", "valkyra", "manticore"] as const;
const killTicks: Array<{ at: number; kills: number }> = [];
const killFeed: Array<{ at: number; name: string; faction: string; gained: number }> = [];
const matchKills = new Map<string, number>();
const knownHours = new Map<string, number | null>();
let lastRoster: RosterPlayer[] = [];
let pushedRoster: { at: number; factions: Array<{ name: string; score: number }>; players: RosterPlayer[] } | null = null;

function sideOf(name: string) {
  const key = name.toLowerCase();
  if (key.includes("lone") || key.includes("star")) return "lonestar";
  if (key.includes("valk")) return "valkyra";
  if (key.includes("mant")) return "manticore";
  return key || "other";
}

function noteKills(players: RosterPlayer[]) {
  let gained = 0;
  const seen = new Set<string>();
  for (const player of players) {
    seen.add(player.steamId);
    const previous = matchKills.get(player.steamId);
    if (previous !== undefined && player.kills > previous) {
      const delta = player.kills - previous;
      gained += delta;
      killFeed.unshift({
        at: Date.now(),
        name: player.name || "игрок",
        faction: player.faction,
        gained: delta,
      });
    } else if (previous !== undefined) {
      gained += player.kills >= previous ? 0 : player.kills;
    }
    matchKills.set(player.steamId, player.kills);
  }
  for (const steamId of matchKills.keys()) {
    if (!seen.has(steamId)) matchKills.delete(steamId);
  }
  const now = Date.now();
  if (gained > 0) killTicks.push({ at: now, kills: gained });
  const cutoff = now - TEN_MINUTES;
  while (killTicks.length && killTicks[0].at < cutoff) killTicks.shift();
  while (killFeed.length > 40) killFeed.pop();
}

export function killsInTenMinutes() {
  const cutoff = Date.now() - TEN_MINUTES;
  return killTicks.filter((tick) => tick.at >= cutoff).reduce((sum, tick) => sum + tick.kills, 0);
}

async function hoursOf(steamIds: string[]) {
  const found = new Map<string, number | null>();
  let cursor = 0;
  const worker = async () => {
    while (cursor < steamIds.length) {
      const steamId = steamIds[cursor];
      cursor += 1;
      found.set(steamId, await wardogsHours(steamId));
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, steamIds.length) }, worker));
  return found;
}

function rosterNow() {
  if (config.rconHost && config.rconPassword) return lastRoster;
  if (pushedRoster && Date.now() - pushedRoster.at < PUSH_TTL) return pushedRoster.players;
  return lastRoster;
}

function factionsNow(factions: Array<{ name: string; score: number }>) {
  if (factions.length) return factions;
  if (pushedRoster && Date.now() - pushedRoster.at < PUSH_TTL) return pushedRoster.factions;
  return factions;
}

/** В счёте RCON всегда три фракции. В матче остаются те, у кого есть игроки или очки. */
export function playingFactions(factions: Array<{ name: string; score: number }>, players: RosterPlayer[]) {
  const counts = new Map<string, number>();
  for (const player of players) {
    const key = sideOf(player.faction);
    if (!PLAYABLE.includes(key as (typeof PLAYABLE)[number])) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const scored = new Map(factions.map((faction) => [sideOf(faction.name), faction]));
  const named = (key: string) => key === "lonestar" ? "Lonestar" : key === "valkyra" ? "Valkyra" : "Manticore";
  const present = PLAYABLE.flatMap((key) => {
    const count = counts.get(key) ?? 0;
    const row = scored.get(key);
    if (count <= 0 && !(row && row.score > 0)) return [];
    return [{ key, count, row: row ?? { name: named(key), score: 0 } }];
  });
  // Матч на две стороны. Третья с нулём очков и горсткой людей — не сторона настроек.
  const sides = present.length > 2
    ? present.filter((side) => side.row.score > 0 || side.count >= 8)
    : present;
  const chosen = sides.length >= 2 ? sides : [...present].sort((a, b) => b.count - a.count).slice(0, 2);
  return chosen.map((side) => side.row);
}

export function rememberLive(factions: Array<{ name: string; score: number }>, players: RosterPlayer[]) {
  pushedRoster = { at: Date.now(), factions, players };
  rememberRoster(players);
  noteKills(players);
  void refreshHours(players.map((player) => player.steamId));
  if (!config.rconHost || !config.rconPassword) void notePresence(players.map((player) => player.steamId));
}

function moscowDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function moscowSpan(count: number) {
  const days: string[] = [];
  const now = new Date();
  for (let ago = count - 1; ago >= 0; ago -= 1) days.push(moscowDay(new Date(now.getTime() - ago * 24 * 60 * 60 * 1000)));
  return days;
}

function dayKey(value: unknown) {
  if (value instanceof Date) {
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  return String(value ?? "").slice(0, 10);
}

/** Каждые 20 секунд дописываем время на сервере в московский день. Разрыв больше 90 секунд — одна новая отметка. */
export async function notePresence(steamIds: string[], kills = new Map<string, number>()) {
  const day = moscowDay();
  for (const steamId of steamIds) {
    if (!/^\d{17}$/.test(steamId)) continue;
    const gained = Math.max(0, Math.round(kills.get(steamId) ?? 0));
    await sql`
      INSERT INTO presence_days (steam_id, day, seconds, kills, last_seen)
      VALUES (${steamId}, ${day}, 20, ${gained}, now())
      ON DUPLICATE KEY UPDATE
        seconds = seconds + LEAST(90, GREATEST(1, TIMESTAMPDIFF(SECOND, last_seen, now()))),
        kills = kills + ${gained},
        last_seen = now()
    `;
  }
  await creditSeed(steamIds, steamIds.length);
}

export type DayCell = { place: number; minutes: number; kills: number };

/** Место в скваде за каждый из семи московских дней. Считается время на сервере, при равенстве — убийства. */
export async function squadActivity(steamIds: string[]) {
  const ids = [...new Set(steamIds.filter((id) => /^\d{17}$/.test(id)))];
  const days = moscowSpan(7);
  const labels = days.map((day) => {
    const [, month, date] = day.split("-");
    return `${date}.${month}`;
  });
  if (!ids.length) return { days: labels, rows: [] as Array<{ steamId: string; cells: Array<DayCell | null> }> };
  const marks = ids.map(() => "?").join(", ");
  const stored = await sql.unsafe<Array<{ steam_id: string; day: unknown; seconds: number; kills: number }>>(
    `SELECT steam_id, day, seconds, kills FROM presence_days WHERE day >= ? AND steam_id IN (${marks})`,
    [days[0], ...ids],
  );
  const byDay = new Map<string, Array<{ steamId: string; seconds: number; kills: number }>>();
  for (const row of stored) {
    const key = dayKey(row.day);
    const bucket = byDay.get(key) ?? [];
    bucket.push({ steamId: String(row.steam_id), seconds: Number(row.seconds) || 0, kills: Number(row.kills) || 0 });
    byDay.set(key, bucket);
  }
  const cells = new Map<string, Map<string, DayCell>>();
  for (const day of days) {
    const present = (byDay.get(day) ?? []).filter((row) => row.seconds > 0);
    present.sort((a, b) => b.seconds - a.seconds || b.kills - a.kills || a.steamId.localeCompare(b.steamId));
    present.forEach((row, index) => {
      const own = cells.get(row.steamId) ?? new Map<string, DayCell>();
      own.set(day, { place: index + 1, minutes: Math.max(1, Math.round(row.seconds / 60)), kills: row.kills });
      cells.set(row.steamId, own);
    });
  }
  const rows = ids.map((steamId) => ({
    steamId,
    cells: days.map((day) => cells.get(steamId)?.get(day) ?? null),
  }));
  rows.sort((a, b) => {
    const left = a.cells[a.cells.length - 1]?.place ?? 1000;
    const right = b.cells[b.cells.length - 1]?.place ?? 1000;
    return left - right || a.steamId.localeCompare(b.steamId);
  });
  return { days: labels, rows };
}

async function refreshHours(steamIds: string[]) {
  if (!steamIds.length) return;
  const found = await hoursOf(steamIds);
  for (const [steamId, hours] of found) knownHours.set(steamId, hours);
}

export async function fightSnapshot(factions: Array<{ name: string; score: number }>) {
  const kills10 = killsInTenMinutes();
  const roster = rosterNow();
  const teams = new Map<string, { name: string; score: number; players: RosterPlayer[]; hours: Array<number | null> }>();
  for (const faction of playingFactions(factionsNow(factions), roster)) {
    teams.set(sideOf(faction.name), { name: faction.name, score: faction.score, players: [], hours: [] });
  }
  for (const player of roster) {
    const key = sideOf(player.faction);
    const team = teams.get(key);
    if (!team) continue;
    team.players.push(player);
    team.hours.push(knownHours.get(player.steamId) ?? null);
    teams.set(key, team);
  }
  const order = ["lonestar", "valkyra", "manticore"];
  return {
    hot: kills10 >= HOT_KILLS,
    kills10,
    feed: recentKills(),
    teams: [...teams.entries()]
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([, team]) => {
        const known = team.hours.filter((value): value is number => value != null);
        const avgHours = known.length ? Math.round(known.reduce((sum, value) => sum + value, 0) / known.length) : null;
        return {
          name: team.name,
          score: team.score,
          avgHours,
          players: team.players
            .sort((a, b) => b.kills - a.kills || a.name.localeCompare(b.name))
            .map((player) => ({ name: player.name || player.steamId, steamId: player.steamId, kills: player.kills, deaths: player.deaths })),
        };
      }),
  };
}

/** Матч обнуляет счётчик. Пока он растёт — прибавляем разницу, после сброса — новые очки. */
export function applyMatchDelta(lifetime: number, previousMatch: number, now: number): { lifetime: number; match: number } {
  const safeNow = Number.isFinite(now) && now > 0 ? Math.floor(now) : 0;
  const add = safeNow >= previousMatch ? safeNow - previousMatch : safeNow;
  return { lifetime: lifetime + add, match: safeNow };
}

type RosterPlayer = { steamId: string; name: string; kills: number; deaths: number; faction: string };

async function roster(): Promise<RosterPlayer[]> {
  if (!config.rconHost || !config.rconPassword) return [];
  const response = await fetch(`http://${config.rconHost}:${config.rconPort}/v1/players`, {
    headers: {
      Authorization: `Bearer ${config.rconPassword}`,
      Accept: "application/json",
      "User-Agent": "FOB-site",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return [];
  const body = await response.json() as { players?: unknown };
  if (!Array.isArray(body.players)) return [];
  const rows: RosterPlayer[] = [];
  for (const item of body.players) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const steamId = String(row.steamId || row.steam_id || "").trim();
    if (!/^\d{17}$/.test(steamId)) continue;
    rows.push({
      steamId,
      name: String(row.name || "").trim().slice(0, 80),
      kills: Number(row.kills) || 0,
      deaths: Number(row.deaths) || 0,
      faction: String(row.faction || "").trim().slice(0, 40),
    });
  }
  return rows;
}

export async function ingestCombat(): Promise<number> {
  if (!config.rconHost || !config.rconPassword) return 0;
  const players = await roster();
  lastRoster = players;
  rememberRoster(players);
  noteKills(players);
  void refreshHours(players.map((player) => player.steamId));
  const gained = new Map<string, number>();
  for (const player of players) {
    const existing = await sql<Array<{ kills: number; deaths: number; match_kills: number; match_deaths: number; persona: string | null; avatar: string | null }>>`
      SELECT kills, deaths, match_kills, match_deaths, persona, avatar FROM server_combat WHERE steam_id = ${player.steamId}
    `;
    const prior = existing[0];
    if (prior && (player.kills < prior.match_kills || player.deaths < prior.match_deaths) && (prior.match_kills > 0 || prior.match_deaths > 0)) {
      await sql`
        INSERT INTO server_matches (steam_id, persona, kills, deaths, faction)
        VALUES (${player.steamId}, ${prior.persona}, ${prior.match_kills}, ${prior.match_deaths}, ${player.faction || null})
      `;
    }
    // Счёт за матч — только для границы матча. Жизнь берётся из киллфида, иначе опрос RCON её раздувает.
    const matchKills = Number.isFinite(player.kills) && player.kills > 0 ? Math.floor(player.kills) : 0;
    const matchDeaths = Number.isFinite(player.deaths) && player.deaths > 0 ? Math.floor(player.deaths) : 0;
    const kills = { lifetime: prior?.kills ?? 0, match: matchKills };
    const deaths = { lifetime: prior?.deaths ?? 0, match: matchDeaths };
    let persona = player.name || prior?.persona || null;
    let avatar = prior?.avatar ?? null;
    if (!avatar) {
      const profile = await steamProfile(player.steamId);
      if (profile.persona) persona = profile.persona;
      if (profile.avatar) avatar = profile.avatar;
    }
    await sql`
      INSERT INTO server_combat (steam_id, persona, avatar, kills, deaths, match_kills, match_deaths, faction, seen_at, first_seen)
      VALUES (${player.steamId}, ${persona}, ${avatar}, ${kills.lifetime}, ${deaths.lifetime}, ${kills.match}, ${deaths.match}, ${player.faction || null}, now(), now())
      ON DUPLICATE KEY UPDATE
        persona = COALESCE(VALUES(persona), persona),
        avatar = COALESCE(VALUES(avatar), avatar),
        kills = VALUES(kills),
        deaths = VALUES(deaths),
        match_kills = VALUES(match_kills),
        match_deaths = VALUES(match_deaths),
        faction = VALUES(faction),
        seen_at = now(),
        first_seen = COALESCE(first_seen, VALUES(first_seen))
    `;
    gained.set(player.steamId, applyMatchDelta(0, prior?.match_kills ?? 0, player.kills).lifetime);
  }
  await notePresence(players.map((player) => player.steamId), gained);
  await reconcileCombat(players.map((player) => player.steamId));
  return players.length;
}

/** Убийства и смерти на сервере — из событий киллфида, не из накопленного счётчика RCON. */
export async function reconcileCombat(steamIds?: string[]) {
  const limit = steamIds?.filter((id) => /^\d{17}$/.test(id));
  const where = limit?.length ? ` AND c.steam_id IN (${limit.map(() => "?").join(", ")})` : "";
  const params = limit ?? [];
  await sql.unsafe(
    `UPDATE server_combat c
     JOIN (
       SELECT killer_steam AS steam_id, COUNT(*) AS kills
       FROM server_kills
       WHERE suicide = 0 AND killer_steam <> ''
       GROUP BY killer_steam
     ) k ON k.steam_id = c.steam_id
     SET c.kills = k.kills
     WHERE k.kills > 0${where}`,
    params,
  );
  await sql.unsafe(
    `UPDATE server_combat c
     JOIN (
       SELECT victim_steam AS steam_id, COUNT(*) AS deaths
       FROM server_kills
       WHERE victim_steam <> ''
       GROUP BY victim_steam
     ) d ON d.steam_id = c.steam_id
     SET c.deaths = d.deaths
     WHERE d.deaths > 0${where}`,
    params,
  );
}
