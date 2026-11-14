import { randomBytes } from "node:crypto";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { config } from "./config.js";
import { dumpDatabase } from "./backup.js";
import { migrate, sql } from "./db.js";
import { discordInvite, imageFile, readMedia, removeMedia, saveMedia } from "./media.js";
import { clearSession, cookieString, createSession, readSession, writeCookies } from "./session.js";
import { SEARCH_TAGS } from "./seo.js";
import { fightSnapshot, ingestCombat } from "./server-combat.js";
import { liveServer } from "./server-live.js";
import { steamLoginUrl, steamProfile, verifySteamLogin } from "./steam.js";

const SORTS: Record<string, string> = {
  level: "wardog_level",
  xp: "xp",
  value: "account_value",
  cash: "cash",
  gold: "gold",
  unlocks: "unlocks",
  assault: "role_assault",
  medic: "role_medic",
  recon: "role_recon",
  support: "role_support",
  driver: "role_driver",
  pilot: "role_pilot",
  kills: "server_kills",
  deaths: "server_deaths",
  kd: "server_kd",
};

const PUBLIC_EVENTS = new Set(["page_view", "discord_click", "share_build", "squad_banner_click", "search_land"]);
const PROFILE_ACCENTS = new Set(["orange", "gold", "blue", "red", "green"]);
const hits = new Map<string, { n: number; at: number }>();

function steamIdOf(request: FastifyRequest) {
  return readSession(request)?.steamId ?? null;
}

async function isAdmin(steamId: string | null) {
  if (!steamId) return false;
  const rows = await sql<{ steam_id: string }[]>`SELECT steam_id FROM admins WHERE steam_id = ${steamId}`;
  return rows.length > 0;
}

function notFound(reply: FastifyReply) {
  return reply.code(404).send({ error: "not_found" });
}

function asObject(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function loadoutCode(value: unknown) {
  const code = text(value, 2000);
  if (!/^[A-Za-z0-9_-]{8,2000}$/.test(code)) return "";
  try {
    const pad = code.length % 4 === 0 ? "" : "=".repeat(4 - (code.length % 4));
    const json = Buffer.from(code.replaceAll("-", "+").replaceAll("_", "/") + pad, "base64").toString("utf8");
    const payload = JSON.parse(json) as Record<string, unknown>;
    const slotsOk = (slots: unknown) => {
      if (!slots || typeof slots !== "object" || Array.isArray(slots)) return false;
      const entries = Object.entries(slots);
      return entries.length <= 16 && entries.every(([key, item]) => key.length < 40 && typeof item === "string" && item.length < 80);
    };
    const piece = (key: string) => typeof payload[key] === "string" && (payload[key] as string).length < 80;
    if (!["w", "s", "h", "a", "v", "b"].every(piece) || !payload.w || !slotsOk(payload.t) || !slotsOk(payload.u)) return "";
    return code;
  } catch {
    return "";
  }
}

function whole(value: unknown, max: number) {
  if (value === null || value === undefined) return null;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 0 || number > max) return undefined;
  return Math.round(number);
}

function deadline(ms: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, stop: () => clearTimeout(timer) };
}

function readCookie(header: string | undefined, name: string) {
  return (header ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ?? "";
}

const AUTH_COOKIE_AGE = 30 * 60;

type LoginJob = {
  ticket: string;
  code: string;
  where: string;
  status: "pending" | "ok" | "fail";
  fail: string;
  steamId: string;
  flag: string;
};
const loginBusy = new Set<string>();

async function readLoginJob(ticket: string): Promise<LoginJob | null> {
  if (!ticket) return null;
  const rows = await sql<{
    oauth_code: string;
    next_path: string;
    status: string;
    fail: string;
    steam_id: string;
    flag: string;
  }[]>`
    SELECT oauth_code, next_path, status, fail, steam_id, flag
    FROM auth_jobs WHERE ticket = ${ticket} AND expires_at > NOW()
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    ticket,
    code: row.oauth_code,
    where: row.next_path,
    status: row.status === "ok" || row.status === "fail" ? row.status : "pending",
    fail: row.fail,
    steamId: row.steam_id,
    flag: row.flag,
  };
}

async function writeLoginJob(job: LoginJob) {
  await sql`
    INSERT INTO auth_jobs (ticket, oauth_code, next_path, status, fail, steam_id, flag, expires_at)
    VALUES (
      ${job.ticket}, ${job.code}, ${job.where}, ${job.status}, ${job.fail}, ${job.steamId}, ${job.flag},
      DATE_ADD(NOW(), INTERVAL ${AUTH_COOKIE_AGE} SECOND)
    )
    ON DUPLICATE KEY UPDATE
      status = VALUES(status), fail = VALUES(fail), steam_id = VALUES(steam_id),
      flag = VALUES(flag), oauth_code = VALUES(oauth_code)
  `;
}

function loginNext(next: string) {
  const value = next.startsWith("/") && !next.startsWith("//") ? next : "/ratings";
  return value === "/" ? "/ratings" : value;
}

async function rememberAuth(state: string, next: string) {
  await sql`
    INSERT INTO auth_pending (state, next_path, expires_at)
    VALUES (${state}, ${next}, DATE_ADD(NOW(), INTERVAL ${AUTH_COOKIE_AGE} SECOND))
    ON DUPLICATE KEY UPDATE next_path = VALUES(next_path), expires_at = VALUES(expires_at)
  `;
}

async function takeAuth(state: string) {
  if (!state) return "";
  const rows = await sql<{ next_path: string }[]>`
    SELECT next_path FROM auth_pending WHERE state = ${state} AND expires_at > NOW()
  `;
  await sql`DELETE FROM auth_pending WHERE state = ${state} OR expires_at < NOW()`;
  return rows[0]?.next_path ?? "";
}

function continueOffsite(reply: FastifyReply, url: string, cookies: string[]) {
  writeCookies(reply, cookies);
  reply.header("cache-control", "no-store");
  return reply.redirect(url);
}

function finishLogin(reply: FastifyReply, steamId: string, where: string, saved: boolean) {
  writeCookies(reply, [
    cookieString("wd_session", createSession(steamId), 14 * 24 * 3600),
    cookieString("wd_next", "", 0),
    cookieString("wd_wdt", "", 0),
  ]);
  const back = new URL(where, config.siteOrigin);
  if (!saved) back.searchParams.set("sync", "empty");
  return reply.redirect(back.toString());
}

function nextPath(cookieHeader: string | undefined, fallback: string) {
  const raw = readCookie(cookieHeader, "wd_next");
  let target = fallback;
  if (raw) {
    try {
      target = decodeURIComponent(raw);
    } catch {
      target = fallback;
    }
  }
  return target.startsWith("/") && !target.startsWith("//") ? target : fallback;
}

function roleLevel(stats: { roles?: Record<string, { level?: unknown }> } | null, name: string) {
  return whole(stats?.roles?.[name]?.level, 1000) ?? null;
}

async function saveCareer(steamId: string, stats: {
  wardogLevel?: unknown;
  careerXp?: unknown;
  cash?: unknown;
  gold?: unknown;
  unlocks?: unknown;
  accountValue?: unknown;
  roles?: Record<string, { level?: unknown }>;
} | null, source: string, openSession: boolean) {
  if (!stats) return false;
  const level = whole(stats.wardogLevel, 1000);
  const xp = whole(stats.careerXp, 50_000_000_000);
  if (level === undefined || xp === undefined) return false;
  const value = whole(stats.accountValue, 50_000_000_000);
  await sql`
    INSERT INTO snapshots (
      steam_id, season, wardog_level, xp, account_value, cash, gold, unlocks,
      role_assault, role_medic, role_recon, role_support, role_driver, role_pilot, source
    ) VALUES (
      ${steamId}, ${config.season}, ${level}, ${xp}, ${value ?? null},
      ${whole(stats.cash, 50_000_000_000) ?? null}, ${whole(stats.gold, 1_000_000) ?? null}, ${whole(stats.unlocks, 100_000) ?? null},
      ${roleLevel(stats, "assault")}, ${roleLevel(stats, "medic")}, ${roleLevel(stats, "recon")},
      ${roleLevel(stats, "support")}, ${roleLevel(stats, "driver")}, ${roleLevel(stats, "pilot")}, ${source}
    )
  `;
  if (openSession) {
    await sql`
      INSERT INTO sync_sessions (steam_id, status, expires_at, updated_at)
      VALUES (${steamId}, 'active', DATE_ADD(NOW(), INTERVAL 3 HOUR), NOW())
      ON DUPLICATE KEY UPDATE status = 'active', expires_at = DATE_ADD(NOW(), INTERVAL 3 HOUR), updated_at = NOW()
    `;
  }
  return true;
}

function sameCareer(row: Record<string, unknown>, stats: NonNullable<Parameters<typeof saveCareer>[1]>) {
  const num = (value: unknown) => value == null ? null : Number(value);
  const level = whole(stats.wardogLevel, 1000);
  const xp = whole(stats.careerXp, 50_000_000_000);
  if (level == null || xp == null) return false;
  return num(row.wardog_level) === level
    && num(row.xp) === xp
    && num(row.cash) === whole(stats.cash, 50_000_000_000)
    && num(row.gold) === whole(stats.gold, 1_000_000)
    && num(row.unlocks) === whole(stats.unlocks, 100_000)
    && num(row.role_assault) === roleLevel(stats, "assault")
    && num(row.role_medic) === roleLevel(stats, "medic")
    && num(row.role_recon) === roleLevel(stats, "recon")
    && num(row.role_support) === roleLevel(stats, "support")
    && num(row.role_driver) === roleLevel(stats, "driver")
    && num(row.role_pilot) === roleLevel(stats, "pilot");
}

async function trackerGet(path: string, withKey: boolean, ms = 6_000) {
  const wait = deadline(ms);
  try {
    const headers: Record<string, string> = { accept: "application/json", "user-agent": "wd-axis/career" };
    if (withKey && config.trackerKey) headers.authorization = `Bearer ${config.trackerKey}`;
    const response = await fetch(`https://wardogstracker.gg${path}`, { headers, signal: wait.signal });
    wait.stop();
    const raw = await response.text();
    let json: unknown = null;
    try {
      json = raw ? JSON.parse(raw) as unknown : null;
    } catch {
      json = null;
    }
    return { status: response.status, json };
  } catch {
    wait.stop();
    return { status: 0, json: null };
  }
}

