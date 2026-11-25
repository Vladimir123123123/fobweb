import { sql } from "./db.js";
import { knownPlayer } from "./roster-cache.js";

type FeedEvent = Record<string, unknown>;

function text(value: unknown, limit: number) {
  return String(value || "").trim().slice(0, limit);
}

function steam(value: unknown) {
  const id = text(value, 20);
  return /^\d{17}$/.test(id) ? id : "";
}

export function when(value: unknown) {
  if (value instanceof Date) return sane(value);
  if (typeof value === "number") return fromUnix(value);
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (/^\d+(\.\d+)?$/.test(text)) return fromUnix(Number(text));
  return sane(new Date(text));
}

function fromUnix(value: number) {
  if (!Number.isFinite(value) || value < 1_000_000_000) return null;
  return sane(new Date(value > 10_000_000_000 ? value : value * 1000));
}

function sane(date: Date) {
  const time = date.getTime();
  if (Number.isNaN(time)) return null;
  const year = date.getUTCFullYear();
  if (year < 2024 || year > 2035) return null;
  return date;
}

export function mapLabel(raw: string) {
  const head = raw.trim().split(/[_\s]/)[0] || "";
  return head.slice(0, 80);
}

export function matchResult(faction: string, winner: string, left: boolean) {
  if (left) return "leave";
  if (!faction || !winner) return "";
  return faction.toLowerCase() === winner.toLowerCase() ? "win" : "loss";
}

async function rememberClock(matchId: string, mapName: string, serverName: string, state: string, at: Date | null) {
  const playing = /play/i.test(state) && !/wait/i.test(state);
  const rows = await sql<Array<{ started_at: unknown }>>`SELECT started_at FROM match_clock WHERE match_id = ${matchId}`;
  if (!rows.length) {
    await sql`
      INSERT INTO match_clock (match_id, map_name, server_name, state, started_at)
      VALUES (${matchId}, ${mapName}, ${serverName}, ${state}, ${playing ? at : null})
    `;
    return;
  }
  await sql`
    UPDATE match_clock
    SET map_name = IF(${mapName} = '', map_name, ${mapName}),
        server_name = IF(${serverName} = '', server_name, ${serverName}),
        state = ${state},
        started_at = IF(started_at IS NULL AND ${playing ? 1 : 0} = 1, ${at}, started_at)
    WHERE match_id = ${matchId}
  `;
}

async function touchPresence(matchId: string, steamId: string, name: string, at: Date | null, left: boolean) {
  const known = knownPlayer(steamId);
  const faction = known?.faction || "";
  const label = name || known?.name || "";
  if (left) {
    await sql`
      INSERT INTO match_presence (match_id, steam_id, name, faction, left_at)
      VALUES (${matchId}, ${steamId}, ${label}, ${faction}, ${at})
      ON DUPLICATE KEY UPDATE
        name = IF(VALUES(name) = '', name, VALUES(name)),
        faction = IF(VALUES(faction) = '', faction, VALUES(faction)),
        left_at = VALUES(left_at)
    `;
    return;
  }
  await sql`
    INSERT INTO match_presence (match_id, steam_id, name, faction, left_at)
    VALUES (${matchId}, ${steamId}, ${label}, ${faction}, NULL)
    ON DUPLICATE KEY UPDATE
      name = IF(VALUES(name) = '', name, VALUES(name)),
      faction = IF(VALUES(faction) = '', faction, VALUES(faction)),
      left_at = NULL
  `;
}

type Person = {
  steamId: string;
  name: string;
  faction: string;
  left: boolean;
  kills: number;
  deaths: number;
  headshots: number;
  teamkills: number;
  weapons: Map<string, number>;
};

