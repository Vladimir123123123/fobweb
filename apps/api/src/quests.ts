import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { creditClanQuest } from "./clan.js";
import { sql } from "./db.js";

export const LEVEL_STEP = 50;
export const LEVEL_CAP = 600;

export type QuestInput = {
  title: string;
  body: string;
  kills: number;
  difficulty: "easy" | "mid" | "hard";
  repeat: "once" | "weekly" | "monthly";
  xp: number;
  coins: number;
  minMeters: number;
  maxMeters: number;
  headshot: boolean;
  weapon: string;
  status: "live" | "draft";
  startsAt: string | null;
  endsAt: string | null;
};

export const QUEST_TEMPLATES: QuestInput[] = [
  { title: "Первая кровь", body: "Любые 3 убийства. Быстрый старт.", kills: 3, difficulty: "easy", repeat: "once", xp: 50, coins: 15, minMeters: 0, maxMeters: 0, headshot: false, weapon: "", status: "draft", startsAt: null, endsAt: null },
  { title: "Разминка", body: "Любые 10 убийств.", kills: 10, difficulty: "easy", repeat: "weekly", xp: 50, coins: 20, minMeters: 0, maxMeters: 0, headshot: false, weapon: "", status: "draft", startsAt: null, endsAt: null },
  { title: "Ближний бой", body: "10 убийств из дробовика не дальше 30 м.", kills: 10, difficulty: "mid", repeat: "once", xp: 100, coins: 40, minMeters: 0, maxMeters: 30, headshot: false, weapon: "дробовик, shotgun", status: "draft", startsAt: null, endsAt: null },
  { title: "За Valkyra", body: "30 убийств.", kills: 30, difficulty: "mid", repeat: "once", xp: 100, coins: 40, minMeters: 0, maxMeters: 0, headshot: false, weapon: "", status: "draft", startsAt: null, endsAt: null },
  { title: "Тяжёлая артиллерия", body: "15 убийств из техники, станков, гранатомётов или взрывчатки.", kills: 15, difficulty: "mid", repeat: "once", xp: 150, coins: 50, minMeters: 0, maxMeters: 0, headshot: false, weapon: "техника, гранат, взрыв, мина, littlebird, havoc, humvee", status: "draft", startsAt: null, endsAt: null },
  { title: "Стрелок", body: "25 убийств из штурмовой винтовки.", kills: 25, difficulty: "mid", repeat: "once", xp: 100, coins: 40, minMeters: 0, maxMeters: 0, headshot: false, weapon: "винтовк, rifle, galil, ak", status: "draft", startsAt: null, endsAt: null },
  { title: "Мастер пистолета", body: "10 убийств из пистолета.", kills: 10, difficulty: "mid", repeat: "once", xp: 100, coins: 40, minMeters: 0, maxMeters: 0, headshot: false, weapon: "пистолет, pistol", status: "draft", startsAt: null, endsAt: null },
  { title: "Натиск ПП", body: "15 убийств из пистолета-пулемёта.", kills: 15, difficulty: "mid", repeat: "once", xp: 100, coins: 40, minMeters: 0, maxMeters: 0, headshot: false, weapon: "пп, smg, пулем", status: "draft", startsAt: null, endsAt: null },
  { title: "Охотник за головами", body: "10 убийств в голову.", kills: 10, difficulty: "hard", repeat: "once", xp: 200, coins: 80, minMeters: 0, maxMeters: 0, headshot: true, weapon: "", status: "draft", startsAt: null, endsAt: null },
  { title: "Марксман", body: "10 убийств снайперской винтовки с 150 м.", kills: 10, difficulty: "hard", repeat: "once", xp: 200, coins: 80, minMeters: 150, maxMeters: 0, headshot: false, weapon: "снайпер, marksman, dmr", status: "draft", startsAt: null, endsAt: null },
  { title: "Тихий охотник", body: "5 убийств.", kills: 5, difficulty: "hard", repeat: "once", xp: 150, coins: 60, minMeters: 0, maxMeters: 0, headshot: false, weapon: "", status: "draft", startsAt: null, endsAt: null },
  { title: "Неуязвимый", body: "10 убийств.", kills: 10, difficulty: "hard", repeat: "once", xp: 200, coins: 80, minMeters: 0, maxMeters: 0, headshot: false, weapon: "", status: "draft", startsAt: null, endsAt: null },
];

type QuestRow = {
  id: number;
  title: string;
  body: string;
  kills: number;
  difficulty: string;
  repeat_kind: string;
  xp: number;
  coins: number;
  min_meters: number;
  max_meters: number;
  headshot: boolean | number;
  weapon: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
};

type RunRow = { id: number; quest_id: number; status: string; started_at: string; period_key: string };