function playerStats(json: unknown): Parameters<typeof saveCareer>[1] | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  const player = root.player && typeof root.player === "object" ? root.player as Record<string, unknown> : root;
  const stats = player.stats;
  if (!stats || typeof stats !== "object") return null;
  return stats as Parameters<typeof saveCareer>[1];
}

function trackerSyncedAt(json: unknown) {
  const stats = playerStats(json) as { syncedAt?: unknown } | null;
  return typeof stats?.syncedAt === "string" ? stats.syncedAt : "";
}

async function pullPublicCareer(steamId: string) {
  const got = await trackerGet(`/api/v1/players/${steamId}`, false);
  const stats = playerStats(got.json);
  if (!stats) return false;
  return (await storeCareer(steamId, stats, "tracker", false)).ok;
}

async function refreshPublicCareers() {
  const due = await sql<{ steam_id: string }[]>`
    SELECT steam_id FROM users
    ORDER BY last_login_at DESC
    LIMIT 80
  `;
  for (const row of due) await pullPublicCareer(row.steam_id);
}

async function refreshCareers() {
  if (!config.trackerKey) return;
  const due = await sql<{ steam_id: string }[]>`
    SELECT steam_id FROM sync_sessions WHERE status = 'active' AND expires_at > NOW() LIMIT 30
  `;
  for (const row of due) {
    try {
      const response = await fetch(`https://wardogstracker.gg/api/v1/connect/players/${row.steam_id}`, {
        headers: { authorization: `Bearer ${config.trackerKey}` },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) continue;
      const body = await response.json() as { player?: { stats?: Parameters<typeof saveCareer>[1] } };
      await storeCareer(row.steam_id, body.player?.stats ?? null, "refresh", false);
    } catch (error) {
      app.log.error(error);
    }
  }
}

async function fillSteamProfile(steamId: string) {
  const profile = await steamProfile(steamId);
  if (!profile.persona && !profile.avatar && !profile.country) return;
  await sql`
    UPDATE users SET
      persona = COALESCE(${profile.persona}, persona),
      avatar = COALESCE(${profile.avatar}, avatar),
      country = COALESCE(${profile.country}, country)
    WHERE steam_id = ${steamId}
  `;
}

async function upsertUser(steamId: string) {
  await sql`
    INSERT INTO users (steam_id, persona, avatar, country, cis_opt_in, hide_leaderboard, last_login_at)
    VALUES (${steamId}, null, null, null, 1, 0, now())
    ON DUPLICATE KEY UPDATE last_login_at = NOW()
  `;
  await sql`
    INSERT INTO events (name, steam_id) VALUES ('login_ok', ${steamId})
  `;
  fillSteamProfile(steamId).catch((error) => app.log.error(error));
}

const ROLE_KEYS = ["assault", "medic", "recon", "support", "driver", "pilot"] as const;

function primaryClassOf(snap: Record<string, unknown> | null | undefined) {
  if (!snap) return null;
  let best: (typeof ROLE_KEYS)[number] | null = null;
  let peak = 0;
  for (const key of ROLE_KEYS) {
    const value = Number(snap[`role_${key}`] ?? 0);
    if (!Number.isFinite(value) || value <= peak) continue;
    peak = value;
    best = key;
  }
  return peak > 0 ? best : null;
}

function botAuthorized(request: FastifyRequest) {
  const key = String(request.headers["x-bot-key"] ?? "");
  if (!key) return false;
  if (config.botKey && key === config.botKey) return true;
  // Пока BOT_API_KEY не прописан на хосте — достаточно SESSION_SECRET (тот же .env).
  if (key === config.sessionSecret) return true;
  return false;
}

async function latestSnapshot(steamId: string) {
  const rows = await sql<Record<string, unknown>[]>`
    SELECT id, steam_id, season, wardog_level, xp, account_value, cash, gold, unlocks,
           role_assault, role_medic, role_recon, role_support, role_driver, role_pilot, source, created_at
    FROM snapshots
    WHERE steam_id = ${steamId} AND season = ${config.season}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

function unlockCash(json: unknown) {
  if (!json || typeof json !== "object") return null;
  const cash = (json as { unlockValue?: { cash?: unknown } }).unlockValue?.cash;
  const value = whole(cash, 50_000_000_000);
  return value == null ? null : value;
}

async function attachAccountValue<T extends { accountValue?: unknown } | null>(steamId: string, stats: T): Promise<T> {
  if (!stats || whole(stats.accountValue, 50_000_000_000) != null) return stats;
  const got = await trackerGet(`/api/v1/players/${steamId}/unlocks`, false, 8_000);
  const cash = unlockCash(got.json);
  if (cash == null) return stats;
  return { ...stats, accountValue: cash };
}

async function storeCareer(steamId: string, stats: Parameters<typeof saveCareer>[1], source: string, openSession: boolean) {
  const ready = await attachAccountValue(steamId, stats);
  if (!ready) return { ok: false, unchanged: false };
  const latest = await latestSnapshot(steamId);
  const nextValue = whole(ready.accountValue, 50_000_000_000);
  if (latest && sameCareer(latest, ready)) {
    const prev = latest.account_value == null ? null : Number(latest.account_value);
    if (nextValue != null && prev !== nextValue) {
      await sql`UPDATE snapshots SET account_value = ${nextValue} WHERE id = ${latest.id}`;
    }
    if (openSession) {
      await sql`
        INSERT INTO sync_sessions (steam_id, status, expires_at, updated_at)
        VALUES (${steamId}, 'active', DATE_ADD(NOW(), INTERVAL 3 HOUR), NOW())
        ON DUPLICATE KEY UPDATE status = 'active', expires_at = DATE_ADD(NOW(), INTERVAL 3 HOUR), updated_at = NOW()
      `;
    }
    return { ok: true, unchanged: nextValue == null || prev === nextValue };
  }
  const saved = await saveCareer(steamId, ready, source, openSession);
  return { ok: saved, unchanged: false };
}

async function pullConnectCareer(steamId: string) {
  if (!config.trackerKey) return false;
  const got = await trackerGet(`/api/v1/connect/players/${steamId}`, true);
  const stats = playerStats(got.json);
  if (!stats) return false;
  return (await storeCareer(steamId, stats, "bot_connect", false)).ok;
}

async function applyCareer(steamId: string, json: unknown, source: string) {
  const stats = playerStats(json);
  if (!stats) {
    return { saved: false, unchanged: false, reason: "empty", source: null as string | null, syncedAt: "" };
  }
  const syncedAt = trackerSyncedAt(json);
  const stored = await storeCareer(steamId, stats, source, false);
  return {
    saved: stored.ok,
    unchanged: stored.unchanged,
    reason: stored.ok ? (stored.unchanged ? "same" : "ok") : "bad_stats",
    source,
    syncedAt,
  };
}

async function refreshCareer(steamId: string) {
  const pub = await trackerGet(`/api/v1/players/${steamId}`, false, 6_000);
  if (playerStats(pub.json)) return applyCareer(steamId, pub.json, "tracker");
  return {
    saved: false,
    unchanged: false,
    reason: pub.status === 0 ? "tracker_down" : "empty",
    source: null as string | null,
    syncedAt: "",
  };
}

async function ensureCareer(steamId: string) {
  const result = await refreshCareer(steamId);
  return result.saved;
}

async function upsertBotUser(steamId: string, discordId: string, discordName: string) {
  const profile = await steamProfile(steamId);
  await sql`
    INSERT INTO users (steam_id, persona, avatar, country, cis_opt_in, hide_leaderboard, discord_id, discord_name, last_login_at)
    VALUES (
      ${steamId}, ${profile.persona}, ${profile.avatar}, ${profile.country},
      1, 0, ${discordId || null}, ${discordName || null}, NOW()
    )
    ON DUPLICATE KEY UPDATE
      persona = COALESCE(VALUES(persona), persona),
      avatar = COALESCE(VALUES(avatar), avatar),
      country = COALESCE(VALUES(country), country),
      cis_opt_in = 1,
      hide_leaderboard = 0,
      discord_id = COALESCE(VALUES(discord_id), discord_id),
      discord_name = COALESCE(VALUES(discord_name), discord_name),
      last_login_at = NOW()
  `;
}

async function joinFobSquad(steamId: string) {
  const squads = await sql<{ id: number }[]>`
    SELECT id FROM squads
    WHERE UPPER(tag) = 'FOB' AND status = 'approved'
    ORDER BY id ASC
    LIMIT 1
  `;
  const squadId = squads[0]?.id;
  if (!squadId) return false;
  await sql.begin(async (tx) => {
    await tx`DELETE FROM squad_members WHERE steam_id = ${steamId}`;
    await tx`
      INSERT INTO squad_members (squad_id, steam_id, role, status)
      VALUES (${squadId}, ${steamId}, 'member', 'member')
    `;
  });
  return true;
}

async function botPlayerPayload(steamId: string) {
  const users = await sql<Record<string, unknown>[]>`
    SELECT steam_id, persona, avatar, country, cis_opt_in, hide_leaderboard, discord_id, discord_name
    FROM users WHERE steam_id = ${steamId}
  `;
  if (!users.length) return null;
  const snapshot = await latestSnapshot(steamId);
  return {
    user: users[0],
    snapshot,
    primaryClass: primaryClassOf(snapshot),
  };
}

const app = Fastify({ logger: { level: "info" }, bodyLimit: 2_000_000 });
app.removeContentTypeParser("application/json");
app.addContentTypeParser("application/json", { parseAs: "string" }, (_request, body, done) => {
  try {
    done(null, body ? JSON.parse(body as string) : {});
  } catch {
    done(new Error("bad_json"), undefined);
  }
});
app.addContentTypeParser("*", { parseAs: "string" }, (_request, body, done) => {
  done(null, body || "");
});

app.setErrorHandler((error, _request, reply) => {
  const message = error instanceof Error ? error.message : "";
  if (message === "bad_json") return reply.code(400).send({ error: "bad_request" });
  const status = typeof (error as { statusCode?: number }).statusCode === "number"
    ? (error as { statusCode: number }).statusCode
    : 500;
  if (status >= 500) app.log.error(error);
  return reply.code(status).send({ error: status === 415 ? "unsupported_type" : "server" });
});

app.get("/api/health", async () => {
  await sql`SELECT 1`;
  return { ok: true, season: config.season };
});

app.get("/api/server", async (_request, reply) => {
  try {
    const server = await liveServer();
    if (!server) return reply.code(503).send({ error: "offline" });
    const fight = await fightSnapshot(server.factions);
    return { ...server, ...fight };
  } catch {
    return reply.code(503).send({ error: "offline" });
  }
});

app.get("/auth/steam", async (request, reply) => {
  const next = loginNext(text((request.query as Record<string, unknown>).next, 200));
  const state = randomBytes(16).toString("hex");
  await rememberAuth(state, next);
  return continueOffsite(
    reply,
    steamLoginUrl(`${config.siteOrigin}/auth/steam/callback`, config.siteOrigin),
    [
      cookieString("wd_next", encodeURIComponent(next), AUTH_COOKIE_AGE),
      cookieString("wd_wdt", state, AUTH_COOKIE_AGE),
    ],
  );
});

app.get("/auth/wardogs/start", async (request, reply) => {
  if (!config.trackerKey || !config.trackerClientId) {
    return reply.redirect(`${config.siteOrigin}/ratings?sync=retry`);
  }
  const query = request.query as Record<string, unknown>;
  // next=/p?id=… ломается в query-string (второй ?). Для профиля: next=/p&steamId=…
  const steamId = text(query.steamId, 20);
  let next = loginNext(text(query.next, 200));
  if (/^\d{17}$/.test(steamId) && (next === "/p" || next === "/p/" || next.startsWith("/p?"))) {
    next = `/p/?id=${steamId}`;
  }
  const state = randomBytes(16).toString("hex");
  await rememberAuth(state, next);
  const url = new URL("https://wardogstracker.gg/api/connect");
  url.searchParams.set("client_id", config.trackerClientId);
  url.searchParams.set("redirect_uri", config.trackerRedirectUri);
  url.searchParams.set("state", state);
  return continueOffsite(reply, url.toString(), [
    cookieString("wd_next", encodeURIComponent(next), AUTH_COOKIE_AGE),
    cookieString("wd_wdt", state, AUTH_COOKIE_AGE),
  ]);
});

type Traded = {
  steamId?: string;
  synced?: boolean;
  errorCode?: string;
  player?: { steamId?: string; stats?: Parameters<typeof saveCareer>[1] };
};

async function tradeWardogsCode(code: string): Promise<{ fail: string; traded: Traded | null }> {
  let tokenStatus = 0;
  try {
    const response = await fetch("https://wardogstracker.gg/api/v1/connect/token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.trackerKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ code, redirect_uri: config.trackerRedirectUri }),
      signal: AbortSignal.timeout(120_000),
    });
    tokenStatus = response.status;
    const raw = await response.text();
    let traded: Traded | null = null;
    try {
      traded = raw ? JSON.parse(raw) as Traded : null;
    } catch {
      app.log.error({ tokenStatus, detail: raw.slice(0, 300) }, "wardogs token non-json");
      return { fail: `token_${tokenStatus || "err"}`, traded: null };
    }
    if (!response.ok) {
      const errCode = traded?.errorCode || "";
      const fail = errCode === "invalid_grant" ? "expired" : `token_${tokenStatus || "err"}`;
      app.log.error({ tokenStatus, errCode, detail: raw.slice(0, 300) }, "wardogs token exchange failed");
      return { fail, traded: null };
    }
    return { fail: "", traded };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || /aborted|timeout/i.test(error.message));
    const fail = timedOut ? "token_timeout" : "token_err";
    app.log.error({ err: error, fail }, "wardogs token exchange exception");
    return { fail, traded: null };
  }
}

async function finishWardogsJob(ticket: string) {
  if (loginBusy.has(ticket)) return;
  const job = await readLoginJob(ticket);
  if (!job || job.status !== "pending" || !job.code) return;
  loginBusy.add(ticket);
  try {
    const { fail, traded } = await tradeWardogsCode(job.code);
    const steamId = traded?.steamId || traded?.player?.steamId || "";
    if (!steamId || !/^\d{17}$/.test(steamId)) {
      await writeLoginJob({ ...job, code: "", status: "fail", fail: fail || "token_err" });
      return;
    }
    try {
      await upsertUser(steamId);
    } catch (error) {
      app.log.error(error);
      await writeLoginJob({ ...job, code: "", steamId, status: "fail", fail: "retry" });
      return;
    }
    const careerStats = traded?.player?.stats ?? null;
    let saved = false;
    try {
      saved = (await storeCareer(steamId, careerStats, "login", true)).ok;
    } catch (error) {
      app.log.error(error);
    }
    if (!saved) saved = await pullPublicCareer(steamId);
    const live = traded?.synced === true;
    await writeLoginJob({
      ...job,
      code: "",
      steamId,
      where: `/p/?id=${steamId}`,
      status: "ok",
      fail: "",
      flag: !saved ? (careerStats == null ? "game_running" : "empty") : live ? "" : "stale",
    });
  } finally {
    loginBusy.delete(ticket);
  }
}

app.get("/auth/wardogs", async (request, reply) => {
  const query = request.query as Record<string, unknown>;
  const state = text(query.state, 120);
  const code = text(query.code, 4000);
  const pendingNext = await takeAuth(state) || nextPath(request.headers.cookie, "/ratings");
  const where = loginNext(pendingNext);
  const failure = text(query.error_code, 40) || text(query.error, 40);
  if (failure && !code) {
    return reply.redirect(`${config.siteOrigin}${where}?sync=${encodeURIComponent(failure)}`);
  }
  if (!code) return reply.redirect(`${config.siteOrigin}${where}?sync=expired`);
  if (!config.trackerKey) {
    app.log.error("TRACKER_KEY empty on wardogs callback");
    return reply.redirect(`${config.siteOrigin}${where}?sync=token_cfg`);
  }
  const ticket = randomBytes(16).toString("hex");
  await writeLoginJob({ ticket, code, where, status: "pending", fail: "", steamId: "", flag: "" });
  void finishWardogsJob(ticket).catch(async (error) => {
    app.log.error(error);
    const job = await readLoginJob(ticket);
    if (job && job.status === "pending") {
      await writeLoginJob({ ...job, code: "", status: "fail", fail: "token_err" });
    }
  });
  writeCookies(reply, [
    cookieString("wd_login", ticket, AUTH_COOKIE_AGE),
    cookieString("wd_next", "", 0),
    cookieString("wd_wdt", "", 0),
  ]);
  const back = new URL(where, config.siteOrigin);
  back.searchParams.set("sync", "wait");
  back.searchParams.set("job", ticket);
  return reply.redirect(back.toString());
});

app.get("/api/auth/status", async (request, reply) => {
  const query = request.query as Record<string, unknown>;
  const ticket = text(query.job, 80) || readCookie(request.headers.cookie, "wd_login");
  const job = await readLoginJob(ticket);
  if (!job) return { status: "missing" };
  if (job.status === "pending") {
    void finishWardogsJob(ticket).catch((error) => app.log.error(error));
    return { status: "pending" };
  }
  if (job.status === "ok" && job.steamId) {
    writeCookies(reply, [
      cookieString("wd_login", "", 0),
      cookieString("wd_session", createSession(job.steamId), 14 * 24 * 3600),
    ]);
    return { status: "ok", steamId: job.steamId, flag: job.flag || "", next: `/p/?id=${job.steamId}` };
  }
  writeCookies(reply, [cookieString("wd_login", "", 0)]);
  return { status: "fail", sync: job.fail || "token_err", next: job.where };
});

app.get("/auth/steam/callback", async (request, reply) => {
  const steamId = await verifySteamLogin(request.query as Record<string, unknown>);
  if (!steamId) return reply.redirect(`${config.siteOrigin}/ratings?sync=expired`);
  try {
    await upsertUser(steamId);
  } catch (error) {
    app.log.error(error);
    return reply.redirect(`${config.siteOrigin}/ratings?sync=retry`);
  }
  ensureCareer(steamId).catch((error) => app.log.error(error));
  const pendingNext = await takeAuth(readCookie(request.headers.cookie, "wd_wdt"));
  const where = loginNext(pendingNext || nextPath(request.headers.cookie, "/ratings"));
  return finishLogin(reply, steamId, where, true);
});

app.get("/auth/logout", async (_request, reply) => {
  clearSession(reply);
  return reply.redirect(`${config.siteOrigin}/`);
});

app.post("/auth/logout", async (_request, reply) => {
  clearSession(reply);
  return { ok: true };
});

app.get("/auth/discord", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!steamId || !config.discordId) return notFound(reply);
  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", config.discordId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify");
  url.searchParams.set("redirect_uri", `${config.siteOrigin}/auth/discord/callback`);
  url.searchParams.set("state", steamId);
  return reply.redirect(url.toString());
});

app.get("/auth/discord/callback", async (request, reply) => {
  const steamId = steamIdOf(request);
  const query = request.query as Record<string, unknown>;
  const code = text(query.code, 200);
  if (!steamId || !config.discordId || !config.discordSecret || query.state !== steamId || !code) return notFound(reply);
  const body = new URLSearchParams({
    client_id: config.discordId,
    client_secret: config.discordSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: `${config.siteOrigin}/auth/discord/callback`,
  });
  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenResponse.ok) return notFound(reply);
  const token = (await tokenResponse.json()) as { access_token?: string };
  const userResponse = await fetch("https://discord.com/api/users/@me", {
    headers: { authorization: `Bearer ${token.access_token}` },
  });
  if (!userResponse.ok) return notFound(reply);
  const discord = (await userResponse.json()) as { id?: string; username?: string };
  if (!discord.id) return notFound(reply);
  await sql`UPDATE users SET discord_id = ${discord.id}, discord_name = ${discord.username ?? null} WHERE steam_id = ${steamId}`;
  return reply.redirect(`${config.siteOrigin}/p?id=${steamId}`);
});

app.get("/api/me", async (request) => {
  const steamId = steamIdOf(request);
  if (!steamId) return { user: null };
  const rows = await sql<Array<Record<string, unknown>>>`
    SELECT u.steam_id, u.persona, u.avatar, u.country, u.cis_opt_in, u.hide_leaderboard,
           u.discord_name, u.motto, u.accent, s.status AS sync_status, s.expires_at
    FROM users u
    LEFT JOIN sync_sessions s ON s.steam_id = u.steam_id
    WHERE u.steam_id = ${steamId}
  `;
  const admin = await isAdmin(steamId);
  return {
    user: rows[0] ?? null,
    admin,
    adminPath: admin ? `/g/${config.adminPath}` : "",
    discordLink: Boolean(config.discordId && config.discordSecret),
    careerConnect: Boolean(config.trackerKey && config.trackerClientId),
  };
});

app.post("/api/me/sync", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!steamId) return reply.code(401).send({ error: "steam" });
  const body = asObject(request.body);
  const brought = body?.player && typeof body.player === "object" ? body.player as Record<string, unknown> : null;
  const broughtId = brought && typeof brought.steamId === "string" ? brought.steamId : "";
  if (brought && broughtId === steamId && playerStats({ player: brought })) {
    const result = await applyCareer(steamId, { player: brought }, "tracker");
    return { ok: true, ...result };
  }
  const result = await refreshCareer(steamId);
  return { ok: true, ...result };
});

app.patch("/api/me", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!steamId) return reply.code(401).send({ error: "steam" });
  const body = asObject(request.body);
  if (!body) return reply.code(400).send({ error: "bad_request" });
  const accent = typeof body.accent === "string" ? text(body.accent, 16) : undefined;
  if (accent && !PROFILE_ACCENTS.has(accent)) return reply.code(400).send({ error: "bad_request" });
  // Один смысл: showInTop=true → в рейтинге; false → скрыт. cis_opt_in держим 1, пока сам не вышел.
  if (typeof body.showInTop === "boolean") {
    if (body.showInTop) {
      await sql`UPDATE users SET cis_opt_in = 1, hide_leaderboard = 0 WHERE steam_id = ${steamId}`;
    } else {
      await sql`UPDATE users SET hide_leaderboard = 1 WHERE steam_id = ${steamId}`;
    }
  } else {
    if (typeof body.cisOptIn === "boolean") {
      await sql`UPDATE users SET cis_opt_in = ${body.cisOptIn} WHERE steam_id = ${steamId}`;
    }
    if (typeof body.hideLeaderboard === "boolean") {
      await sql`UPDATE users SET hide_leaderboard = ${body.hideLeaderboard} WHERE steam_id = ${steamId}`;
    }
  }
  if (typeof body.motto === "string") {
    const motto = text(body.motto, 80).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
    await sql`UPDATE users SET motto = ${motto || null} WHERE steam_id = ${steamId}`;
  }
  if (accent !== undefined) {
    await sql`UPDATE users SET accent = ${accent || null} WHERE steam_id = ${steamId}`;
  }
  return { ok: true };
});

app.post("/api/events", async (request, reply) => {
  const body = asObject(request.body);
  if (!body || !PUBLIC_EVENTS.has(String(body.name))) return reply.code(400).send({ error: "bad_request" });
  const visitor = text(body.visitorId, 64);
  const now = Date.now();
  const bucket = hits.get(visitor || "anon") ?? { n: 0, at: now };
  if (now - bucket.at > 60_000) {
    bucket.n = 0;
    bucket.at = now;
  }
  bucket.n += 1;
  hits.set(visitor || "anon", bucket);
  if (bucket.n > 60) return reply.code(429).send({ error: "rate" });
  await sql`
    INSERT INTO events (name, steam_id, visitor_id, path, utm_source, utm_medium, utm_campaign)
    VALUES (
      ${String(body.name)},
      ${steamIdOf(request)},
      ${visitor || null},
      ${text(body.path, 200) || null},
      ${text(body.utmSource, 80) || null},
      ${text(body.utmMedium, 80) || null},
      ${text(body.utmCampaign, 80) || null}
    )
  `;
  return { ok: true };
});

app.get("/api/ratings", async (request) => {
  const query = request.query as Record<string, unknown>;
  const sort = SORTS[text(query.sort, 20)] ? text(query.sort, 20) : "level";
  const column = SORTS[sort];
  const season = text(query.season, 20) || config.season;
  const q = text(query.q, 40).replace(/[%_]/g, "");
  if (!/^[a-z_]+$/.test(column)) return { season, sort, players: [] };
  // Снимок сезона или игрок, которого видели на нашем сервере. Скрытый профиль сайта не показываем.
  const rows = await sql.unsafe(
    `SELECT ids.steam_id, COALESCE(s.season, ?) AS season, s.wardog_level, s.xp, s.account_value, s.cash, s.gold, s.unlocks,
            s.role_assault, s.role_medic, s.role_recon, s.role_support, s.role_driver, s.role_pilot,
            s.created_at, COALESCE(u.persona, c.persona) AS persona, COALESCE(u.avatar, c.avatar) AS avatar, u.country,
            c.kills AS server_kills, c.deaths AS server_deaths, c.faction AS server_faction,
            CASE
              WHEN c.steam_id IS NULL THEN NULL
              WHEN c.deaths = 0 THEN c.kills
              ELSE ROUND(c.kills / c.deaths, 2)
            END AS server_kd
     FROM (
       SELECT u.steam_id
       FROM users u
       JOIN (
         SELECT steam_id, MAX(created_at) AS created_at
         FROM snapshots
         WHERE season = ?
         GROUP BY steam_id
       ) latest ON latest.steam_id = u.steam_id
       WHERE u.hide_leaderboard = 0 AND u.cis_opt_in = 1
       UNION
       SELECT c.steam_id
       FROM server_combat c
       LEFT JOIN users u ON u.steam_id = c.steam_id
       WHERE u.steam_id IS NULL OR (u.hide_leaderboard = 0 AND u.cis_opt_in = 1)
     ) ids
     LEFT JOIN users u ON u.steam_id = ids.steam_id
     LEFT JOIN (
       SELECT s.*
       FROM snapshots s
       JOIN (
         SELECT steam_id, MAX(created_at) AS created_at
         FROM snapshots
         WHERE season = ?
         GROUP BY steam_id
       ) latest ON latest.steam_id = s.steam_id AND latest.created_at = s.created_at
       WHERE s.season = ?
     ) s ON s.steam_id = ids.steam_id
     LEFT JOIN server_combat c ON c.steam_id = ids.steam_id
     WHERE (? = '' OR COALESCE(u.persona, c.persona) LIKE ? OR ids.steam_id LIKE ?)
     ORDER BY \`${column}\` IS NULL, \`${column}\` DESC, xp IS NULL, xp DESC, COALESCE(u.persona, c.persona) ASC
     LIMIT 200`,
    [season, season, season, season, q, `%${q}%`, `%${q}%`],
  );
  return { season, sort, players: rows };
});

