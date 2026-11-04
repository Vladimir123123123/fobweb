import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";

loadEnv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`В .env не задано ${name}`);
  return value;
}

const siteOrigin = (process.env.SITE_ORIGIN ?? "http://localhost:4321").replace(/\/$/, "");

export const config = {
  siteOrigin,
  sessionSecret: required("SESSION_SECRET", "dev-only-change-me"),
  adminPath: process.env.ADMIN_PATH || "local-staff-gate",
  ownerSteamId: (process.env.OWNER_STEAM_ID ?? "").trim(),
  steamKey: (process.env.STEAM_WEB_API_KEY ?? "").trim(),
  season: process.env.GAME_SEASON || "02",
  syncKey: (process.env.SYNC_INGEST_KEY ?? "").trim(),
  discordId: (process.env.DISCORD_CLIENT_ID ?? "").trim(),
  discordSecret: (process.env.DISCORD_CLIENT_SECRET ?? "").trim(),
  databaseUrl: required("DATABASE_URL"),
  port: Number(process.env.API_PORT ?? 3000),
  secureCookie: siteOrigin.startsWith("https://"),
};

export const CIS = new Set(["RU", "BY", "KZ", "AM", "AZ", "GE", "MD", "KG", "TJ", "TM", "UZ"]);
