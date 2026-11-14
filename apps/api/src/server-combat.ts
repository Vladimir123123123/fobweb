import { config } from "./config.js";
import { sql } from "./db.js";

/** Матч обнуляет счётчик. Пока он растёт — прибавляем разницу, после сброса — новые очки. */
export function applyMatchDelta(lifetime: number, previousMatch: number, now: number): { lifetime: number; match: number } {
  const safeNow = Number.isFinite(now) && now > 0 ? Math.floor(now) : 0;
  const add = safeNow >= previousMatch ? safeNow - previousMatch : safeNow;
  return { lifetime: lifetime + add, match: safeNow };
}

type RosterPlayer = { steamId: string; kills: number; deaths: number; faction: string };

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
      kills: Number(row.kills) || 0,
      deaths: Number(row.deaths) || 0,
      faction: String(row.faction || "").trim().slice(0, 40),
    });
  }
  return rows;
}

export async function ingestCombat(): Promise<number> {
  const players = await roster();
  for (const player of players) {
    const existing = await sql<Array<{ kills: number; deaths: number; match_kills: number; match_deaths: number }>>`
      SELECT kills, deaths, match_kills, match_deaths FROM server_combat WHERE steam_id = ${player.steamId}
    `;
    const prior = existing[0];
    const kills = applyMatchDelta(prior?.kills ?? 0, prior?.match_kills ?? 0, player.kills);
    const deaths = applyMatchDelta(prior?.deaths ?? 0, prior?.match_deaths ?? 0, player.deaths);
    await sql`
      INSERT INTO server_combat (steam_id, kills, deaths, match_kills, match_deaths, faction, seen_at)
      VALUES (${player.steamId}, ${kills.lifetime}, ${deaths.lifetime}, ${kills.match}, ${deaths.match}, ${player.faction || null}, now())
      ON DUPLICATE KEY UPDATE
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