app.get("/api/players/:steamId", async (request, reply) => {
  const steamId = (request.params as { steamId: string }).steamId;
  if (!/^\d{17}$/.test(steamId)) return notFound(reply);
  const users = await sql<Array<Record<string, unknown>>>`
    SELECT steam_id, persona, avatar, country, cis_opt_in, hide_leaderboard, discord_name, motto, accent, created_at
    FROM users WHERE steam_id = ${steamId}
  `;
  if (!users.length) {
    const seen = await sql<Array<Record<string, unknown>>>`
      SELECT steam_id, persona, avatar, kills, deaths, faction,
             CASE WHEN deaths = 0 THEN kills ELSE ROUND(kills / deaths, 2) END AS kd
      FROM server_combat WHERE steam_id = ${steamId}
    `;
    if (!seen.length) return notFound(reply);
    const combat = seen[0];
    return {
      user: {
        steam_id: steamId,
        persona: combat.persona,
        avatar: combat.avatar,
        country: null,
        cis_opt_in: 1,
        hide_leaderboard: 0,
        discord_name: null,
        motto: null,
        accent: null,
      },
      history: [],
      combat,
      squad: null,
      sync: null,
    };
  }
  const history = await sql`
    SELECT created_at, wardog_level, xp, cash, gold, unlocks, account_value,
           role_assault, role_medic, role_recon, role_support, role_driver, role_pilot, source
    FROM snapshots
    WHERE steam_id = ${steamId}
    ORDER BY created_at ASC
    LIMIT 60
  `;
  const squads = await sql<Array<{ id: number; name: string; tag: string; role: string; status: string; logo_path: string | null; banner_path: string | null }>>`
    SELECT sq.id, sq.name, sq.tag, sq.logo_path, sq.banner_path, m.role, m.status
    FROM squad_members m
    JOIN squads sq ON sq.id = m.squad_id
    WHERE m.steam_id = ${steamId} AND m.status = 'member' AND sq.status = 'approved'
    LIMIT 1
  `;
  const combatRows = await sql<Array<{ kills: number; deaths: number; kd: number | string | null; faction: string | null }>>`
    SELECT kills, deaths, faction,
           CASE WHEN deaths = 0 THEN kills ELSE ROUND(kills / deaths, 2) END AS kd
    FROM server_combat
    WHERE steam_id = ${steamId}
  `;
  const sync = await sql`SELECT status, expires_at, updated_at FROM sync_sessions WHERE steam_id = ${steamId}`;
  const picture = (file: string | null) => file && /^[a-f0-9]{32}\.(jpg|png|webp)$/.test(file) ? `/api/media/${file}` : "";
  const squad = squads[0];
  return {
    user: users[0],
    history,
    combat: combatRows[0] ?? null,
    squad: squad ? {
      id: squad.id,
      name: squad.name,
      tag: squad.tag,
      role: squad.role,
      logo: picture(squad.logo_path),
      banner: picture(squad.banner_path),
    } : null,
    sync: sync[0] ?? null,
  };
});

