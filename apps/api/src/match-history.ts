import { sql } from "./db.js";
import { knownPlayer } from "./roster-cache.js";
import { cleanSide, sideKeyOf, type SideKey } from "./sides.js";

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

/** Победа или поражение. Сторона сравнивается по ключу, «White» и пустое результата не дают. */
export function matchResult(faction: string, winner: string, left: boolean) {
  if (left) return "leave";
  const mine = sideKeyOf(faction);
  const won = sideKeyOf(winner);
  if (!mine || !won) return "";
  return mine === won ? "win" : "loss";
}

// ───── Очки сторон: запасной способ узнать победителя, если игра не назвала его ─────
const peaks = new Map<SideKey, number>();
const previousPeaks = new Map<SideKey, number>();
let peaksReset = 0;

function total(map: Map<SideKey, number>) {
  let sum = 0;
  for (const value of map.values()) sum += value;
  return sum;
}

/** Вызывается при каждом опросе сервера. Хранит максимум очков каждой стороны за матч. */
export function noteScores(factions: Array<{ name: string; score: number }>) {
  const next = new Map<SideKey, number>();
  for (const faction of factions) {
    const key = sideKeyOf(faction.name);
    const score = Math.round(Number(faction.score));
    if (key && Number.isFinite(score) && score >= 0) next.set(key, Math.max(next.get(key) ?? 0, score));
  }
  if (!next.size) return;
  // Очки упали — матч обнулился. Прежние максимумы ещё нужны событию окончания, оно может прийти позже.
  if (total(peaks) > 0 && total(next) + 10 < total(peaks)) {
    previousPeaks.clear();
    for (const [key, value] of peaks) previousPeaks.set(key, value);
    peaks.clear();
    peaksReset = Date.now();
  }
  for (const [key, score] of next) peaks.set(key, Math.max(peaks.get(key) ?? 0, score));
}

function leaderOf(map: Map<SideKey, number>) {
  const ranked = [...map.entries()].sort((a, b) => b[1] - a[1]);
  if (!ranked.length || ranked[0][1] <= 0) return "";
  if (ranked[1] && ranked[1][1] === ranked[0][1]) return "";
  return cleanSide(ranked[0][0]);
}

function scoreWinner() {
  const recentReset = peaksReset > 0 && Date.now() - peaksReset < 3 * 60 * 1000 && previousPeaks.size > 0;
  return leaderOf(recentReset ? previousPeaks : peaks);
}

function forgetScores() {
  peaks.clear();
  previousPeaks.clear();
  peaksReset = 0;
}

/** Победитель из самого события: имя поля в игре может отличаться, ищем любое с «win». */
function declaredWinner(event: FeedEvent) {
  for (const key of ["winningFaction", "winnerFaction", "winningTeam", "winner"]) {
    const side = sideFromValue(event[key]);
    if (side) return side;
  }
  for (const [key, value] of Object.entries(event)) {
    if (!/win/i.test(key)) continue;
    const side = sideFromValue(value);
    if (side) return side;
  }
  return "";
}

function sideFromValue(value: unknown): string {
  if (value && typeof value === "object") return cleanSide((value as Record<string, unknown>).name ?? (value as Record<string, unknown>).faction);
  return cleanSide(value);
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
  const faction = cleanSide(known?.faction);
  const label = name || known?.name || "";
  const seen = at ?? new Date();
  if (left) {
    await sql`
      INSERT INTO match_presence (match_id, steam_id, name, faction, left_at, first_seen)
      VALUES (${matchId}, ${steamId}, ${label}, ${faction}, ${at}, ${seen})
      ON DUPLICATE KEY UPDATE
        name = IF(VALUES(name) = '', name, VALUES(name)),
        faction = IF(VALUES(faction) = '', faction, VALUES(faction)),
        left_at = VALUES(left_at),
        first_seen = COALESCE(first_seen, VALUES(first_seen))
    `;
    return;
  }
  await sql`
    INSERT INTO match_presence (match_id, steam_id, name, faction, left_at, first_seen)
    VALUES (${matchId}, ${steamId}, ${label}, ${faction}, NULL, ${seen})
    ON DUPLICATE KEY UPDATE
      name = IF(VALUES(name) = '', name, VALUES(name)),
      faction = IF(VALUES(faction) = '', faction, VALUES(faction)),
      left_at = NULL,
      first_seen = COALESCE(first_seen, VALUES(first_seen))
  `;
}

// ───── Кто сейчас в матче: список игроков с сервера, а не только события входа ─────
let currentMatch = "";
const finished: string[] = [];
const tracked = new Map<string, string>();

/** Каждый опрос ростера записывает, кто в каком матче и за какую сторону играет. */
export async function trackRoster(players: Array<{ steamId: string; name?: string; faction?: string }>) {
  if (!currentMatch) return;
  const matchId = currentMatch;
  if (tracked.size > 5000) tracked.clear();
  for (const player of players) {
    const steamId = steam(player.steamId);
    const faction = cleanSide(player.faction);
    if (!steamId || !faction) continue;
    const key = `${matchId}|${steamId}`;
    if (tracked.get(key) === faction) continue;
    tracked.set(key, faction);
    const label = text(player.name, 80);
    const now = new Date();
    await sql`
      INSERT INTO match_presence (match_id, steam_id, name, faction, left_at, first_seen)
      VALUES (${matchId}, ${steamId}, ${label}, ${faction}, NULL, ${now})
      ON DUPLICATE KEY UPDATE
        name = IF(VALUES(name) = '', name, VALUES(name)),
        faction = VALUES(faction),
        first_seen = COALESCE(first_seen, VALUES(first_seen))
    `;
  }
}

