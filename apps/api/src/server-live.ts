import { config } from "./config.js";

export type LiveFaction = { name: string; score: number };
export type LiveServer = {
  name: string;
  map: string;
  mode: string;
  players: number;
  maxPlayers: number;
  online: boolean;
  factions: LiveFaction[];
};

const MODES: Record<string, string> = {
  KOTH: "Царь горы",
  DM: "Бойня",
  TDM: "Командная бойня",
  PVE: "PvE",
  INVASION: "Вторжение",
};
const EXTRAS: Record<string, string> = {
  INFANTRYONLY: "пехота",
  KOTH_INFANTRYONLY: "пехота",
  LIMITEDGEAR: "лимитед",
  KOTH_LIMITEDGEAR: "лимитед",
};

export function describeMode(experience: string, modifiers: string[] = []): string {
  const tokens = `${experience} ${modifiers.join(" ")}`.replace(/[+_]/g, " ").split(/\s+/).filter(Boolean);
  let mode = "";
  const extras: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const upper = token.toUpperCase();
    if (!mode && MODES[upper]) mode = MODES[upper];
    const extra = EXTRAS[upper];
    if (extra && !seen.has(extra)) {
      seen.add(extra);
      extras.push(extra);
    }
  }
  if (!mode) mode = "сессия";
  return extras.length ? `${mode} · ${extras.join(" · ")}` : mode;
}

async function readJson(url: string, headers: Record<string, string>): Promise<unknown | null> {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (response.status === 404) return null;
  if (!response.ok) return null;
  return response.json();
}

function fromRcon(raw: Record<string, unknown>): LiveServer {
  const players = raw.players && typeof raw.players === "object" ? raw.players as Record<string, unknown> : {};
  const experiences = Array.isArray(raw.experiences) ? raw.experiences.map(String) : [];
  const factions = Array.isArray(raw.factionScores) ? raw.factionScores.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const name = String(row.name || "").trim();
    if (!name) return [];
    const score = Number(row.score);
    return [{ name, score: Number.isFinite(score) ? Math.round(score) : 0 }];
  }) : [];
  return {
    name: String(raw.serverName || "FOB").trim() || "FOB",
    map: String(raw.map || "—").trim() || "—",
    mode: describeMode(experiences.join(" ")),
    players: Number(players.current) || 0,
    maxPlayers: Number(players.max) || 0,
    online: true,
    factions,
  };
}

function fromBrowser(raw: Record<string, unknown>): LiveServer | null {
  const data = raw.data && typeof raw.data === "object" ? raw.data as Record<string, unknown> : raw;
  if (!data.name) return null;
  const gameMap = data.map && typeof data.map === "object" ? data.map as Record<string, unknown> : {};
  const mode = data.mode && typeof data.mode === "object" ? data.mode as Record<string, unknown> : {};
  const modifiers = Array.isArray(mode.modifiers) ? mode.modifiers.map(String) : [];
  return {
    name: String(data.name).trim() || "FOB",
    map: String(gameMap.variant || gameMap.base || "—"),
    mode: describeMode(String(mode.experience || ""), modifiers),
    players: Number(data.players) || 0,
    maxPlayers: Number(data.maxPlayers) || 0,
    online: true,
    factions: [],
  };
}

export async function liveServer(): Promise<LiveServer | null> {
  if (config.rconHost && config.rconPassword) {
    const raw = await readJson(`http://${config.rconHost}:${config.rconPort}/v1/status`, {
      Authorization: `Bearer ${config.rconPassword}`,
      Accept: "application/json",
      "User-Agent": "FOB-site",
    });
    if (raw && typeof raw === "object") return fromRcon(raw as Record<string, unknown>);
  }
  const listed = await readJson(`https://api.wardogservers.com/v1/servers/${config.browserServerId}`, {
    Accept: "application/json",
    "User-Agent": "FOB-site",
  });
  if (!listed || typeof listed !== "object") return null;
  return fromBrowser(listed as Record<string, unknown>);
}