app.post("/api/bot/link", async (request, reply) => {
  if (!botAuthorized(request)) return notFound(reply);
  const body = asObject(request.body);
  const steamId = text(body?.steamId, 20);
  const discordId = text(body?.discordId, 32);
  const discordName = text(body?.discordName, 80);
  if (!/^\d{17}$/.test(steamId) || !/^\d{5,32}$/.test(discordId)) {
    return reply.code(400).send({ error: "bad_request" });
  }
  await upsertBotUser(steamId, discordId, discordName);
  const wantPull = body?.pull !== false;
  const pulled = wantPull ? await ensureCareer(steamId) : false;
  const joinedFob = await joinFobSquad(steamId);
  const payload = await botPlayerPayload(steamId);
  return { ok: true, pulled, joinedFob, ...payload };
});

app.get("/api/bot/player/:steamId", async (request, reply) => {
  if (!botAuthorized(request)) return notFound(reply);
  const steamId = (request.params as { steamId: string }).steamId;
  if (!/^\d{17}$/.test(steamId)) return reply.code(400).send({ error: "bad_request" });
  const payload = await botPlayerPayload(steamId);
  if (!payload) return notFound(reply);
  return payload;
});

app.post("/api/bot/refresh/:steamId", async (request, reply) => {
  if (!botAuthorized(request)) return notFound(reply);
  const steamId = (request.params as { steamId: string }).steamId;
  if (!/^\d{17}$/.test(steamId)) return reply.code(400).send({ error: "bad_request" });
  const known = await sql`SELECT steam_id FROM users WHERE steam_id = ${steamId}`;
  if (!known.length) return notFound(reply);
  const pulled = await ensureCareer(steamId);
  const payload = await botPlayerPayload(steamId);
  return { ok: true, pulled, ...payload };
});

