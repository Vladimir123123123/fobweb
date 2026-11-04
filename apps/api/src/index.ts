import { randomBytes } from "node:crypto";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { config } from "./config.js";
import { dumpDatabase } from "./backup.js";
import { migrate, sql } from "./db.js";
import { discordInvite, imageFile, readMedia, removeMedia, saveMedia } from "./media.js";
import { clearSession, createSession, readSession } from "./session.js";
import { cisByCountry, steamLoginUrl, steamProfile, verifySteamLogin } from "./steam.js";

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
};

const PUBLIC_EVENTS = new Set(["page_view", "discord_click", "share_build", "squad_banner_click"]);
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
  if (!Number.isInteger(number) || number < 0 || number > max) return undefined;
  return number;
}

async function upsertUser(steamId: string) {
  const profile = await steamProfile(steamId);
  const opted = cisByCountry(profile.country);
  await sql`
    INSERT INTO users (steam_id, persona, avatar, country, cis_opt_in, last_login_at)
    VALUES (${steamId}, ${profile.persona}, ${profile.avatar}, ${profile.country}, ${opted}, now())
    ON DUPLICATE KEY UPDATE
      persona = VALUES(persona),
      avatar = VALUES(avatar),
      country = VALUES(country),
      last_login_at = NOW()
  `;
  await sql`
    INSERT INTO events (name, steam_id) VALUES ('login_ok', ${steamId})
  `;
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

app.setErrorHandler((error, _request, reply) => {
  const message = error instanceof Error ? error.message : "";
  if (message === "bad_json") return reply.code(400).send({ error: "bad_request" });
  app.log.error(error);
  return reply.code(500).send({ error: "server" });
});

app.get("/api/health", async () => {
  await sql`SELECT 1`;
  return { ok: true, season: config.season };
});

app.get("/auth/steam", async (request, reply) => {
  const next = text((request.query as Record<string, unknown>).next, 200);
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  reply.header(
    "set-cookie",
    `wd_next=${encodeURIComponent(safeNext)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${config.secureCookie ? "; Secure" : ""}`,
  );
  return reply.redirect(steamLoginUrl(`${config.siteOrigin}/auth/steam/callback`, config.siteOrigin));
});

app.get("/auth/steam/callback", async (request, reply) => {
  const steamId = await verifySteamLogin(request.query as Record<string, unknown>);
  if (!steamId) return reply.code(401).type("text/plain").send("Steam не подтвердил вход.");
  await upsertUser(steamId);
  const cookie = [
    `wd_session=${createSession(steamId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${14 * 24 * 3600}`,
  ];
  if (config.secureCookie) cookie.push("Secure");
  const next = (request.headers.cookie ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("wd_next="));
  const target = next ? decodeURIComponent(next.slice("wd_next=".length)) : "/";
  const where = target.startsWith("/") && !target.startsWith("//") ? target : "/";
  reply.raw.setHeader("Set-Cookie", [cookie.join("; "), "wd_next=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"]);
  return reply.redirect(`${config.siteOrigin}${where}`);
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
           u.discord_name, s.status AS sync_status, s.expires_at
    FROM users u
    LEFT JOIN sync_sessions s ON s.steam_id = u.steam_id
    WHERE u.steam_id = ${steamId}
  `;
  const admin = await isAdmin(steamId);
  return {
    user: rows[0] ?? null,
    admin,
    discordLink: Boolean(config.discordId && config.discordSecret),
  };
});

app.patch("/api/me", async (request, reply) => {
  const steamId = steamIdOf(request);
  if (!steamId) return reply.code(401).send({ error: "steam" });
  const body = asObject(request.body);
  if (!body) return reply.code(400).send({ error: "bad_request" });
  if (typeof body.cisOptIn === "boolean") {
    await sql`UPDATE users SET cis_opt_in = ${body.cisOptIn} WHERE steam_id = ${steamId}`;
  }
  if (typeof body.hideLeaderboard === "boolean") {
    await sql`UPDATE users SET hide_leaderboard = ${body.hideLeaderboard} WHERE steam_id = ${steamId}`;
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
  const rows = await sql.unsafe(
    `SELECT s.steam_id, s.season, s.wardog_level, s.xp, s.account_value, s.cash, s.gold, s.unlocks,
            s.role_assault, s.role_medic, s.role_recon, s.role_support, s.role_driver, s.role_pilot,
            s.created_at, u.persona, u.avatar, u.country
     FROM snapshots s
     JOIN users u ON u.steam_id = s.steam_id
     JOIN (
       SELECT steam_id, MAX(created_at) AS created_at
       FROM snapshots
       WHERE season = ?
       GROUP BY steam_id
     ) latest ON latest.steam_id = s.steam_id AND latest.created_at = s.created_at
     WHERE u.hide_leaderboard = 0 AND u.cis_opt_in = 1
       AND (? = '' OR u.persona LIKE ?)
     ORDER BY \`${column}\` IS NULL, \`${column}\` DESC, xp IS NULL, xp DESC
     LIMIT 100`,
    [season, q, `%${q}%`],
  );
  return { season, sort, players: rows };
});

