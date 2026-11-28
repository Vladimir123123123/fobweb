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

/** eventTime из игры — секунды от старта матча, не unix. Якорим к wall-clock. */
const matchAnchors = new Map<string, number>();
let lastFeedAt = 0;

function wallTime(matchId: string, eventTime: unknown): Date | null {
  const absolute = when(eventTime);
  if (absolute) return absolute;
  const raw = typeof eventTime === "number" ? eventTime : Number(String(eventTime ?? "").trim());
  if (!matchId || !Number.isFinite(raw) || raw < 0 || raw > 200_000) return null;
  const now = Date.now();
  let anchor = matchAnchors.get(matchId);
  if (anchor == null) {
    anchor = now - raw * 1000;
    matchAnchors.set(matchId, anchor);
  }
  return sane(new Date(anchor + raw * 1000));
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
    if (!/win/i.test(key) || key === "randomWinner") continue;
    const side = sideFromValue(value);
    if (side) return side;
  }
  const scores = event.factionScores;
  if (Array.isArray(scores)) {
    const map = new Map<SideKey, number>();
    for (const item of scores) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const key = sideKeyOf(row.faction ?? row.name ?? row.team);
      const score = Math.round(Number(row.score));
      if (key && Number.isFinite(score) && score >= 0) map.set(key, score);
    }
    return leaderOf(map);
  }
  return "";
}

function sideFromValue(value: unknown): string {
  if (value && typeof value === "object") return cleanSide((value as Record<string, unknown>).name ?? (value as Record<string, unknown>).faction);
  return cleanSide(value);
}

