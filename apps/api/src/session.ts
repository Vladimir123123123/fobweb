import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "./config.js";

type Session = { steamId: string; exp: number };

function sign(body: string) {
  return createHmac("sha256", config.sessionSecret).update(body).digest("base64url");
}

export function createSession(steamId: string) {
  const body = Buffer.from(JSON.stringify({ steamId, exp: Date.now() + 14 * 24 * 3600 * 1000 } satisfies Session)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readSession(request: FastifyRequest): Session | null {
  const header = request.headers.cookie ?? "";
  const pair = header.split(";").map((part) => part.trim()).find((part) => part.startsWith("wd_session="));
  if (!pair) return null;
  const token = decodeURIComponent(pair.slice("wd_session=".length));
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = sign(body);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const session = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    if (!session.steamId || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function cookieString(name: string, value: string, maxAge: number) {
  const parts = [`${name}=${value}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (config.secureCookie) parts.push("Secure");
  return parts.join("; ");
}

export function writeCookies(reply: FastifyReply, cookies: string[]) {
  reply.header("set-cookie", cookies);
}

export function setSession(reply: FastifyReply, steamId: string) {
  writeCookies(reply, [cookieString("wd_session", createSession(steamId), 14 * 24 * 3600)]);
}

export function clearSession(reply: FastifyReply) {
  writeCookies(reply, [
    cookieString("wd_session", "", 0),
    "wd_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure",
  ]);
}
