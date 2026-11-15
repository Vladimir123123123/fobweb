import { config } from "./config.js";
import { sql } from "./db.js";

export type PunishmentRow = {
  steamId: string;
  kind: "ban";
  reason: string;
  startedAt: string;
  untilAt: string | null;
};

export type PublicPunishment = {
  kind: "ban";
  reason: string;
  startedAt: string | null;
  untilAt: string | null;
  active: boolean;
  liftedAt: string | null;
};

function cleanReason(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 240);
}

function stamp(value: unknown): string | null {
  const parsed = value instanceof Date ? value : typeof value === "string" && value.trim() ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  const time = parsed.getTime();
  if (time < Date.parse("2020-01-01T00:00:00Z") || time > Date.parse("2100-01-01T00:00:00Z")) return null;
  return parsed.toISOString();
}

/** Текущий список банов сервера. Метки и имя того, кто наказал, сюда не входят. */
export async function rememberBans(rows: PunishmentRow[]): Promise<void> {
  const seen = rows.filter((row) => /^7656\d{13}$/.test(row.steamId) && row.startedAt);
  await sql.begin(async (tx) => {
    await tx`
      UPDATE server_punishments
      SET active = 0, lifted_at = NOW(3)
      WHERE kind = 'ban' AND active = 1
    `;
    for (const row of seen) {
      await tx`
        INSERT INTO server_punishments (steam_id, kind, started_at, reason, until_at, active, lifted_at)
        VALUES (${row.steamId}, ${row.kind}, ${row.startedAt}, ${row.reason}, ${row.untilAt}, 1, NULL)
        ON DUPLICATE KEY UPDATE
          reason = VALUES(reason),
          until_at = VALUES(until_at),
          active = 1,
          lifted_at = NULL
      `;
    }
  });
}

export async function punishmentsFor(steamId: string): Promise<PublicPunishment[]> {
  const rows = await sql<Array<Record<string, unknown>>>`
    SELECT kind, reason, started_at, until_at, active, lifted_at
    FROM server_punishments
    WHERE steam_id = ${steamId}
    ORDER BY active DESC, started_at DESC
    LIMIT 20
  `;
  return rows.map((row) => ({
    kind: "ban",
    reason: cleanReason(row.reason),
    startedAt: stamp(row.started_at),
    untilAt: stamp(row.until_at),
    active: Boolean(row.active),
    liftedAt: stamp(row.lifted_at),
  }));
}

export function bansFromPayload(value: unknown): PunishmentRow[] {
  if (!Array.isArray(value)) return [];
  const rows: PunishmentRow[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const steamId = String(row.steamId ?? "").trim();
    const startedAt = stamp(row.bannedAtUtc ?? row.startedAt);
    if (!/^7656\d{13}$/.test(steamId) || !startedAt) continue;
    const untilAt = stamp(row.untilAt ?? row.expiresAt);
    rows.push({ steamId, kind: "ban", reason: cleanReason(row.reason), startedAt, untilAt });
  }
  return rows;
}

export async function syncBans(): Promise<void> {
  if (!config.rconHost || !config.rconPassword) return;
  const response = await fetch(`http://${config.rconHost}:${config.rconPort}/v1/bans`, {
    headers: {
      Authorization: `Bearer ${config.rconPassword}`,
      Accept: "application/json",
      "User-Agent": "FOB-site",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return;
  const body = await response.json() as { bans?: unknown };
  if (!Array.isArray(body.bans)) return;
  await rememberBans(bansFromPayload(body.bans));
}