app.get("/api/bot/board", async (request, reply) => {
  if (!botAuthorized(request)) return notFound(reply);
  const query = request.query as Record<string, unknown>;
  const sort = SORTS[text(query.sort, 20)] ? text(query.sort, 20) : "level";
  const column = SORTS[sort];
  const season = text(query.season, 20) || config.season;
  const fobOnly = text(query.fob, 8) === "1" || text(query.fob, 8).toLowerCase() === "true";
  if (!/^[a-z_]+$/.test(column)) return { season, sort, players: [] };
  const rows = await sql.unsafe(
    `SELECT u.steam_id, COALESCE(s.season, ?) AS season, s.wardog_level, s.xp, s.account_value, s.cash, s.gold, s.unlocks,
            s.role_assault, s.role_medic, s.role_recon, s.role_support, s.role_driver, s.role_pilot,
            s.created_at, u.persona, u.avatar, u.country, u.discord_id, u.discord_name
     FROM users u
     JOIN (
       SELECT s.*
       FROM snapshots s
       JOIN (
         SELECT steam_id, MAX(created_at) AS created_at
         FROM snapshots
         WHERE season = ?
         GROUP BY steam_id
       ) latest ON latest.steam_id = s.steam_id AND latest.created_at = s.created_at
       WHERE s.season = ?
     ) s ON s.steam_id = u.steam_id
     WHERE u.hide_leaderboard = 0 AND u.cis_opt_in = 1
       AND (
         ? = 0 OR EXISTS (
           SELECT 1 FROM squad_members m
           JOIN squads sq ON sq.id = m.squad_id
           WHERE m.steam_id = u.steam_id AND m.status = 'member'
             AND sq.status = 'approved' AND UPPER(sq.tag) = 'FOB'
         )
       )
     ORDER BY \`${column}\` IS NULL, \`${column}\` DESC, xp IS NULL, xp DESC, u.persona ASC
     LIMIT 200`,
    [season, season, season, fobOnly ? 1 : 0],
  );
  return {
    season,
    sort,
    players: rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      primaryClass: primaryClassOf(row),
    })),
  };
});

app.post("/api/bot/import", async (request, reply) => {
  if (!botAuthorized(request)) return notFound(reply);
  const body = asObject(request.body);
  const players = Array.isArray(body?.players) ? body.players : [];
  if (!players.length || players.length > 500) return reply.code(400).send({ error: "bad_request" });
  const wantPull = body?.pull !== false;
  const results: Array<{ steamId: string; ok: boolean; pulled: boolean; primaryClass: string | null }> = [];
  for (const item of players) {
    const row = asObject(item);
    const steamId = text(row?.steamId, 20);
    const discordId = text(row?.discordId, 32);
    const discordName = text(row?.discordName, 80);
    if (!/^\d{17}$/.test(steamId)) {
      results.push({ steamId, ok: false, pulled: false, primaryClass: null });
      continue;
    }
    await upsertBotUser(steamId, discordId, discordName);
    const pulled = wantPull ? await ensureCareer(steamId) : false;
    await joinFobSquad(steamId);
    const payload = await botPlayerPayload(steamId);
    results.push({ steamId, ok: true, pulled, primaryClass: payload?.primaryClass ?? null });
  }
  return { ok: true, count: results.length, results };
});

app.post("/api/internal/sync", async (request, reply) => {
  if (!config.syncKey || request.headers["x-sync-key"] !== config.syncKey) return notFound(reply);
  const body = asObject(request.body);
  const steamId = text(body?.steamId, 20);
  if (!body || !/^\d{17}$/.test(steamId)) return reply.code(400).send({ error: "bad_request" });
  const known = await sql`SELECT steam_id FROM users WHERE steam_id = ${steamId}`;
  if (!known.length) return notFound(reply);
  const roles = asObject(body.roles) ?? {};
  const fields = {
    level: whole(body.wardogLevel, 1000),
    xp: whole(body.xp, 50_000_000_000),
    value: whole(body.accountValue, 50_000_000_000),
    cash: whole(body.cash, 50_000_000_000),
    gold: whole(body.gold, 1_000_000),
    unlocks: whole(body.unlocks, 100_000),
    assault: whole(roles.assault, 1000),
    medic: whole(roles.medic, 1000),
    recon: whole(roles.recon, 1000),
    support: whole(roles.support, 1000),
    driver: whole(roles.driver, 1000),
    pilot: whole(roles.pilot, 1000),
  };
  const clean: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) return reply.code(400).send({ error: "bad_request" });
    clean[key] = value;
  }
  const expires = text(body.sessionExpiresAt, 40);
  const parsed = expires ? new Date(expires) : null;
  const expiry = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  await sql`
    INSERT INTO snapshots (
      steam_id, season, wardog_level, xp, account_value, cash, gold, unlocks,
      role_assault, role_medic, role_recon, role_support, role_driver, role_pilot, source
    ) VALUES (
      ${steamId}, ${text(body.season, 20) || config.season}, ${clean.level}, ${clean.xp}, ${clean.value},
      ${clean.cash}, ${clean.gold}, ${clean.unlocks}, ${clean.assault}, ${clean.medic}, ${clean.recon},
      ${clean.support}, ${clean.driver}, ${clean.pilot}, 'helper'
    )
  `;
  const status = expiry && expiry.getTime() > Date.now() ? "active" : "expired";
  await sql`
    INSERT INTO sync_sessions (steam_id, status, expires_at, updated_at)
    VALUES (${steamId}, ${status}, ${expiry}, now())
    ON DUPLICATE KEY UPDATE
      status = VALUES(status), expires_at = VALUES(expires_at), updated_at = NOW()
  `;
  return { ok: true };
});

app.get("/api/squad-ads", async () => {
  const rows = await sql<{ id: number; name: string; tag: string; banner_path: string; discord_url: string }[]>`
    SELECT id, name, tag, banner_path, discord_url
    FROM squads
    WHERE status = 'approved' AND banner_path IS NOT NULL AND discord_url <> ''
    ORDER BY id
  `;
  return {
    ads: rows.map((row) => ({
      id: row.id,
      name: row.name,
      tag: row.tag,
      image: `/api/media/${row.banner_path}`,
      href: row.discord_url,
    })),
  };
});

