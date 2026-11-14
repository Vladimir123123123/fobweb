import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { sql } from "./db.js";

const HEADSHOT = "Headshot";
const SUICIDE = "Suicide";

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
  return Array.isArray(tags) && tags.some((tag) => String(tag).includes(needle));
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

/** Партия событий, которую игра сама шлёт на адрес киллфида. */
export function acceptFeed(body: unknown) {
  const events = body && typeof body === "object" && Array.isArray((body as { events?: unknown }).events)
    ? (body as { events: unknown[] }).events
    : [];
  let added = 0;
  for (const item of events) {
    if (!item || typeof item !== "object") continue;
    const event = item as Record<string, unknown>;
    if (event.type !== "killed") continue;
    const id = String(event.eventId || "");
    if (id && seen.has(id)) continue;
    const victim = String(event.victimName || "").trim().slice(0, 80);
    if (!victim) continue;
    const killer = String(event.killerName || "").trim().slice(0, 80);
    const suicide = tagged(event.contextTags, SUICIDE) || (killer !== "" && killer === victim);
    recent.unshift({
      killer: suicide ? "" : killer,
      victim,
      weapon: weaponLabel(String(event.cause || "")),
      meters: metersOf(event.distance),
      headshot: tagged(event.contextTags, HEADSHOT),
    });
    if (id) seen.add(id);
    added += 1;
  }
  while (recent.length > 40) recent.pop();
  while (seen.size > 400) seen.clear();
  return added;
}

export function recentKills() {
  return recent.slice(0, 24);
}