export function communityRank(xp: number) {
  const safe = Math.max(0, Math.floor(Number(xp) || 0));
  const stored = Math.min(safe, LEVEL_CAP * LEVEL_STEP);
  const level = Math.min(LEVEL_CAP, Math.floor(stored / LEVEL_STEP));
  const into = level >= LEVEL_CAP ? LEVEL_STEP : stored - level * LEVEL_STEP;
  return { level, into, need: LEVEL_STEP, xp: stored, maxed: level >= LEVEL_CAP };
}

export function periodKey(kind: string, now = new Date()) {
  if (kind === "weekly") {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  if (kind === "monthly") return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return "once";
}

function clip(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function whole(value: unknown, max: number) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number) || number < 0 || number > max) return null;
  return number;
}

function when(value: unknown) {
  if (value == null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 23).replace("T", " ");
}

export function questInput(body: Record<string, unknown> | null): QuestInput | null {
  if (!body) return null;
  const title = clip(body.title, 120);
  const text = clip(body.body, 500);
  const kills = whole(body.kills, 500);
  const xp = whole(body.xp, 2000);
  const coins = whole(body.coins, 5000);
  const minMeters = whole(body.minMeters, 2000);
  const maxMeters = whole(body.maxMeters, 2000);
  const difficulty = body.difficulty === "easy" || body.difficulty === "hard" ? body.difficulty : "mid";
  const repeat = body.repeat === "weekly" || body.repeat === "monthly" ? body.repeat : "once";
  const status = body.status === "draft" ? "draft" : "live";
  if (!title || !text || kills == null || kills < 1 || xp == null || coins == null || minMeters == null || maxMeters == null) return null;
  return {
    title,
    body: text,
    kills,
    difficulty,
    repeat,
    xp,
    coins,
    minMeters,
    maxMeters,
    headshot: body.headshot === true,
    weapon: clip(body.weapon, 120),
    status,
    startsAt: when(body.startsAt),
    endsAt: when(body.endsAt),
  };
}

const FAMILY_TOKENS: Record<string, string[]> = {
  AR: ["винтовк", "rifle", "штурмов"],
  SMG: ["пп", "smg", "пулем"],
  LMG: ["пулемёт", "пулемет", "lmg"],
  Shotgun: ["дробовик", "shotgun"],
  Pistol: ["пистолет", "pistol"],
  Sniper: ["снайпер", "sniper"],
  DMR: ["marksman", "dmr", "марксман"],
};

const NAME_TOKENS: Array<{ tokens: string[]; includes: string[] }> = [
  { tokens: ["гранат", "grenade"], includes: ["grenade"] },
  { tokens: ["взрыв", "мина", "mine"], includes: ["mine", "claymore", "c4", "explosive"] },
];

let weaponFamilies: Map<string, string[]> | null = null;
let weaponNames: string[] | null = null;

function weaponBook() {
  if (weaponFamilies && weaponNames) return { families: weaponFamilies, names: weaponNames };
  const families = new Map<string, string[]>();
  const names: string[] = [];
  try {
    const file = fileURLToPath(new URL("../../web/src/data/catalog.json", import.meta.url));
    const catalog = JSON.parse(readFileSync(file, "utf8")) as {
      weapons?: Array<{ name?: string; archetype?: string }>;
      sidearms?: Array<{ name?: string; archetype?: string }>;
    };
    for (const weapon of [...(catalog.weapons ?? []), ...(catalog.sidearms ?? [])]) {
      const name = String(weapon.name ?? "").trim();
      const archetype = String(weapon.archetype ?? "");
      if (!name || !archetype) continue;
      names.push(name);
      const bucket = families.get(archetype) ?? [];
      bucket.push(name);
      families.set(archetype, bucket);
    }
  } catch {
    families.clear();
  }
  weaponFamilies = families;
  weaponNames = names;
  return { families, names };
}

function wordsOf(weapon: string) {
  const words = weapon.split(",").map((part) => part.trim().replace(/[%_]/g, "").slice(0, 40)).filter(Boolean).slice(0, 8);
  const { families, names } = weaponBook();
  const extra = new Set<string>();
  for (const word of words) {
    const needle = word.toLowerCase();
    for (const [archetype, tokens] of Object.entries(FAMILY_TOKENS)) {
      const hit = tokens.some((token) => needle === token || (token.length >= 4 && needle.includes(token)));
      if (!hit) continue;
      for (const name of families.get(archetype) ?? []) extra.add(name);
    }
    for (const group of NAME_TOKENS) {
      const hit = group.tokens.some((token) => needle === token || (token.length >= 4 && needle.includes(token)));
      if (!hit) continue;
      for (const name of names) {
        const label = name.toLowerCase();
        if (group.includes.some((part) => label.includes(part))) extra.add(name);
      }
    }
  }
  return [...new Set([...words, ...extra])].slice(0, 48);
}