app.get("/api/media/:file", async (request, reply) => {
  const file = (request.params as { file: string }).file;
  const media = readMedia(file);
  if (!media) return notFound(reply);
  const rows = await sql<{ status: string; owner_steam_id: string; squad_status: string; banner_path: string | null; logo_path: string | null }[]>`
    SELECT a.status, sq.owner_steam_id, sq.status AS squad_status, sq.banner_path, sq.logo_path
    FROM squad_assets a
    JOIN squads sq ON sq.id = a.squad_id
    WHERE a.path = ${file}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return notFound(reply);
  const live = row.squad_status === "approved" && (row.banner_path === file || row.logo_path === file);
  if (!live) {
    const steamId = steamIdOf(request);
    const owner = steamId !== null && steamId === row.owner_steam_id && row.status === "pending";
    if (!owner && !(row.status === "pending" && await isAdmin(steamId))) return notFound(reply);
    reply.header("cache-control", "private, no-store");
  } else {
    reply.header("cache-control", "public, max-age=3600");
  }
  reply.header("content-type", media.type);
  return reply.send(media.bytes);
});

app.get("/api/squads", async (request) => {
  const steamId = steamIdOf(request);
  const rows = await sql`
    SELECT sq.id, sq.name, sq.tag, sq.closed, sq.status, sq.about, sq.criteria, sq.discord_url, sq.logo_path, u.persona AS owner_name,
           (SELECT CAST(COUNT(*) AS SIGNED) FROM squad_members m WHERE m.squad_id = sq.id AND m.status = 'member') AS members
    FROM squads sq
    JOIN users u ON u.steam_id = sq.owner_steam_id
    WHERE sq.status = 'approved' OR sq.owner_steam_id = ${steamId ?? ""}
    ORDER BY sq.created_at DESC
    LIMIT 100
  `;
  const mine = steamId
    ? await sql`SELECT squad_id, status, role FROM squad_members WHERE steam_id = ${steamId}`
    : [];
  const deskRows = steamId
    ? await sql<{ id: number; name: string; tag: string; status: string; about: string; criteria: string; discord_url: string; closed: boolean; logo_path: string | null; banner_path: string | null }[]>`
      SELECT id, name, tag, status, about, criteria, discord_url, closed, logo_path, banner_path
      FROM squads
      WHERE owner_steam_id = ${steamId}
      LIMIT 1
    `
    : [];
  const desk = deskRows[0] ?? null;
  const pending = desk
    ? await sql<{ kind: string; status: string }[]>`
      SELECT kind, status FROM squad_assets WHERE squad_id = ${desk.id} AND status = 'pending'
    `
    : [];
  return {
    squads: rows.map((row) => ({ ...row, logo: row.logo_path ? `/api/media/${row.logo_path}` : "" })),
    mine,
    desk: desk ? { ...desk, pending } : null,
  };
});

app.post("/api/squads", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!steamId) return reply.code(401).send({ error: "steam" });
  const body = asObject(request.body);
  const name = text(body?.name, 32);
  const tag = text(body?.tag, 6).toUpperCase();
  const about = text(body?.about, 700);
  const criteria = text(body?.criteria, 700);
  if (name.length < 3 || !/^[A-Z0-9]{2,5}$/.test(tag) || about.length < 20 || criteria.length < 10) return reply.code(400).send({ error: "bad_request" });
  const existing = await sql`SELECT 1 FROM squad_members WHERE steam_id = ${steamId}`;
  if (existing.length) return reply.code(400).send({ error: "already" });
  const created = await sql<{ id: number }[]>`
    INSERT INTO squads (name, tag, owner_steam_id, about, criteria) VALUES (${name}, ${tag}, ${steamId}, ${about}, ${criteria})
  `;
  await sql`
    INSERT INTO squad_members (squad_id, steam_id, role, status)
    VALUES (${created[0].id}, ${steamId}, 'leader', 'member')
  `;
  await sql`INSERT INTO events (name, steam_id) VALUES ('squad_create', ${steamId})`;
  return { id: created[0].id };
});

app.post("/api/squads/:id/join", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!steamId) return reply.code(401).send({ error: "steam" });
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id)) return reply.code(400).send({ error: "bad_request" });
  const squad = await sql`SELECT id, closed, status FROM squads WHERE id = ${id}`;
  if (!squad.length || squad[0].status !== "approved") return notFound(reply);
  if (squad[0].closed) return reply.code(400).send({ error: "closed" });
  try {
    await sql.begin(async (tx) => {
      const seat = await tx<{ squad_id: number; status: string }[]>`
        SELECT squad_id, status FROM squad_members WHERE steam_id = ${steamId} FOR UPDATE
      `;
      const taken = seat.find((row) => row.status === "member");
      if (taken && Number(taken.squad_id) !== id) throw new Error("already");
      if (taken) return;
      await tx`DELETE FROM squad_members WHERE steam_id = ${steamId}`;
      await tx`
        INSERT INTO squad_members (squad_id, steam_id, role, status)
        VALUES (${id}, ${steamId}, 'member', 'member')
      `;
    });
  } catch (error) {
    const errno = typeof error === "object" && error && "errno" in error ? Number(error.errno) : 0;
    if (errno === 1062 || (error instanceof Error && error.message === "already")) {
      return reply.code(400).send({ error: "already" });
    }
    throw error;
  }
  return { ok: true };
});

app.post("/api/squads/:id/report", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!steamId) return reply.code(401).send({ error: "steam" });
  const id = Number((request.params as { id: string }).id);
  const body = asObject(request.body);
  const target = text(body?.steamId, 20);
  const note = text(body?.note, 400);
  if (!Number.isInteger(id) || !/^\d{17}$/.test(target) || note.length < 10) return reply.code(400).send({ error: "bad_request" });
  if (target === steamId) return reply.code(400).send({ error: "self" });
  const squad = await sql`SELECT id FROM squads WHERE id = ${id} AND status = 'approved'`;
  if (!squad.length) return notFound(reply);
  const member = await sql`
    SELECT 1 FROM squad_members
    WHERE squad_id = ${id} AND steam_id = ${target} AND status = 'member'
  `;
  if (!member.length) return reply.code(400).send({ error: "not_member" });
  const recent = await sql`
    SELECT 1 FROM squad_reports
    WHERE squad_id = ${id} AND target_steam_id = ${target} AND reporter_steam_id = ${steamId}
      AND created_at > NOW(3) - INTERVAL 7 DAY
  `;
  if (recent.length) return reply.code(400).send({ error: "duplicate" });
  await sql`
    INSERT INTO squad_reports (squad_id, target_steam_id, reporter_steam_id, note)
    VALUES (${id}, ${target}, ${steamId}, ${note})
  `;
  await sql`INSERT INTO events (name, steam_id) VALUES ('squad_report', ${steamId})`;
  return { ok: true };
});

app.post("/api/squads/:id/decide", async (request, reply) => {
  const steamId = steamIdOf(request);
  const id = Number((request.params as { id: string }).id);
  const body = asObject(request.body);
  const target = text(body?.steamId, 20);
  if (!steamId || !/^\d{17}$/.test(target) || !body) return reply.code(400).send({ error: "bad_request" });
  const squad = await sql`SELECT owner_steam_id FROM squads WHERE id = ${id}`;
  if (!squad.length || squad[0].owner_steam_id !== steamId) return notFound(reply);
  if (body.accept === true) {
    const member = await sql`SELECT 1 FROM squad_members WHERE steam_id = ${target} AND status = 'member'`;
    if (member.length) return reply.code(400).send({ error: "already" });
    await sql`UPDATE squad_members SET status = 'member' WHERE squad_id = ${id} AND steam_id = ${target}`;
  } else {
    await sql`DELETE FROM squad_members WHERE squad_id = ${id} AND steam_id = ${target} AND status = 'pending'`;
  }
  return { ok: true };
});

app.post("/api/squads/:id/profile", async (request, reply) => {
  const steamId = steamIdOf(request);
  const id = Number((request.params as { id: string }).id);
  if (!steamId || !Number.isInteger(id)) return reply.code(401).send({ error: "steam" });
  const body = asObject(request.body);
  if (!body) return reply.code(400).send({ error: "bad_request" });
  const name = text(body.name, 32);
  const tag = text(body.tag, 6).toUpperCase();
  const about = text(body.about, 700);
  const criteria = text(body.criteria, 700);
  const discordRaw = text(body.discord, 200);
  const discord = discordRaw ? discordInvite(discordRaw) : "";
  const closed = body.closed === true;
  if (name.length < 3 || !/^[A-Z0-9]{2,5}$/.test(tag) || about.length < 20 || criteria.length < 10 || (discordRaw && !discord)) {
    return reply.code(400).send({ error: "bad_request" });
  }
  const owned = await sql`SELECT id FROM squads WHERE id = ${id} AND owner_steam_id = ${steamId}`;
  if (!owned.length) return notFound(reply);
  await sql`
    UPDATE squads
    SET name = ${name}, tag = ${tag}, about = ${about}, criteria = ${criteria}, discord_url = ${discord}, closed = ${closed}
    WHERE id = ${id}
  `;
  return { ok: true };
});

app.get("/api/squads/:id", async (request, reply) => {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id)) return notFound(reply);
  const viewer = steamIdOf(request);
  const rows = await sql`
    SELECT sq.id, sq.name, sq.tag, sq.closed, sq.status, sq.about, sq.criteria, sq.discord_url,
           sq.logo_path, sq.banner_path, sq.owner_steam_id, u.persona AS owner_name,
           (SELECT CAST(COUNT(*) AS SIGNED) FROM squad_members m WHERE m.squad_id = sq.id AND m.status = 'member') AS members
    FROM squads sq
    JOIN users u ON u.steam_id = sq.owner_steam_id
    WHERE sq.id = ${id}
  `;
  const squad = rows[0];
  if (!squad || (squad.status !== "approved" && squad.owner_steam_id !== viewer)) return notFound(reply);
  const members = await sql`
    SELECT m.steam_id, m.role, m.status, u.persona, u.avatar
    FROM squad_members m
    JOIN users u ON u.steam_id = m.steam_id
    WHERE m.squad_id = ${id} AND (m.status = 'member' OR ${viewer} = ${squad.owner_steam_id})
    ORDER BY m.role = 'leader' DESC, u.persona
  `;
  const seatRows = viewer
    ? await sql<{ squad_id: number; status: string }[]>`
      SELECT squad_id, status FROM squad_members WHERE steam_id = ${viewer} AND status = 'member' LIMIT 1
    `
    : [];
  return {
    squad: {
      ...squad,
      logo: squad.logo_path ? `/api/media/${squad.logo_path}` : "",
      banner: squad.banner_path ? `/api/media/${squad.banner_path}` : "",
    },
    members,
    mine: viewer === squad.owner_steam_id,
    seat: seatRows[0] ?? null,
  };
});

app.post("/api/squads/:id/assets", async (request, reply) => {
  const steamId = steamIdOf(request);
  const id = Number((request.params as { id: string }).id);
  if (!steamId || !Number.isInteger(id)) return reply.code(401).send({ error: "steam" });
  const body = asObject(request.body);
  const kind = body?.kind === "banner" ? "banner" : body?.kind === "logo" ? "logo" : "";
  if (!kind || !body) return reply.code(400).send({ error: "bad_request" });
  const invite = kind === "banner" ? discordInvite(text(body.discord, 200)) : "";
  if (kind === "banner" && !invite) return reply.code(400).send({ error: "discord" });
  const image = imageFile(text(body.image, 1_800_000));
  if (!image) return reply.code(400).send({ error: "image" });
  const owned = await sql`SELECT id FROM squads WHERE id = ${id} AND owner_steam_id = ${steamId}`;
  if (!owned.length) return notFound(reply);
  const file = saveMedia(image.bytes, image.ext);
  try {
    await sql.begin(async (tx) => {
      await tx`
        UPDATE squad_assets SET status = 'replaced'
        WHERE squad_id = ${id} AND kind = ${kind} AND status = 'pending'
      `;
      await tx`
        INSERT INTO squad_assets (squad_id, kind, path, discord_url, status)
        VALUES (${id}, ${kind}, ${file}, ${invite}, 'pending')
      `;
    });
  } catch (error) {
    removeMedia(file);
    throw error;
  }
  return { ok: true };
});

app.get("/api/builds", async (request) => {
  const asked = text((request.query as Record<string, unknown>).season, 8);
  const season = asked === "all" ? "" : /^\d{2}$/.test(asked) ? asked : config.season;
  const seasons = await sql<{ season: string }[]>`
    SELECT DISTINCT season FROM builds WHERE NOT hidden ORDER BY season DESC
  `;
  const rows = season
    ? await sql`
      SELECT b.id, b.title, b.summary, b.code, b.season, b.created_at, u.persona, u.steam_id,
        (SELECT CAST(COUNT(*) AS SIGNED) FROM build_votes v WHERE v.build_id = b.id AND v.useful) AS useful,
        (SELECT CAST(COUNT(*) AS SIGNED) FROM build_votes v WHERE v.build_id = b.id AND NOT v.useful) AS useless,
        (SELECT CAST(COUNT(*) AS SIGNED) FROM build_notes n WHERE n.build_id = b.id AND n.kind = 'comment') AS comments,
        (SELECT CAST(COUNT(*) AS SIGNED) FROM build_notes n WHERE n.build_id = b.id AND n.kind = 'review') AS reviews
      FROM builds b
      JOIN users u ON u.steam_id = b.steam_id
      WHERE NOT b.hidden AND b.season = ${season}
      ORDER BY useful DESC, reviews DESC, b.created_at DESC
      LIMIT 50
    `
    : await sql`
      SELECT b.id, b.title, b.summary, b.code, b.season, b.created_at, u.persona, u.steam_id,
        (SELECT CAST(COUNT(*) AS SIGNED) FROM build_votes v WHERE v.build_id = b.id AND v.useful) AS useful,
        (SELECT CAST(COUNT(*) AS SIGNED) FROM build_votes v WHERE v.build_id = b.id AND NOT v.useful) AS useless,
        (SELECT CAST(COUNT(*) AS SIGNED) FROM build_notes n WHERE n.build_id = b.id AND n.kind = 'comment') AS comments,
        (SELECT CAST(COUNT(*) AS SIGNED) FROM build_notes n WHERE n.build_id = b.id AND n.kind = 'review') AS reviews
      FROM builds b
      JOIN users u ON u.steam_id = b.steam_id
      WHERE NOT b.hidden
      ORDER BY useful DESC, reviews DESC, b.created_at DESC
      LIMIT 50
    `;
  const known = seasons.map((row) => row.season);
  if (!known.includes(config.season)) known.unshift(config.season);
  return { season: season || "all", current: config.season, seasons: known, builds: rows };
});

app.get("/api/builds/:id", async (request, reply) => {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) return notFound(reply);
  const [build] = await sql`
    SELECT b.id, b.title, b.summary, b.season, b.code, b.created_at, b.steam_id, u.persona, u.avatar,
      (SELECT CAST(COUNT(*) AS SIGNED) FROM build_votes v WHERE v.build_id = b.id AND v.useful) AS useful,
      (SELECT CAST(COUNT(*) AS SIGNED) FROM build_votes v WHERE v.build_id = b.id AND NOT v.useful) AS useless
    FROM builds b
    JOIN users u ON u.steam_id = b.steam_id
    WHERE b.id = ${id} AND NOT b.hidden
  `;
  if (!build) return notFound(reply);
  const notes = await sql`
    SELECT n.id, n.kind, n.body, n.created_at, u.persona, u.steam_id
    FROM build_notes n
    JOIN users u ON u.steam_id = n.steam_id
    WHERE n.build_id = ${id}
    ORDER BY n.created_at
  `;
  const steamId = steamIdOf(request);
  const [mine] = steamId
    ? await sql<{ useful: boolean }[]>`SELECT useful FROM build_votes WHERE build_id = ${id} AND steam_id = ${steamId}`
    : [];
  return { build, notes, current: config.season, mine: steamId, myVote: mine?.useful ?? null };
});

app.post("/api/builds", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!steamId) return reply.code(401).send({ error: "login" });
  const body = asObject(request.body);
  const title = text(body?.title, 60).replace(/\s+/g, " ");
  const summary = text(body?.summary, 160).replace(/\s+/g, " ");
  const code = loadoutCode(body?.code);
  if (title.length < 3 || !code) return reply.code(400).send({ error: "bad_request" });
  const bucket = hits.get(`build:${steamId}`) ?? { n: 0, at: Date.now() };
  if (Date.now() - bucket.at > 60_000) {
    bucket.n = 0;
    bucket.at = Date.now();
  }
  bucket.n += 1;
  hits.set(`build:${steamId}`, bucket);
  if (bucket.n > 8) return reply.code(429).send({ error: "rate" });
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO builds (steam_id, season, title, summary, code)
    VALUES (${steamId}, ${config.season}, ${title}, ${summary}, ${code})
  `;
  await sql`INSERT INTO events (name, steam_id, path) VALUES ('build_publish', ${steamId}, ${`/b?id=${row?.id ?? ""}`})`;
  return { id: row?.id, season: config.season };
});