type Person = {
  steamId: string;
  name: string;
  faction: string;
  left: boolean;
  late: boolean;
  kills: number;
  deaths: number;
  headshots: number;
  teamkills: number;
  weapons: Map<string, number>;
};

type KillRow = {
  killer_steam: string; killer_name: string; victim_steam: string; victim_name: string;
  weapon: string; headshot: number; teamkill: number; suicide: number;
};

async function closeMatch(event: FeedEvent, serverName: string, endedAt: Date | null) {
  const matchId = text(event.matchId, 80) || currentMatch;
  if (!matchId) return;
  const winner = declaredWinner(event) || scoreWinner();
  const mapName = mapLabel(text(event.mapName, 80));
  const clock = await sql<Array<{ map_name: string; server_name: string; started_at: unknown }>>`
    SELECT map_name, server_name, started_at FROM match_clock WHERE match_id = ${matchId}
  `;
  const started = when(clock[0]?.started_at);
  const minutes = started && endedAt ? Math.max(1, Math.round((endedAt.getTime() - started.getTime()) / 60000)) : null;
  const server = text(serverName, 80) || clock[0]?.server_name || "";
  const map = mapName || clock[0]?.map_name || "";
  const present = await sql<Array<{ steam_id: string; name: string; faction: string; left_at: unknown; first_seen: unknown }>>`
    SELECT steam_id, name, faction, left_at, first_seen FROM match_presence WHERE match_id = ${matchId}
  `;
  let kills = await sql<KillRow[]>`
    SELECT killer_steam, killer_name, victim_steam, victim_name, weapon, headshot, teamkill, suicide
    FROM server_kills WHERE match_id = ${matchId}
  `;
  // Игра могла прислать убийства без номера матча: тогда берём их по времени матча.
  if (!kills.length && started && endedAt) {
    kills = await sql<KillRow[]>`
      SELECT killer_steam, killer_name, victim_steam, victim_name, weapon, headshot, teamkill, suicide
      FROM server_kills
      WHERE COALESCE(killed_at, received_at) BETWEEN ${started} AND ${endedAt}
    `;
  }
  const people = new Map<string, Person>();
  const lateAfter = started ? new Date(started.getTime() + 2 * 60 * 1000) : null;
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
      faction: cleanSide(known?.faction),
      left: false,
      late: false,
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
    const side = cleanSide(row.faction);
    if (side) person.faction = side;
    person.left = Boolean(row.left_at);
    const seen = when(row.first_seen);
    if (lateAfter && seen && seen.getTime() > lateAfter.getTime()) person.late = true;
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
  // В таблицу и винрейт — кто доиграл от старта (не вышел и не зашёл поздно).
  const ranked = [...people.values()]
    .filter((person) => !person.left && !person.late)
    .sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
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
    const result = crowd ? "" : matchResult(person.faction, winner, false);
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

const sampled = new Map<string, number>();

/** Последний образец каждого типа события, чтобы видеть, что именно шлёт игра. */
async function keepSample(event: FeedEvent) {
  const kind = text(event.type, 40) || "unknown";
  const now = Date.now();
  const gap = kind === "match_ended" ? 0 : kind === "killed" ? 10 * 60 * 1000 : 60 * 1000;
  if (now - (sampled.get(kind) ?? 0) < gap) return;
  sampled.set(kind, now);
  const body = JSON.stringify(event).slice(0, 4000);
  await sql`
    INSERT INTO feed_samples (kind, body, seen_at) VALUES (${kind}, ${body}, ${new Date()})
    ON DUPLICATE KEY UPDATE body = VALUES(body), seen_at = VALUES(seen_at)
  `;
}

export async function feedSamples() {
  return sql<Array<{ kind: string; body: string; seen_at: unknown }>>`SELECT kind, body, seen_at FROM feed_samples ORDER BY kind`;
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
    await keepSample(event).catch(() => undefined);
    if (matchId && event.type !== "match_ended" && !finished.includes(matchId)) currentMatch = matchId;
    if (event.type === "match_state" && matchId) {
      await rememberClock(matchId, mapLabel(text(event.mapName, 80)), serverName, text(event.state, 40), at);
    } else if ((event.type === "player_joined" || event.type === "player_left") && matchId) {
      const steamId = steam(event.playerSteamId);
      if (!steamId) continue;
      await touchPresence(matchId, steamId, text(event.playerName, 80), at, event.type === "player_left");
    } else if (event.type === "match_ended") {
      // В событии может не быть времени: тогда конец матча — момент, когда оно дошло до сайта.
      await closeMatch(event, serverName, at ?? new Date());
      const endedId = matchId || currentMatch;
      if (endedId) {
        finished.push(endedId);
        while (finished.length > 20) finished.shift();
      }
      if (!matchId || currentMatch === matchId) currentMatch = "";
      forgetScores();
    }
  }
}