app.get("/api/players/:steamId", async (request, reply) => {
  const steamId = (request.params as { steamId: string }).steamId;
  if (!/^\d{17}$/.test(steamId)) return notFound(reply);
  const users = await sql<Array<Record<string, unknown>>>`
    SELECT steam_id, persona, avatar, country, cis_opt_in, hide_leaderboard, discord_name, created_at
    FROM users WHERE steam_id = ${steamId}
  `;
  if (!users.length) return notFound(reply);
  const history = await sql`
    SELECT created_at, wardog_level, xp, cash, gold, unlocks, account_value, source
    FROM snapshots
    WHERE steam_id = ${steamId}
    ORDER BY created_at ASC
    LIMIT 60
  `;
  const squads = await sql`
    SELECT sq.id, sq.name, sq.tag, m.role, m.status
    FROM squad_members m
    JOIN squads sq ON sq.id = m.squad_id
    WHERE m.steam_id = ${steamId} AND m.status = 'member' AND sq.status = 'approved'
    LIMIT 1
  `;
  const sync = await sql`SELECT status, expires_at, updated_at FROM sync_sessions WHERE steam_id = ${steamId}`;
  return { user: users[0], history, squad: squads[0] ?? null, sync: sync[0] ?? null };
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
    SELECT sq.id, sq.name, sq.tag, sq.closed, sq.logo_path, u.persona AS owner_name,
           (SELECT CAST(COUNT(*) AS SIGNED) FROM squad_members m WHERE m.squad_id = sq.id AND m.status = 'member') AS members
    FROM squads sq
    JOIN users u ON u.steam_id = sq.owner_steam_id
    WHERE sq.status = 'approved'
    ORDER BY sq.created_at DESC
    LIMIT 100
  `;
  const mine = steamId
    ? await sql`SELECT squad_id, status, role FROM squad_members WHERE steam_id = ${steamId}`
    : [];
  const deskRows = steamId
    ? await sql<{ id: number; name: string; tag: string; status: string; discord_url: string; logo_path: string | null; banner_path: string | null }[]>`
      SELECT id, name, tag, status, discord_url, logo_path, banner_path
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
  if (name.length < 3 || !/^[A-Z0-9]{2,5}$/.test(tag)) return reply.code(400).send({ error: "bad_request" });
  const existing = await sql`SELECT 1 FROM squad_members WHERE steam_id = ${steamId} AND status = 'member'`;
  if (existing.length) return reply.code(400).send({ error: "already" });
  const created = await sql<{ id: number }[]>`
    INSERT INTO squads (name, tag, owner_steam_id) VALUES (${name}, ${tag}, ${steamId})
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
  const squad = await sql`SELECT id, closed, status FROM squads WHERE id = ${id}`;
  if (!squad.length || squad[0].closed || squad[0].status !== "approved") return notFound(reply);
  const member = await sql`SELECT 1 FROM squad_members WHERE steam_id = ${steamId} AND status = 'member'`;
  if (member.length) return reply.code(400).send({ error: "already" });
  await sql`
    INSERT INTO squad_members (squad_id, steam_id, role, status)
    VALUES (${id}, ${steamId}, 'member', 'pending')
    ON DUPLICATE KEY UPDATE status = 'pending'
  `;
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

app.get("/api/squads/:id", async (request, reply) => {
  const id = Number((request.params as { id: string }).id);
  const squad = await sql`SELECT id, name, tag, closed, owner_steam_id FROM squads WHERE id = ${id}`;
  if (!squad.length) return notFound(reply);
  const viewer = steamIdOf(request);
  const members = await sql`
    SELECT m.steam_id, m.role, m.status, u.persona, u.avatar
    FROM squad_members m
    JOIN users u ON u.steam_id = m.steam_id
    WHERE m.squad_id = ${id} AND (m.status = 'member' OR ${viewer} = ${squad[0].owner_steam_id})
    ORDER BY m.role DESC, u.persona
  `;
  return { squad: squad[0], members };
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
  const players = await sql`
    SELECT steam_id, persona, country, cis_opt_in, hide_leaderboard, last_login_at
    FROM users
    ORDER BY last_login_at IS NULL, last_login_at DESC
    LIMIT 30
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
    players,
    squads,
    assets,
    builds,
    sync,
    gate: `/g/${config.adminPath}`,
  };
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
  await sql`UPDATE users SET hide_leaderboard = ${hide} WHERE steam_id = ${steamId}`;
  return { ok: true };
});

app.post("/api/admin/builds/:id/hide", async (request, reply) => {
  if (!(await isAdmin(steamIdOf(request)))) return notFound(reply);
  const id = Number((request.params as { id: string }).id);
  const hide = asObject(request.body)?.hide === true;
  await sql`UPDATE builds SET hidden = ${hide} WHERE id = ${id}`;
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

await migrate();
dumpDatabase().catch((error) => app.log.error(error));
setInterval(() => {
  dumpDatabase().catch((error) => app.log.error(error));
}, 24 * 60 * 60 * 1000);
await app.listen({ port: config.port, host: "0.0.0.0" });
app.log.info(`API ${config.port}, сезон ${config.season}`);