function sqlTime(value: unknown) {
  return value instanceof Date ? value : String(value ?? "");
}

const KILL_AT = "COALESCE(IF(killed_at >= '2024-01-01' AND killed_at < '2036-01-01', killed_at, NULL), received_at)";

async function killCount(steamId: string, since: unknown, until: unknown, rule: { headshot: boolean; minMeters: number; maxMeters: number; weapon: string }) {
  const words = wordsOf(rule.weapon);
  const params: unknown[] = [steamId, sqlTime(since)];
  let extra = "";
  if (until) {
    extra += ` AND ${KILL_AT} <= ?`;
    params.push(sqlTime(until));
  }
  if (rule.headshot) extra += " AND headshot = 1";
  if (rule.minMeters > 0) {
    extra += " AND meters >= ?";
    params.push(rule.minMeters);
  }
  if (rule.maxMeters > 0) {
    extra += " AND meters > 0 AND meters <= ?";
    params.push(rule.maxMeters);
  }
  if (words.length) {
    extra += ` AND (${words.map(() => "weapon LIKE ?").join(" OR ")})`;
    params.push(...words.map((word) => `%${word}%`));
  }
  const rows = await sql.unsafe<Array<{ n: number }>>(
    `SELECT CAST(COUNT(*) AS SIGNED) AS n FROM server_kills
     WHERE killer_steam = ?
       AND ${KILL_AT} >= ?
       AND suicide = 0 AND teamkill = 0${extra}`,
    params,
  );
  return Number(rows[0]?.n ?? 0);
}

async function award(runId: number, steamId: string, xp: number, coins: number) {
  const cap = LEVEL_CAP * LEVEL_STEP;
  return sql.begin(async (tx) => {
    const updated = await tx<{ affected?: number }[]>`
      UPDATE quest_runs SET status = 'done', done_at = NOW()
      WHERE id = ${runId} AND status = 'active'
    `;
    if (!updated[0]?.affected) return false;
    await tx`
      INSERT INTO community (steam_id, xp, coins)
      VALUES (${steamId}, LEAST(${cap}, ${xp}), ${coins})
      ON DUPLICATE KEY UPDATE
        xp = LEAST(${cap}, xp + ${xp}),
        coins = coins + ${coins}
    `;
    await creditClanQuest(tx, steamId, coins);
    return true;
  });
}

async function settle(steamId: string) {
  const runs = await sql<Array<RunRow & QuestRow>>`
    SELECT r.id, r.quest_id, r.started_at, q.kills, q.xp, q.coins, q.min_meters, q.max_meters, q.headshot, q.weapon, q.ends_at
    FROM quest_runs r
    JOIN quests q ON q.id = r.quest_id
    WHERE r.steam_id = ${steamId} AND r.status = 'active'
  `;
  for (const run of runs) {
    const count = await killCount(steamId, run.started_at, run.ends_at, {
      headshot: Boolean(run.headshot),
      minMeters: Number(run.min_meters) || 0,
      maxMeters: Number(run.max_meters) || 0,
      weapon: String(run.weapon || ""),
    });
    if (count >= Number(run.kills)) await award(Number(run.id), steamId, Number(run.xp) || 0, Number(run.coins) || 0);
  }
}

function card(row: QuestRow, run: RunRow | undefined, progress: number) {
  return {
    id: Number(row.id),
    title: row.title,
    body: row.body,
    kills: Number(row.kills),
    difficulty: row.difficulty,
    repeat: row.repeat_kind,
    xp: Number(row.xp),
    coins: Number(row.coins),
    minMeters: Number(row.min_meters) || 0,
    maxMeters: Number(row.max_meters) || 0,
    headshot: Boolean(row.headshot),
    weapon: row.weapon || "",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    state: run?.status === "done" ? "done" : run ? "active" : "open",
    progress: run?.status === "done" ? Number(row.kills) : progress,
  };
}

