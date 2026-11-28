import { sql } from "./db.js";
import { config } from "./config.js";

const CLASS_ORDER = ["assault", "medic", "recon", "support", "driver", "pilot"] as const;
const CLASS_TITLE: Record<(typeof CLASS_ORDER)[number], string> = {
  assault: "Штурмовик",
  medic: "Медик",
  recon: "Разведчик",
  support: "Поддержка",
  driver: "Водитель",
  pilot: "Пилот",
};

type ClassKey = (typeof CLASS_ORDER)[number];

export function moscowWeek(now = new Date(), shiftWeeks = -1) {
  const moscow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const day = moscow.getUTCDay();
  const monday = new Date(Date.UTC(moscow.getUTCFullYear(), moscow.getUTCMonth(), moscow.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((day + 6) % 7) + shiftWeeks * 7);
  const next = new Date(monday);
  next.setUTCDate(next.getUTCDate() + 7);
  const start = new Date(monday.getTime() - 3 * 60 * 60 * 1000);
  const end = new Date(next.getTime() - 3 * 60 * 60 * 1000);
  const iso = isoWeek(monday);
  const dayKey = (date: Date) => date.toISOString().slice(0, 10);
  return {
    start,
    end,
    startDay: dayKey(monday),
    endDay: dayKey(next),
    week: `${iso.year}-W${String(iso.week).padStart(2, "0")}`,
    from: stamp(monday),
    to: stamp(new Date(next.getTime() - 24 * 60 * 60 * 1000)),
    closed: shiftWeeks < 0,
  };
}

export function previousMoscowWeek(now = new Date()) {
  return moscowWeek(now, -1);
}

function stamp(date: Date) {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getUTCFullYear()}`;
}

function isoWeek(date: Date) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  copy.setUTCDate(copy.getUTCDate() + 4 - (copy.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((copy.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: copy.getUTCFullYear(), week };
}

function kdOf(kills: number, deaths: number) {
  if (deaths < 1) return null;
  return Math.round((kills / deaths) * 100) / 100;
}

function primary(row: Record<string, unknown> | undefined): { key: ClassKey; level: number } | null {
  if (!row) return null;
  let best: ClassKey | null = null;
  let peak = 0;
  for (const key of CLASS_ORDER) {
    const value = Number(row[`role_${key}`] ?? 0);
    if (!Number.isFinite(value) || value <= peak) continue;
    peak = value;
    best = key;
  }
  return best && peak > 0 ? { key: best, level: peak } : null;
}

type Fighter = {
  steamId: string;
  name: string;
  kills: number;
  deaths: number;
  headshots: number;
  minutes: number;
  matches: number;
};

/** Игровой ник часто с [TAG] — снимаем, тег сквада подставим только с сайта. */
function stripGameTag(name: string) {
  const clean = name.replace(/^\s*\[[^\]]{1,12}\]\s*/u, "").trim();
  return clean || name.trim();
}

async function approvedSquadTags(ids: string[]) {
  const tags = new Map<string, string>();
  if (!ids.length) return tags;
  const marks = ids.map(() => "?").join(", ");
  const rows = await sql.unsafe<Array<{ steam_id: string; tag: string }>>(
    `SELECT m.steam_id, sq.tag
     FROM squad_members m
     JOIN squads sq ON sq.id = m.squad_id
     WHERE m.status = 'member' AND sq.status = 'approved'
       AND m.steam_id IN (${marks})
     ORDER BY m.role = 'leader' DESC, sq.id ASC`,
    ids,
  );
  for (const row of rows) {
    const steam = String(row.steam_id);
    if (tags.has(steam)) continue;
    const tag = String(row.tag || "").trim().toUpperCase();
    if (tag) tags.set(steam, tag.slice(0, 8));
  }
  return tags;
}

function labeledName(raw: string, tag: string | undefined) {
  const base = stripGameTag(raw).slice(0, 64);
  return tag ? `[${tag}] ${base}`.slice(0, 80) : base;
}

/** Время килла: у части событий killed_at битый/пустой — берём received_at (как в квестах). */
const KILL_AT = "COALESCE(IF(killed_at >= '2024-01-01' AND killed_at < '2036-01-01', killed_at, NULL), received_at)";

async function fromFeed(span: ReturnType<typeof moscowWeek>): Promise<Fighter[]> {
  const kills = await sql.unsafe<Array<{ steam_id: string; name: string | null; kills: number; headshots: number }>>(
    `SELECT k.killer_steam AS steam_id,
            COALESCE(MAX(u.persona), MAX(k.killer_name)) AS name,
            SUM(k.suicide = 0 AND k.teamkill = 0) AS kills,
            SUM(k.suicide = 0 AND k.teamkill = 0 AND k.headshot = 1) AS headshots
     FROM server_kills k
     LEFT JOIN users u ON u.steam_id = k.killer_steam
     WHERE ${KILL_AT} >= ? AND ${KILL_AT} < ?
       AND k.killer_steam REGEXP '^[0-9]{17}$'
     GROUP BY k.killer_steam`,
    [span.start, span.end],
  );
  const deaths = await sql.unsafe<Array<{ steam_id: string; deaths: number }>>(
    `SELECT victim_steam AS steam_id, COUNT(*) AS deaths
     FROM server_kills
     WHERE ${KILL_AT} >= ? AND ${KILL_AT} < ?
       AND suicide = 0 AND teamkill = 0
       AND victim_steam REGEXP '^[0-9]{17}$'
     GROUP BY victim_steam`,
    [span.start, span.end],
  );
  const died = new Map(deaths.map((row) => [String(row.steam_id), Number(row.deaths) || 0]));
  return kills
    .map((row) => ({
      steamId: String(row.steam_id),
      name: String(row.name || row.steam_id).slice(0, 80),
      kills: Number(row.kills) || 0,
      headshots: Number(row.headshots) || 0,
      deaths: died.get(String(row.steam_id)) || 0,
      minutes: 0,
      matches: 0,
    }))
    .filter((row) => row.kills > 0);
}

async function fromPresence(span: ReturnType<typeof moscowWeek>): Promise<Fighter[]> {
  const rows = await sql<Array<{ steam_id: string; name: string | null; kills: number; seconds: number }>>`
    SELECT p.steam_id,
           COALESCE(MAX(u.persona), MAX(c.persona), p.steam_id) AS name,
           SUM(p.kills) AS kills,
           SUM(p.seconds) AS seconds
    FROM presence_days p
    LEFT JOIN users u ON u.steam_id = p.steam_id
    LEFT JOIN server_combat c ON c.steam_id = p.steam_id
    WHERE p.day >= ${span.startDay} AND p.day < ${span.endDay}
      AND p.steam_id REGEXP '^[0-9]{17}$'
    GROUP BY p.steam_id
  `;
  return rows
    .map((row) => ({
      steamId: String(row.steam_id),
      name: String(row.name || row.steam_id).slice(0, 80),
      kills: Number(row.kills) || 0,
      headshots: 0,
      deaths: 0,
      minutes: Math.round((Number(row.seconds) || 0) / 60),
      matches: 0,
    }))
    .filter((row) => row.kills > 0);
}

/** Полные матчи: доиграл (не leave). Crowd>100 тоже считается — это игра целиком. */
async function fullMatchCounts(span: ReturnType<typeof moscowWeek>) {
  const rows = await sql<Array<{ steam_id: string; n: number }>>`
    SELECT steam_id, COUNT(DISTINCT match_key) AS n
    FROM played_matches
    WHERE ended_at >= ${span.start} AND ended_at < ${span.end}
      AND result <> 'leave'
      AND steam_id REGEXP '^[0-9]{17}$'
    GROUP BY steam_id
  `;
  return new Map(rows.map((row) => [String(row.steam_id), Number(row.n) || 0]));
}

export async function weekBoard(now = new Date()) {
  const closed = moscowWeek(now, -1);
  const current = moscowWeek(now, 0);
  let span = closed;
  let source: "feed" | "presence" = "feed";
  let fighters = await fromFeed(closed);
  if (!fighters.length) {
    source = "presence";
    fighters = await fromPresence(closed);
  }
  if (!fighters.length) {
    span = current;
    source = "feed";
    fighters = await fromFeed(current);
    if (!fighters.length) {
      source = "presence";
      fighters = await fromPresence(current);
    }
  }
  // В топ — только от 5 матчей от начала до конца; дальше К/Д → HS% → убийства.
  const MIN_MATCHES = 5;
  const matchCounts = await fullMatchCounts(span);
  for (const row of fighters) row.matches = matchCounts.get(row.steamId) || 0;
  fighters = fighters.filter((row) => row.matches >= MIN_MATCHES);
  const kdValue = (row: Fighter) => (row.deaths > 0 ? row.kills / row.deaths : row.kills);
  const hsValue = (row: Fighter) => (row.kills > 0 ? row.headshots / row.kills : 0);
  fighters.sort((a, b) => {
    const kd = kdValue(b) - kdValue(a);
    if (Math.abs(kd) > 1e-9) return kd;
    const hs = hsValue(b) - hsValue(a);
    if (Math.abs(hs) > 1e-9) return hs;
    return b.kills - a.kills || a.deaths - b.deaths || a.name.localeCompare(b.name, "ru");
  });
  const ids = fighters.map((row) => row.steamId);
  const classes = new Map<string, Record<string, unknown>>();
  const squadTags = await approvedSquadTags(ids);
  if (ids.length) {
    const marks = ids.map(() => "?").join(", ");
    const snaps = await sql.unsafe<Array<Record<string, unknown>>>(
      `SELECT s.steam_id, s.role_assault, s.role_medic, s.role_recon, s.role_support, s.role_driver, s.role_pilot
       FROM snapshots s
       JOIN (
         SELECT steam_id, MAX(created_at) AS created_at
         FROM snapshots
         WHERE season = ? AND steam_id IN (${marks})
         GROUP BY steam_id
       ) latest ON latest.steam_id = s.steam_id AND latest.created_at = s.created_at
       WHERE s.season = ?`,
      [config.season, ...ids, config.season],
    );
    for (const snap of snaps) classes.set(String(snap.steam_id), snap);
  }
  const card = (row: (typeof fighters)[number], place: number) => {
    const role = primary(classes.get(row.steamId));
    const hs = row.kills > 0 ? Math.round((row.headshots / row.kills) * 1000) / 10 : null;
    return {
      place,
      name: labeledName(row.name, squadTags.get(row.steamId)),
      squadTag: squadTags.get(row.steamId) ?? null,
      steamId: row.steamId,
      kills: row.kills,
      deaths: row.deaths,
      kd: source === "feed" ? kdOf(row.kills, row.deaths) : null,
      minutes: row.minutes,
      matches: row.matches,
      headshots: row.headshots,
      headshotPct: source === "feed" ? hs : null,
      class: role?.key ?? null,
      level: role?.level ?? 0,
    };
  };
  const ranked = fighters.map((row, index) => card(row, index + 1));
  return {
    week: span.week,
    from: span.from,
    to: span.closed ? span.to : stamp(new Date(now.getTime() + 3 * 60 * 60 * 1000)),
    closed: span.closed,
    source,
    minMatches: MIN_MATCHES,
    season: config.season,
    players: ranked.slice(0, 100),
    classes: CLASS_ORDER.map((key) => ({
      id: key,
      title: CLASS_TITLE[key],
      players: ranked.filter((row) => row.class === key).slice(0, 3).map((row, index) => ({ ...row, place: index + 1 })),
    })),
  };
}

const SQUAD_MIN_SIDE = 5;

type SquadMatchRow = {
  match_key: string;
  steam_id: string;
  faction: string;
  result: string;
  kills: number;
  deaths: number;
  name: string | null;
};

/** Недельный рейтинг сквадов: матч засчитывается, если ≥5 участников одного сквада на одной стороне. */
export async function squadWeekBoard(now = new Date()) {
  const closed = moscowWeek(now, -1);
  const current = moscowWeek(now, 0);
  const members = await sql<Array<{ squad_id: number; tag: string; name: string; steam_id: string }>>`
    SELECT sq.id AS squad_id, sq.tag, sq.name, m.steam_id
    FROM squads sq
    JOIN squad_members m ON m.squad_id = sq.id
    WHERE sq.status = 'approved' AND m.status = 'member'
  `;
  const bySteam = new Map<string, { squadId: number; tag: string; name: string }>();
  const squadMeta = new Map<number, { tag: string; name: string }>();
  for (const row of members) {
    const squadId = Number(row.squad_id);
    const tag = String(row.tag || "").trim().toUpperCase().slice(0, 8);
    const name = String(row.name || tag).slice(0, 40);
    if (!tag) continue;
    squadMeta.set(squadId, { tag, name });
    const steam = String(row.steam_id);
    if (/^\d{17}$/.test(steam) && !bySteam.has(steam)) {
      bySteam.set(steam, { squadId, tag, name });
    }
  }

  async function build(span: ReturnType<typeof moscowWeek>) {
    const rows = await squadMatchRows(span);
    type Acc = {
      squadId: number;
      tag: string;
      name: string;
      games: Set<string>;
      wins: Set<string>;
      players: Map<string, { name: string; kills: number; deaths: number; games: number }>;
    };
    const acc = new Map<number, Acc>();
    const grouped = new Map<string, SquadMatchRow[]>();
    for (const row of rows) {
      const steam = String(row.steam_id);
      const faction = String(row.faction || "").trim();
      if (!bySteam.has(steam) || !faction) continue;
      const key = `${row.match_key}::${faction}`;
      const bucket = grouped.get(key) ?? [];
      bucket.push(row);
      grouped.set(key, bucket);
    }
    for (const [key, bucket] of grouped) {
      const bySquad = new Map<number, SquadMatchRow[]>();
      for (const row of bucket) {
        const meta = bySteam.get(String(row.steam_id));
        if (!meta) continue;
        const list = bySquad.get(meta.squadId) ?? [];
        list.push(row);
        bySquad.set(meta.squadId, list);
      }
      for (const [squadId, list] of bySquad) {
        if (list.length < SQUAD_MIN_SIDE) continue;
        const meta = squadMeta.get(squadId);
        if (!meta) continue;
        let pack = acc.get(squadId);
        if (!pack) {
          pack = {
            squadId,
            tag: meta.tag,
            name: meta.name,
            games: new Set(),
            wins: new Set(),
            players: new Map(),
          };
          acc.set(squadId, pack);
        }
        pack.games.add(key);
        const won = list.some((row) => String(row.result || "").toLowerCase() === "win");
        if (won) pack.wins.add(key);
        for (const row of list) {
          const steam = String(row.steam_id);
          const persona = String(row.name || steam).slice(0, 64);
          const prev = pack.players.get(steam) ?? { name: persona, kills: 0, deaths: 0, games: 0 };
          prev.name = persona;
          prev.kills += Number(row.kills) || 0;
          prev.deaths += Number(row.deaths) || 0;
          prev.games += 1;
          pack.players.set(steam, prev);
        }
      }
    }
    const squads = [...acc.values()]
      .map((pack) => {
        const games = pack.games.size;
        const wins = pack.wins.size;
        const winrate = games > 0 ? Math.round((wins / games) * 1000) / 10 : 0;
        const topPlayers = [...pack.players.values()]
          .sort((a, b) => {
            // Лучшие — по убийствам, при равенстве по К/Д.
            const kills = b.kills - a.kills;
            if (kills) return kills;
            const kd = (b.deaths > 0 ? b.kills / b.deaths : b.kills) - (a.deaths > 0 ? a.kills / a.deaths : a.kills);
            if (Math.abs(kd) > 1e-9) return kd;
            return a.name.localeCompare(b.name, "ru");
          })
          .slice(0, 5)
          .map((row, index) => ({
            place: index + 1,
            name: stripGameTag(row.name).slice(0, 64),
            kills: row.kills,
            deaths: row.deaths,
            kd: kdOf(row.kills, row.deaths),
            games: row.games,
          }));
        return {
          tag: pack.tag,
          name: pack.name,
          games,
          wins,
          losses: Math.max(0, games - wins),
          winrate,
          topPlayers,
        };
      })
      // Сначала винрейт, потом победы, потом число зачётных игр.
      .sort((a, b) => b.winrate - a.winrate || b.wins - a.wins || b.games - a.games || a.tag.localeCompare(b.tag, "ru"))
      .map((row, index) => ({ place: index + 1, ...row }));
    return { span, squads };
  }

  // Закрытая неделя, если в ней есть зачёт; иначе текущая (чтобы не висела пустая/старая картина).
  let built = await build(closed);
  if (!built.squads.length) built = await build(current);
  // Если закрытая почти пустая (1 матч), а текущая уже богаче — берём текущую для живой картины.
  if (built.span.closed) {
    const live = await build(current);
    const closedGames = built.squads.reduce((sum, row) => sum + row.games, 0);
    const liveGames = live.squads.reduce((sum, row) => sum + row.games, 0);
    if (liveGames >= Math.max(3, closedGames * 2)) built = live;
  }
  const { span, squads } = built;

  return {
    week: span.week,
    from: span.from,
    to: span.closed ? span.to : stamp(new Date(now.getTime() + 3 * 60 * 60 * 1000)),
    closed: span.closed,
    minSide: SQUAD_MIN_SIDE,
    season: config.season,
    squads,
  };
}

async function squadMatchRows(span: ReturnType<typeof moscowWeek>) {
  return sql<SquadMatchRow[]>`
    SELECT p.match_key,
           p.steam_id,
           p.faction,
           p.result,
           p.kills,
           p.deaths,
           COALESCE(u.persona, p.steam_id) AS name
    FROM played_matches p
    LEFT JOIN users u ON u.steam_id = p.steam_id
    WHERE p.ended_at >= ${span.start} AND p.ended_at < ${span.end}
      AND p.result IN ('win', 'loss')
      AND p.faction <> ''
      AND p.field_size BETWEEN 2 AND 120
      AND p.steam_id REGEXP '^[0-9]{17}$'
  `;
}