async function closeMatch(event: FeedEvent, serverName: string, endedAt: Date | null) {
  const matchId = text(event.matchId, 80);
  if (!matchId) return;
  const winner = text(event.winningFaction, 40);
  const mapName = mapLabel(text(event.mapName, 80));
  const clock = await sql<Array<{ map_name: string; server_name: string; started_at: unknown }>>`
    SELECT map_name, server_name, started_at FROM match_clock WHERE match_id = ${matchId}
  `;
  const started = when(clock[0]?.started_at);
  const minutes = started && endedAt ? Math.max(1, Math.round((endedAt.getTime() - started.getTime()) / 60000)) : null;
  const server = text(serverName, 80) || clock[0]?.server_name || "";
  const map = mapName || clock[0]?.map_name || "";
  const present = await sql<Array<{ steam_id: string; name: string; faction: string; left_at: unknown }>>`
    SELECT steam_id, name, faction, left_at FROM match_presence WHERE match_id = ${matchId}
  `;
  const kills = await sql<Array<{
    killer_steam: string; killer_name: string; victim_steam: string; victim_name: string;
    weapon: string; headshot: number; teamkill: number; suicide: number;
  }>>`
    SELECT killer_steam, killer_name, victim_steam, victim_name, weapon, headshot, teamkill, suicide
    FROM server_kills WHERE match_id = ${matchId}
  `;
  const people = new Map<string, Person>();
  const ensure = (steamId: string, name: string) => {
    const current = people.get(steamId);
    if (current) {
      if (!current.name && name) current.name = name;
      return current;
    }
    const known = knownPlayer(steamId);
    const row: Person = {
      steamId,
      name: name || known?.name || "",
      faction: known?.faction || "",
      left: false,
      kills: 0,
      deaths: 0,
      headshots: 0,
      teamkills: 0,
      weapons: new Map(),
    };
    people.set(steamId, row);
    return row;
  };
  for (const row of present) {
    const person = ensure(row.steam_id, row.name);
    if (row.faction) person.faction = row.faction;
    person.left = Boolean(row.left_at);
  }
  for (const row of kills) {
    if (row.killer_steam && !row.suicide) {
      const killer = ensure(row.killer_steam, row.killer_name);
      killer.kills += 1;
      if (row.headshot) killer.headshots += 1;
      if (row.teamkill) killer.teamkills += 1;
      if (row.weapon) killer.weapons.set(row.weapon, (killer.weapons.get(row.weapon) || 0) + 1);
    }
    if (row.victim_steam) ensure(row.victim_steam, row.victim_name).deaths += 1;
  }
  const ranked = [...people.values()].sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
  const field = ranked.length;
  for (const [index, person] of ranked.entries()) {
    let weapon = "";
    let best = 0;
    for (const [name, count] of person.weapons) {
      if (count > best) {
        weapon = name;
        best = count;
      }
    }
    const crowd = field > 100;
    const result = crowd ? "" : matchResult(person.faction, winner, person.left);
    const from = endedAt ? new Date(endedAt.getTime() - 15 * 60 * 1000) : null;
    const to = endedAt ? new Date(endedAt.getTime() + 15 * 60 * 1000) : null;
    if (from && to) {
      await sql`
        DELETE FROM played_matches
        WHERE steam_id = ${person.steamId} AND match_key LIKE 'legacy-%' AND result = ''
          AND ended_at BETWEEN ${from} AND ${to}
      `;
    }
    await sql`
      INSERT INTO played_matches (
        steam_id, match_key, ended_at, server_name, map_name, minutes, faction, result,
        place, field_size, kills, deaths, headshots, teamkills, weapon
      ) VALUES (
        ${person.steamId}, ${matchId}, ${endedAt}, ${server}, ${map}, ${minutes}, ${person.faction}, ${result},
        ${index + 1}, ${field}, ${person.kills}, ${person.deaths}, ${person.headshots}, ${person.teamkills}, ${weapon}
      )
      ON DUPLICATE KEY UPDATE
        ended_at = VALUES(ended_at),
        server_name = VALUES(server_name),
        map_name = VALUES(map_name),
        minutes = VALUES(minutes),
        faction = VALUES(faction),
        result = VALUES(result),
        place = VALUES(place),
        field_size = VALUES(field_size),
        kills = VALUES(kills),
        deaths = VALUES(deaths),
        headshots = VALUES(headshots),
        teamkills = VALUES(teamkills),
        weapon = VALUES(weapon)
    `;
  }
}

/** Состояние матча, вход, выход и итог. Убийства к этому моменту уже лежат в server_kills. */
export async function absorbFeed(body: unknown) {
  if (!body || typeof body !== "object") return;
  const batch = body as { serverName?: unknown; events?: unknown };
  const serverName = text(batch.serverName, 80);
  const events = Array.isArray(batch.events) ? batch.events : [];
  for (const item of events) {
    if (!item || typeof item !== "object") continue;
    const event = item as FeedEvent;
    const matchId = text(event.matchId, 80);
    const at = when(event.eventTime);
    if (event.type === "match_state" && matchId) {
      await rememberClock(matchId, mapLabel(text(event.mapName, 80)), serverName, text(event.state, 40), at);
    } else if ((event.type === "player_joined" || event.type === "player_left") && matchId) {
      const steamId = steam(event.playerSteamId);
      if (!steamId) continue;
      await touchPresence(matchId, steamId, text(event.playerName, 80), at, event.type === "player_left");
    } else if (event.type === "match_ended") {
      await closeMatch(event, serverName, at);
    }
  }
}