app.delete("/api/builds/:id", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!steamId) return reply.code(401).send({ error: "login" });
  const id = Number((request.params as { id: string }).id);
  const rows = await sql`DELETE FROM builds WHERE id = ${id} AND steam_id = ${steamId}`;
  if (!rows.length) return notFound(reply);
  return { ok: true };
});

app.post("/api/builds/:id/vote", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!steamId) return reply.code(401).send({ error: "login" });
  const id = Number((request.params as { id: string }).id);
  const useful = asObject(request.body)?.useful;
  if (typeof useful !== "boolean") return reply.code(400).send({ error: "bad_request" });
  const [build] = await sql<{ steam_id: string }[]>`SELECT steam_id FROM builds WHERE id = ${id} AND NOT hidden`;
  if (!build) return notFound(reply);
  if (build.steam_id === steamId) return reply.code(400).send({ error: "own" });
  await sql`
    INSERT INTO build_votes (build_id, steam_id, useful)
    VALUES (${id}, ${steamId}, ${useful})
    ON DUPLICATE KEY UPDATE useful = VALUES(useful), created_at = NOW()
  `;
  return { ok: true };
});

app.post("/api/builds/:id/notes", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!steamId) return reply.code(401).send({ error: "login" });
  const id = Number((request.params as { id: string }).id);
  const body = asObject(request.body);
  const kind = body?.kind === "review" ? "review" : body?.kind === "comment" ? "comment" : "";
  const note = text(body?.body, kind === "review" ? 1200 : 400).replace(/\s+/g, " ");
  if (!kind || (kind === "review" ? note.length < 20 : note.length < 2)) return reply.code(400).send({ error: "bad_request" });
  const [build] = await sql`SELECT id FROM builds WHERE id = ${id} AND NOT hidden`;
  if (!build) return notFound(reply);
  const bucket = hits.get(`note:${steamId}`) ?? { n: 0, at: Date.now() };
  if (Date.now() - bucket.at > 60_000) {
    bucket.n = 0;
    bucket.at = Date.now();
  }
  bucket.n += 1;
  hits.set(`note:${steamId}`, bucket);
  if (bucket.n > 10) return reply.code(429).send({ error: "rate" });
  await sql`
    INSERT INTO build_notes (build_id, steam_id, kind, body)
    VALUES (${id}, ${steamId}, ${kind}, ${note})
  `;
  return { ok: true };
});

app.get("/api/admin/session", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!(await isAdmin(steamId))) return notFound(reply);
  return { ok: true, steamId };
});

app.post("/api/admin/invites/redeem", async (request, reply) => {
  const steamId = steamIdOf(request);
  const token = text(asObject(request.body)?.token, 80);
  if (!steamId || !token) return notFound(reply);
  const rows = await sql`
    UPDATE admin_invites
    SET used_by = ${steamId}, used_at = now()
    WHERE token = ${token} AND used_at IS NULL AND expires_at > NOW()
  `;
  if (!rows.length) return notFound(reply);
  await sql`INSERT IGNORE INTO admins (steam_id) VALUES (${steamId})`;
  return { ok: true };
});