async function rememberClock(matchId: string, mapName: string, serverName: string, state: string, at: Date | null) {
  const playing = /play/i.test(state) && !/wait|prematch|postmatch/i.test(state);
  const stamp = at ?? (playing ? new Date() : null);
  const rows = await sql<Array<{ started_at: unknown }>>`SELECT started_at FROM match_clock WHERE match_id = ${matchId}`;
  if (!rows.length) {
    await sql`
      INSERT INTO match_clock (match_id, map_name, server_name, state, started_at)
      VALUES (${matchId}, ${mapName}, ${serverName}, ${state}, ${playing ? stamp : null})
    `;
    return;
  }
  await sql`
    UPDATE match_clock
    SET map_name = IF(${mapName} = '', map_name, ${mapName}),
        server_name = IF(${serverName} = '', server_name, ${serverName}),
        state = ${state},
        started_at = IF(started_at IS NULL AND ${playing && stamp ? 1 : 0} = 1, ${stamp}, started_at)
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

type KillAgg = {
  steam_id: string;
  name: string;
  kills: number;
  deaths: number;
  headshots: number;
  teamkills: number;
  weapon: string;
};

async function closeMatch(event: FeedEvent, serverName: string, endedAt: Date | null) {
  const matchId = text(event.matchId, 80) || currentMatch;
  if (!matchId) return;
  let winner = declaredWinner(event) || scoreWinner();
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
  // Агрегация в SQL — иначе 10k+ киллов вешают закрытие матча.
  let killStats = await sql<KillAgg[]>`
    SELECT steam_id, name, kills, deaths, headshots, teamkills, weapon FROM (
      SELECT killer_steam AS steam_id,
             MAX(killer_name) AS name,
             SUM(suicide = 0) AS kills,
             0 AS deaths,
             SUM(suicide = 0 AND headshot = 1) AS headshots,
             SUM(suicide = 0 AND teamkill = 1) AS teamkills,
             SUBSTRING_INDEX(GROUP_CONCAT(IF(suicide = 0 AND weapon <> '', weapon, NULL) ORDER BY 1 DESC SEPARATOR ','), ',', 1) AS weapon
      FROM server_kills
      WHERE match_id = ${matchId} AND killer_steam REGEXP '^[0-9]{17}$'
      GROUP BY killer_steam
      UNION ALL
      SELECT victim_steam AS steam_id,
             MAX(victim_name) AS name,
             0 AS kills,
             COUNT(*) AS deaths,
             0 AS headshots,
             0 AS teamkills,
             '' AS weapon
      FROM server_kills
      WHERE match_id = ${matchId} AND victim_steam REGEXP '^[0-9]{17}$'
      GROUP BY victim_steam
    ) parts
  `;
  if (!killStats.length && started && endedAt) {
    killStats = await sql<KillAgg[]>`
      SELECT steam_id, name, kills, deaths, headshots, teamkills, weapon FROM (
        SELECT killer_steam AS steam_id,
               MAX(killer_name) AS name,
               SUM(suicide = 0) AS kills,
               0 AS deaths,
               SUM(suicide = 0 AND headshot = 1) AS headshots,
               SUM(suicide = 0 AND teamkill = 1) AS teamkills,
               SUBSTRING_INDEX(GROUP_CONCAT(IF(suicide = 0 AND weapon <> '', weapon, NULL) ORDER BY 1 DESC SEPARATOR ','), ',', 1) AS weapon
        FROM server_kills
        WHERE COALESCE(killed_at, received_at) BETWEEN ${started} AND ${endedAt}
          AND killer_steam REGEXP '^[0-9]{17}$'
        GROUP BY killer_steam
        UNION ALL
        SELECT victim_steam AS steam_id,
               MAX(victim_name) AS name,
               0 AS kills,
               COUNT(*) AS deaths,
               0 AS headshots,
               0 AS teamkills,
               '' AS weapon
        FROM server_kills
        WHERE COALESCE(killed_at, received_at) BETWEEN ${started} AND ${endedAt}
          AND victim_steam REGEXP '^[0-9]{17}$'
        GROUP BY victim_steam
      ) parts
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
  for (const row of killStats) {
    const person = ensure(row.steam_id, row.name);
    person.kills += Number(row.kills) || 0;
    person.deaths += Number(row.deaths) || 0;
    person.headshots += Number(row.headshots) || 0;
    person.teamkills += Number(row.teamkills) || 0;
    const weapon = String(row.weapon || "").trim();
    if (weapon) person.weapons.set(weapon, (person.weapons.get(weapon) || 0) + 1);
  }
  if (!winner) {
    const bySide = new Map<SideKey, number>();
    for (const person of people.values()) {
      const key = sideKeyOf(person.faction);
      if (!key || person.kills < 1) continue;
      bySide.set(key, (bySide.get(key) ?? 0) + person.kills);
    }
    winner = leaderOf(bySide);
  }
  // Presence копит ротацию. В историю — кто дрался; без боя только если не вышел и не опоздал.
  let ranked = [...people.values()]
    .filter((person) => {
      const fought = person.kills + person.deaths > 0;
      if (fought) return true;
      if (person.left || person.late) return false;
      return Boolean(person.faction);
    })
    .sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
  if (ranked.length > 120) ranked = ranked.filter((person) => person.kills + person.deaths > 0);
  if (ranked.length > 120) ranked = ranked.slice(0, 120);
  const field = ranked.length;
  if (!field) {
    matchAnchors.delete(matchId);
    return;
  }
  const from = endedAt ? new Date(endedAt.getTime() - 15 * 60 * 1000) : null;
  const to = endedAt ? new Date(endedAt.getTime() + 15 * 60 * 1000) : null;
  if (from && to) {
    const ids = ranked.map((person) => person.steamId);
    const marks = ids.map(() => "?").join(", ");
    await sql.unsafe(
      `DELETE FROM played_matches
       WHERE steam_id IN (${marks}) AND match_key LIKE 'legacy-%' AND result = ''
         AND ended_at BETWEEN ? AND ?`,
      [...ids, from, to],
    );
  }
  const values: unknown[] = [];
  const placeholders: string[] = [];
  ranked.forEach((person, index) => {
    let weapon = "";
    let best = 0;
    for (const [name, count] of person.weapons) {
      if (count > best) {
        weapon = name;
        best = count;
      }
    }
    const result = matchResult(person.faction, winner, false);
    placeholders.push("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    values.push(
      person.steamId,
      matchId,
      endedAt,
      server,
      map,
      minutes,
      person.faction,
      result,
      index + 1,
      field,
      person.kills,
      person.deaths,
      person.headshots,
      person.teamkills,
      weapon,
    );
  });
  await sql.unsafe(
    `INSERT INTO played_matches (
      steam_id, match_key, ended_at, server_name, map_name, minutes, faction, result,
      place, field_size, kills, deaths, headshots, teamkills, weapon
    ) VALUES ${placeholders.join(", ")}
    ON DUPLICATE KEY UPDATE
      ended_at = VALUES(ended_at),
      server_name = VALUES(server_name),
      map_name = VALUES(map_name),
      minutes = VALUES(minutes),
      faction = IF(VALUES(faction) = '', faction, VALUES(faction)),
      result = IF(VALUES(result) = '', result, VALUES(result)),
      place = VALUES(place),
      field_size = VALUES(field_size),
      kills = VALUES(kills),
      deaths = VALUES(deaths),
      headshots = VALUES(headshots),
      teamkills = VALUES(teamkills),
      weapon = VALUES(weapon)`,
    values,
  );
  matchAnchors.delete(matchId);
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

function markFinished(matchId: string) {
  if (!matchId) return;
  if (!finished.includes(matchId)) finished.push(matchId);
  while (finished.length > 40) finished.shift();
  if (currentMatch === matchId) currentMatch = "";
  matchAnchors.delete(matchId);
  forgetScores();
}

async function closeAndMark(event: FeedEvent, serverName: string, endedAt: Date | null) {
  const matchId = text(event.matchId, 80) || currentMatch;
  if (!matchId || finished.includes(matchId)) return;
  await closeMatch({ ...event, matchId }, serverName, endedAt ?? new Date());
  markFinished(matchId);
}

/** Состояние матча, вход, выход и итог. Убийства к этому моменту уже лежат в server_kills. */
export async function absorbFeed(body: unknown) {
  if (!body || typeof body !== "object") return;
  const batch = body as { serverName?: unknown; events?: unknown };
  const serverName = text(batch.serverName, 80);
  const events = Array.isArray(batch.events) ? batch.events : [];
  lastFeedAt = Date.now();
  for (const item of events) {
    if (!item || typeof item !== "object") continue;
    const event = item as FeedEvent;
    const matchId = text(event.matchId, 80);
    const at = wallTime(matchId, event.eventTime) ?? when(event.eventTime);
    await keepSample(event).catch(() => undefined);
    // Смена matchId без match_ended — закрываем предыдущий, иначе presence раздувается до сотен.
    if (
      matchId
      && currentMatch
      && matchId !== currentMatch
      && event.type !== "match_ended"
      && !finished.includes(currentMatch)
    ) {
      await closeAndMark({ matchId: currentMatch, type: "match_ended" }, serverName, at ?? new Date());
    }
    if (matchId && event.type !== "match_ended" && !finished.includes(matchId)) currentMatch = matchId;
    if (event.type === "match_state" && matchId) {
      await rememberClock(matchId, mapLabel(text(event.mapName, 80)), serverName, text(event.state, 40), at);
    } else if ((event.type === "player_joined" || event.type === "player_left") && matchId) {
      const steamId = steam(event.playerSteamId);
      if (!steamId) continue;
      await touchPresence(matchId, steamId, text(event.playerName, 80), at, event.type === "player_left");
    } else if (event.type === "match_ended") {
      await closeAndMark(event, serverName, at ?? new Date());
    }
  }
}

/** Ручное/догоняющее закрытие одного матча (бэкфилл). */
export async function forceCloseMatch(matchId: string, endedAt: Date | null = null) {
  const id = text(matchId, 80);
  if (!id) return false;
  // Разрешаем перезапись пустых результатов.
  const idx = finished.indexOf(id);
  if (idx >= 0) finished.splice(idx, 1);
  // Старые «склеенные» строки (500+) сносим перед пересчётом.
  await sql`DELETE FROM played_matches WHERE match_key = ${id}`;
  await closeMatch({ matchId: id, type: "match_ended" }, "", endedAt ?? new Date());
  markFinished(id);
  return true;
}

/** Догоняем матчи, у которых есть киллы, но нет нормальной записи в played_matches. */
export async function reconcileOpenMatches() {
  const staleMs = 25 * 60 * 1000;
  if (currentMatch && lastFeedAt > 0 && Date.now() - lastFeedAt > staleMs && !finished.includes(currentMatch)) {
    await closeAndMark({ matchId: currentMatch, type: "match_ended" }, "", new Date());
  }
  const rows = await sql<Array<{ match_id: string; last_at: Date | null }>>`
    SELECT k.match_id AS match_id, MAX(COALESCE(k.killed_at, k.received_at)) AS last_at
    FROM server_kills k
    WHERE k.match_id <> ''
      AND COALESCE(k.killed_at, k.received_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 3 DAY)
    GROUP BY k.match_id
    HAVING COUNT(*) >= 20
  `;
  let closed = 0;
  for (const row of rows) {
    const matchId = text(row.match_id, 80);
    if (!matchId || finished.includes(matchId) || matchId === currentMatch) continue;
    const done = await sql<Array<{ n: number }>>`
      SELECT COUNT(*) AS n FROM played_matches
      WHERE match_key = ${matchId} AND result IN ('win', 'loss')
    `;
    if (Number(done[0]?.n || 0) > 0) continue;
    const lastAt = when(row.last_at) ?? new Date();
    // Не трогаем совсем свежий матч — ещё может идти.
    if (Date.now() - lastAt.getTime() < staleMs) continue;
    await closeAndMark({ matchId, type: "match_ended" }, "", lastAt);
    closed += 1;
    if (closed >= 8) break;
  }
  return closed;
}
