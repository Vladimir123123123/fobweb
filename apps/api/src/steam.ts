import { CIS } from "./config.js";
import { config } from "./config.js";

const OPENID = "http://specs.openid.net/auth/2.0";

export function steamLoginUrl(returnTo: string, realm: string) {
  const url = new URL("https://steamcommunity.com/openid/login");
  url.searchParams.set("openid.ns", OPENID);
  url.searchParams.set("openid.mode", "checkid_setup");
  url.searchParams.set("openid.return_to", returnTo);
  url.searchParams.set("openid.realm", realm);
  url.searchParams.set("openid.identity", `${OPENID}/identifier_select`);
  url.searchParams.set("openid.claimed_id", `${OPENID}/identifier_select`);
  return url.toString();
}

export async function verifySteamLogin(query: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (!key.startsWith("openid.") || typeof value !== "string") continue;
    params.set(key, value);
  }
  params.set("openid.mode", "check_authentication");
  try {
    const response = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params,
      signal: AbortSignal.timeout(20_000),
    });
    const text = await response.text();
    if (!text.includes("is_valid:true")) return null;
    const claimed = String(query["openid.claimed_id"] ?? "");
    return claimed.match(/\/id\/(\d{17})$/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function steamProfile(steamId: string) {
  if (!config.steamKey) return { persona: null, avatar: null, country: null };
  try {
    const url = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/");
    url.searchParams.set("key", config.steamKey);
    url.searchParams.set("steamids", steamId);
    const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return { persona: null, avatar: null, country: null };
    const payload = (await response.json()) as { response?: { players?: Array<Record<string, string>> } };
    const player = payload.response?.players?.[0];
    return {
      persona: player?.personaname ?? null,
      avatar: player?.avatarfull ?? null,
      country: player?.loccountrycode ?? null,
    };
  } catch {
    return { persona: null, avatar: null, country: null };
  }
}

export function cisByCountry(country: string | null) {
  return Boolean(country && CIS.has(country.toUpperCase()));
}