app.get("/api/admin/overview", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!(await isAdmin(steamId))) return notFound(reply);
  const [live] = await sql<{ count: number }[]>`
    SELECT CAST(COUNT(DISTINCT s.steam_id) AS SIGNED) AS count
    FROM snapshots s
    JOIN users u ON u.steam_id = s.steam_id
    WHERE s.created_at > NOW() - INTERVAL 7 DAY AND u.hide_leaderboard = 0 AND u.cis_opt_in = 1
  `;
  const counts = await sql<{ name: string; count: number }[]>`
    SELECT name, CAST(COUNT(*) AS SIGNED) AS count
    FROM events
    WHERE created_at > NOW() - INTERVAL 7 DAY
    GROUP BY name
  `;
  const days = await sql`
    SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, CAST(COUNT(*) AS SIGNED) AS count
    FROM events
    WHERE name = 'page_view' AND created_at > NOW() - INTERVAL 14 DAY
    GROUP BY day
    ORDER BY day
  `;
  const sources = await sql`
    SELECT COALESCE(utm_source, 'прямой') AS source, CAST(COUNT(*) AS SIGNED) AS count
    FROM events
    WHERE name = 'page_view' AND created_at > NOW() - INTERVAL 7 DAY
    GROUP BY source
    ORDER BY count DESC
    LIMIT 12
  `;
  const searchHits = await sql`
    SELECT utm_source AS engine, utm_campaign AS query, CAST(COUNT(*) AS SIGNED) AS count
    FROM events
    WHERE name = 'search_land' AND utm_campaign IS NOT NULL AND utm_campaign <> ''
      AND created_at > NOW() - INTERVAL 30 DAY
    GROUP BY engine, query
    ORDER BY count DESC
    LIMIT 30
  `;
  const players = await sql`
    SELECT steam_id, persona, country, cis_opt_in, hide_leaderboard, last_login_at
    FROM users
    ORDER BY last_login_at IS NULL, last_login_at DESC
    LIMIT 100
  `;
  const squads = await sql`
    SELECT sq.id, sq.name, sq.tag, sq.closed, sq.status,
           sq.banner_path IS NOT NULL AS has_banner,
           sq.logo_path IS NOT NULL AS has_logo,
           u.persona
    FROM squads sq
    JOIN users u ON u.steam_id = sq.owner_steam_id
    ORDER BY sq.created_at DESC
    LIMIT 40
  `;
  const assets = await sql`
    SELECT a.id, a.kind, a.path, a.discord_url, sq.id AS squad_id, sq.name, sq.tag
    FROM squad_assets a
    JOIN squads sq ON sq.id = a.squad_id
    WHERE a.status = 'pending'
    ORDER BY a.created_at
    LIMIT 40
  `;
  const reports = await sql`
    SELECT r.id, r.note, r.created_at, sq.tag, sq.name,
           target.persona AS target_name, target.steam_id AS target_steam_id,
           reporter.persona AS reporter_name
    FROM squad_reports r
    JOIN squads sq ON sq.id = r.squad_id
    JOIN users target ON target.steam_id = r.target_steam_id
    JOIN users reporter ON reporter.steam_id = r.reporter_steam_id
    WHERE r.status = 'open'
    ORDER BY r.created_at DESC
    LIMIT 40
  `;
  const builds = await sql`
    SELECT b.id, b.title, b.season, b.hidden, u.persona
    FROM builds b
    JOIN users u ON u.steam_id = b.steam_id
    ORDER BY b.created_at DESC
    LIMIT 20
  `;
  const sync = await sql<{ status: string; count: number }[]>`
    SELECT status, CAST(COUNT(*) AS SIGNED) AS count FROM sync_sessions GROUP BY status
  `;
  const [seasonBoard] = await sql<{ count: number }[]>`
    SELECT CAST(COUNT(DISTINCT steam_id) AS SIGNED) AS count
    FROM snapshots
    WHERE season = ${config.season}
  `;
  const byName = Object.fromEntries(counts.map((row) => [row.name, row.count]));
  return {
    liveCis: live?.count ?? 0,
    views7d: byName.page_view ?? 0,
    discordClicks7d: byName.discord_click ?? 0,
    shares7d: byName.share_build ?? 0,
    published7d: byName.build_publish ?? 0,
    logins7d: byName.login_ok ?? 0,
    squadBannerClicks7d: byName.squad_banner_click ?? 0,
    days,
    sources,
    searchTags: SEARCH_TAGS,
    searchHits,
    players,
    squads,
    assets,
    reports,
    builds,
    sync,
    gate: `/g/${config.adminPath}`,
    season: config.season,
    seasonPlayers: seasonBoard?.count ?? 0,
  };
});

app.post("/api/admin/season/reset", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!(await isAdmin(steamId))) return notFound(reply);
  if (text(asObject(request.body)?.confirm, 40) !== "ОБНУЛИТЬ") {
    return reply.code(400).send({ error: "confirm" });
  }
  if (config.season === "02") {
    return reply.code(409).send({ error: "season_locked", season: config.season });
  }
  const removed = await sql<{ affected?: number }[]>`
    DELETE FROM snapshots WHERE season = ${config.season}
  `;
  return { ok: true, season: config.season, removed: removed[0]?.affected ?? 0 };
});

app.post("/api/admin/invites", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!(await isAdmin(steamId)) || !steamId) return notFound(reply);
  const token = randomBytes(24).toString("hex");
  await sql`
    INSERT INTO admin_invites (token, created_by, expires_at)
    VALUES (${token}, ${steamId}, NOW() + INTERVAL 48 HOUR)
  `;
  return { url: `${config.siteOrigin}/g/${config.adminPath}?invite=${token}` };
});

app.post("/api/admin/players/:steamId/hide", async (request, reply) => {
  if (!(await isAdmin(steamIdOf(request)))) return notFound(reply);
  const steamId = (request.params as { steamId: string }).steamId;
  const hide = asObject(request.body)?.hide === true;
  if (!/^\d{17}$/.test(steamId)) return notFound(reply);
  // Скрыть = только hide_leaderboard; вернуть в топ — ещё cis_opt_in=1.
  if (hide) {
    await sql`UPDATE users SET hide_leaderboard = 1 WHERE steam_id = ${steamId}`;
  } else {
    await sql`UPDATE users SET hide_leaderboard = 0, cis_opt_in = 1 WHERE steam_id = ${steamId}`;
  }
  return { ok: true };
});

app.post("/api/admin/builds/:id/hide", async (request, reply) => {
  if (!(await isAdmin(steamIdOf(request)))) return notFound(reply);
  const id = Number((request.params as { id: string }).id);
  const hide = asObject(request.body)?.hide === true;
  await sql`UPDATE builds SET hidden = ${hide} WHERE id = ${id}`;
  return { ok: true };
});

app.post("/api/admin/reports/:id/close", async (request, reply) => {
  if (!(await isAdmin(steamIdOf(request)))) return notFound(reply);
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id)) return notFound(reply);
  await sql`UPDATE squad_reports SET status = 'closed' WHERE id = ${id}`;
  return { ok: true };
});

app.post("/api/admin/squads/:id/close", async (request, reply) => {
  if (!(await isAdmin(steamIdOf(request)))) return notFound(reply);
  const id = Number((request.params as { id: string }).id);
  await sql`UPDATE squads SET closed = true WHERE id = ${id}`;
  return { ok: true };
});

app.post("/api/admin/squads/:id/review", async (request, reply) => {
  if (!(await isAdmin(steamIdOf(request)))) return notFound(reply);
  const id = Number((request.params as { id: string }).id);
  const accept = asObject(request.body)?.accept === true;
  await sql`UPDATE squads SET status = ${accept ? "approved" : "rejected"} WHERE id = ${id}`;
  return { ok: true };
});

app.post("/api/admin/squads/:id/clear", async (request, reply) => {
  if (!(await isAdmin(steamIdOf(request)))) return notFound(reply);
  const id = Number((request.params as { id: string }).id);
  const kind = asObject(request.body)?.kind === "logo" ? "logo" : "banner";
  if (kind === "logo") await sql`UPDATE squads SET logo_path = NULL WHERE id = ${id}`;
  else await sql`UPDATE squads SET banner_path = NULL, discord_url = '' WHERE id = ${id}`;
  return { ok: true };
});

app.post("/api/admin/assets/:id/review", async (request, reply) => {
  if (!(await isAdmin(steamIdOf(request)))) return notFound(reply);
  const id = Number((request.params as { id: string }).id);
  const accept = asObject(request.body)?.accept === true;
  const rows = await sql<{ squad_id: number; kind: string; path: string; discord_url: string }[]>`
    SELECT squad_id, kind, path, discord_url FROM squad_assets WHERE id = ${id} AND status = 'pending'
  `;
  const asset = rows[0];
  if (!asset) return notFound(reply);
  if (!accept) {
    await sql`UPDATE squad_assets SET status = 'rejected' WHERE id = ${id}`;
    return { ok: true };
  }
  await sql.begin(async (tx) => {
    await tx`UPDATE squad_assets SET status = 'approved' WHERE id = ${id}`;
    if (asset.kind === "logo") {
      await tx`UPDATE squads SET logo_path = ${asset.path} WHERE id = ${asset.squad_id}`;
    } else {
      await tx`
        UPDATE squads SET banner_path = ${asset.path}, discord_url = ${asset.discord_url}
        WHERE id = ${asset.squad_id}
      `;
    }
  });
  return { ok: true };
});

app.post("/api/admin/admins/:steamId/remove", async (request, reply) => {
  const actor = steamIdOf(request);
  if (!(await isAdmin(actor))) return notFound(reply);
  const steamId = (request.params as { steamId: string }).steamId;
  if (steamId === config.ownerSteamId || steamId === actor) return reply.code(400).send({ error: "keep" });
  await sql`DELETE FROM admins WHERE steam_id = ${steamId}`;
  return { ok: true };
});

setInterval(() => {
  sql`UPDATE sync_sessions SET status = 'expired', updated_at = now() WHERE status = 'active' AND expires_at < now()`.catch((error) => {
    app.log.error(error);
  });
}, 60_000).unref();
setInterval(() => {
  refreshCareers().catch((error) => app.log.error(error));
  refreshPublicCareers().catch((error) => app.log.error(error));
}, 15 * 60 * 1000).unref();

await migrate();
dumpDatabase().catch((error) => app.log.error(error));
setInterval(() => {
  dumpDatabase().catch((error) => app.log.error(error));
}, 24 * 60 * 60 * 1000);
await app.listen({ port: config.port, host: "0.0.0.0" });
app.log.info(`API ${config.port}, сезон ${config.season}`);
const pullCombat = () => ingestCombat().catch((error) => app.log.error(error));
pullCombat();
setInterval(pullCombat, 20_000).unref();
refreshPublicCareers().catch((error) => app.log.error(error));
