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

export function setSession(reply: FastifyReply, steamId: string) {
  const parts = [
    `wd_session=${createSession(steamId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${14 * 24 * 3600}`,
  ];
  if (config.secureCookie) parts.push("Secure");
  reply.header("set-cookie", parts.join("; "));
}

export function clearSession(reply: FastifyReply) {
  const parts = ["wd_session=", "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (config.secureCookie) parts.push("Secure");
  reply.header("set-cookie", parts.join("; "));
}
