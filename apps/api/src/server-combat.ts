import { config } from "./config.js";
import { sql } from "./db.js";
import { steamProfile, wardogsHours } from "./steam.js";

const HOT_KILLS = 15;
const TEN_MINUTES = 10 * 60 * 1000;
const killTicks: Array<{ at: number; kills: number }> = [];
const matchKills = new Map<string, number>();
let lastRoster: RosterPlayer[] = [];

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
    if (previous !== undefined) gained += player.kills >= previous ? player.kills - previous : player.kills;
    matchKills.set(player.steamId, player.kills);
  }
  for (const steamId of matchKills.keys()) {
    if (!seen.has(steamId)) matchKills.delete(steamId);
  }
  const now = Date.now();
  if (gained > 0) killTicks.push({ at: now, kills: gained });
  const cutoff = now - TEN_MINUTES;
  while (killTicks.length && killTicks[0].at < cutoff) killTicks.shift();
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

export async function fightSnapshot(factions: Array<{ name: string; score: number }>) {
  const kills10 = killsInTenMinutes();
  const teams = new Map<string, { name: string; score: number; players: RosterPlayer[]; hours: Array<number | null> }>();
  const seed = factions.length ? factions : [
    { name: "Lonestar", score: 0 },
    { name: "Valkyra", score: 0 },
    { name: "Manticore", score: 0 },
  ];
  for (const faction of seed) {
    teams.set(sideOf(faction.name), { name: faction.name, score: faction.score, players: [], hours: [] });
  }
  const hours = lastRoster.length ? await hoursOf(lastRoster.map((player) => player.steamId)) : new Map<string, number | null>();
  for (const player of lastRoster) {
    const key = sideOf(player.faction);
    const team = teams.get(key) ?? { name: player.faction || "Без стороны", score: 0, players: [], hours: [] };
    team.players.push(player);
    team.hours.push(hours.get(player.steamId) ?? null);
    teams.set(key, team);
  }
  const order = ["lonestar", "valkyra", "manticore"];
  return {
    hot: kills10 >= HOT_KILLS,
    kills10,
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
  const players = await roster();
  lastRoster = players;
  noteKills(players);
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
    const kills = applyMatchDelta(prior?.kills ?? 0, prior?.match_kills ?? 0, player.kills);
    const deaths = applyMatchDelta(prior?.deaths ?? 0, prior?.match_deaths ?? 0, player.deaths);
    let persona = player.name || prior?.persona || null;
    let avatar = prior?.avatar ?? null;
    if (!avatar) {
      const profile = await steamProfile(player.steamId);
      if (profile.persona) persona = profile.persona;
      if (profile.avatar) avatar = profile.avatar;
    }
    await sql`
      INSERT INTO server_combat (steam_id, persona, avatar, kills, deaths, match_kills, match_deaths, faction, seen_at)
      VALUES (${player.steamId}, ${persona}, ${avatar}, ${kills.lifetime}, ${deaths.lifetime}, ${kills.match}, ${deaths.match}, ${player.faction || null}, now())
      ON DUPLICATE KEY UPDATE
        persona = COALESCE(VALUES(persona), persona),
        avatar = COALESCE(VALUES(avatar), avatar),
        kills = VALUES(kills),
        deaths = VALUES(deaths),
        match_kills = VALUES(match_kills),
        match_deaths = VALUES(match_deaths),
        faction = VALUES(faction),
        seen_at = now()
    `;
  }
  return players.length;
}