export async function publicQuests(steamId: string | null) {
  if (steamId) await settle(steamId);
  const quests = await sql<QuestRow[]>`
    SELECT id, title, body, kills, difficulty, repeat_kind, xp, coins, min_meters, max_meters, headshot, weapon, status, starts_at, ends_at
    FROM quests
    WHERE status = 'live'
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (ends_at IS NULL OR ends_at > NOW() OR id IN (SELECT quest_id FROM quest_runs WHERE steam_id = ${steamId || ""}))
    ORDER BY id DESC
  `;
  const runs = steamId
    ? await sql<RunRow[]>`SELECT id, quest_id, status, started_at, period_key FROM quest_runs WHERE steam_id = ${steamId}`
    : [];
  const wallet = steamId
    ? (await sql<Array<{ xp: number; coins: number }>>`SELECT xp, coins FROM community WHERE steam_id = ${steamId}`)[0]
    : undefined;
  const cards = [];
  for (const quest of quests) {
    const key = periodKey(quest.repeat_kind);
    const current = runs.find((run) => Number(run.quest_id) === Number(quest.id) && run.period_key === key);
    let progress = 0;
    if (current && current.status === "active") {
      progress = await killCount(steamId || "", current.started_at, quest.ends_at, {
        headshot: Boolean(quest.headshot),
        minMeters: Number(quest.min_meters) || 0,
        maxMeters: Number(quest.max_meters) || 0,
        weapon: String(quest.weapon || ""),
      });
    }
    cards.push(card(quest, current, progress));
  }
  const rank = communityRank(Number(wallet?.xp) || 0);
  return { quests: cards, signedIn: Boolean(steamId), coins: Number(wallet?.coins) || 0, ...rank };
}

export async function startQuest(steamId: string, questId: number) {
  const quests = await sql<QuestRow[]>`
    SELECT id, title, body, kills, difficulty, repeat_kind, xp, coins, min_meters, max_meters, headshot, weapon, status, starts_at, ends_at
    FROM quests
    WHERE id = ${questId} AND status = 'live'
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (ends_at IS NULL OR ends_at > NOW())
  `;
  const quest = quests[0];
  if (!quest) return { error: "closed" as const };
  const key = periodKey(quest.repeat_kind);
  const existing = await sql<RunRow[]>`
    SELECT id, quest_id, status, started_at, period_key
    FROM quest_runs
    WHERE quest_id = ${questId} AND steam_id = ${steamId} AND period_key = ${key}
  `;
  if (existing[0]?.status === "done") return { error: "done" as const };
  if (!existing[0]) {
    await sql`
      INSERT INTO quest_runs (quest_id, steam_id, period_key, status)
      VALUES (${questId}, ${steamId}, ${key}, 'active')
    `;
  }
  return { error: "" as const };
}

export async function adminQuestBoard() {
  const quests = await sql<Array<QuestRow & { started: number; finished: number }>>`
    SELECT q.id, q.title, q.body, q.kills, q.difficulty, q.repeat_kind, q.xp, q.coins, q.min_meters, q.max_meters,
           q.headshot, q.weapon, q.status, q.starts_at, q.ends_at,
           CAST(COUNT(r.id) AS SIGNED) AS started,
           CAST(SUM(CASE WHEN r.status = 'done' THEN 1 ELSE 0 END) AS SIGNED) AS finished
    FROM quests q
    LEFT JOIN quest_runs r ON r.quest_id = q.id
    GROUP BY q.id
    ORDER BY q.id DESC
  `;
  return {
    templates: QUEST_TEMPLATES,
    quests: quests.map((row) => ({
      ...card(row, undefined, 0),
      status: row.status,
      started: Number(row.started) || 0,
      finished: Number(row.finished) || 0,
    })),
  };
}

export async function insertQuest(input: QuestInput) {
  const inserted = await sql`
    INSERT INTO quests (title, body, kills, difficulty, repeat_kind, xp, coins, min_meters, max_meters, headshot, weapon, status, starts_at, ends_at)
    VALUES (
      ${input.title}, ${input.body}, ${input.kills}, ${input.difficulty}, ${input.repeat}, ${input.xp}, ${input.coins},
      ${input.minMeters}, ${input.maxMeters}, ${input.headshot ? 1 : 0}, ${input.weapon}, ${input.status}, ${input.startsAt}, ${input.endsAt}
    )
  `;
  return Number(inserted[0]?.id ?? 0);
}

export async function saveQuest(id: number, input: QuestInput) {
  const updated = await sql<{ affected?: number }[]>`
    UPDATE quests SET
      title = ${input.title}, body = ${input.body}, kills = ${input.kills}, difficulty = ${input.difficulty},
      repeat_kind = ${input.repeat}, xp = ${input.xp}, coins = ${input.coins}, min_meters = ${input.minMeters},
      max_meters = ${input.maxMeters}, headshot = ${input.headshot ? 1 : 0}, weapon = ${input.weapon}, status = ${input.status},
      starts_at = ${input.startsAt}, ends_at = ${input.endsAt}
    WHERE id = ${id}
  `;
  return Boolean(updated[0]?.affected);
}

export async function removeQuest(id: number) {
  await sql`DELETE FROM quest_runs WHERE quest_id = ${id}`;
  const removed = await sql<{ affected?: number }[]>`DELETE FROM quests WHERE id = ${id}`;
  return Boolean(removed[0]?.affected);
}
