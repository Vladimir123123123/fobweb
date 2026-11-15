import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { sql } from "./db.js";

const HEADSHOT = "Headshot";
const SUICIDE = "Suicide";
const TEAMKILL = "TeamKill";

export type LiveKill = {
  killer: string;
  victim: string;
  weapon: string;
  meters: number | null;
  headshot: boolean;
};

const recent: LiveKill[] = [];
const seen = new Set<string>();
let weapons: Map<string, string> | null = null;
let tokenCache = "";

function weaponNames() {
  if (weapons) return weapons;
  weapons = new Map();
  try {
    const file = fileURLToPath(new URL("../../web/src/data/catalog.json", import.meta.url));
    const catalog = JSON.parse(readFileSync(file, "utf8")) as { weapons?: Array<{ id?: string; name?: string }> };
    for (const weapon of catalog.weapons ?? []) {
      if (weapon.id && weapon.name) weapons.set(weapon.id, weapon.name);
    }
  } catch {
    weapons = new Map();
  }
  return weapons;
}

function weaponLabel(cause: string) {
  const known = weaponNames().get(cause);
  if (known) return known;
  const tail = cause.split(".").pop() || "";
  return tail.replace(/([a-z])([A-Z])/g, "$1 $2") || "неизвестно";
}

function metersOf(distance: unknown) {
  const value = Number(distance);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.max(1, Math.round(value / 100));
}

function tagged(tags: unknown, needle: string) {
  const want = needle.toLowerCase();
  return Array.isArray(tags) && tags.some((tag) => String(tag).toLowerCase().includes(want));
}

function steam(value: unknown) {
  const id = String(value || "").trim();
  return /^\d{17}$/.test(id) ? id : "";
}

function when(value: unknown) {
  const date = new Date(String(value || ""));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function feedToken() {
  if (tokenCache) return tokenCache;
  const rows = await sql<Array<{ value: string }>>`SELECT value FROM feed_keys WHERE name = 'ingest'`;
  if (rows[0]?.value) {
    tokenCache = rows[0].value;
    return tokenCache;
  }
  const created = randomBytes(24).toString("hex");
  await sql`INSERT IGNORE INTO feed_keys (name, value) VALUES ('ingest', ${created})`;
  const again = await sql<Array<{ value: string }>>`SELECT value FROM feed_keys WHERE name = 'ingest'`;
  tokenCache = again[0]?.value || created;
  return tokenCache;
}

export async function feedAuthorized(header: string) {
  const presented = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const expected = await feedToken();
  if (!presented || !expected) return false;
  const left = createHash("sha256").update(presented).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

type StoredKill = {
  eventId: string;
  matchId: string;
  killedAt: Date | null;
  killerSteam: string;
  killerName: string;
  victimSteam: string;
  victimName: string;
  weapon: string;
  meters: number | null;
  headshot: boolean;
  suicide: boolean;
  teamkill: boolean;
};

/** Партия событий, которую игра сама шлёт на адрес киллфида. */
export async function acceptFeed(body: unknown) {
  const events = body && typeof body === "object" && Array.isArray((body as { events?: unknown }).events)
    ? (body as { events: unknown[] }).events
    : [];
  const rows: StoredKill[] = [];
  for (const item of events) {
    if (!item || typeof item !== "object") continue;
    const event = item as Record<string, unknown>;
    if (event.type !== "killed") continue;
    const victim = String(event.victimName || "").trim().slice(0, 80);
    if (!victim) continue;
    const killer = String(event.killerName || "").trim().slice(0, 80);
    const killerSteam = steam(event.killerSteamId);
    const victimSteam = steam(event.victimSteamId);
    const suicide = tagged(event.contextTags, SUICIDE) || (killer !== "" && killer === victim) || (killerSteam !== "" && killerSteam === victimSteam);
    const killedAt = when(event.eventTime);
    const given = String(event.eventId || "").trim();
    const eventId = (given || createHash("sha256").update([killerSteam, victimSteam, killedAt?.toISOString() ?? "", String(event.cause || ""), String(event.distance || "")].join("|")).digest("hex")).slice(0, 64);
    if (seen.has(eventId)) continue;
    rows.push({
      eventId,
      matchId: String(event.matchId || "").trim().slice(0, 80),
      killedAt,
      killerSteam,
      killerName: killer,
      victimSteam,
      victimName: victim,
      weapon: weaponLabel(String(event.cause || "")),
      meters: metersOf(event.distance),
      headshot: tagged(event.contextTags, HEADSHOT),
      suicide,
      teamkill: tagged(event.contextTags, TEAMKILL),
    });
  }
  for (const row of rows) {
    await sql`
      INSERT IGNORE INTO server_kills (
        event_id, match_id, killed_at, killer_steam, killer_name, victim_steam, victim_name,
        weapon, meters, headshot, suicide, teamkill
      ) VALUES (
        ${row.eventId}, ${row.matchId}, ${row.killedAt}, ${row.killerSteam}, ${row.killerName},
        ${row.victimSteam}, ${row.victimName}, ${row.weapon}, ${row.meters},
        ${row.headshot ? 1 : 0}, ${row.suicide ? 1 : 0}, ${row.teamkill ? 1 : 0}
      )
    `;
    seen.add(row.eventId);
    recent.unshift({
      killer: row.suicide ? "" : row.killerName,
      victim: row.victimName,
      weapon: row.weapon,
      meters: row.meters,
      headshot: row.headshot,
    });
  }
  while (recent.length > 40) recent.pop();
  while (seen.size > 400) seen.clear();
  return rows.length;
}

export function recentKills() {
  return recent.slice(0, 24);
}
