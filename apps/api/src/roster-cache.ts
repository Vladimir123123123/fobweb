const known = new Map<string, { faction: string; name: string }>();

export function rememberRoster(players: Array<{ steamId: string; faction?: string; name?: string }>) {
  for (const player of players) {
    if (!/^\d{17}$/.test(player.steamId)) continue;
    const previous = known.get(player.steamId);
    const faction = String(player.faction || "").trim().slice(0, 40);
    const name = String(player.name || "").trim().slice(0, 80);
    known.set(player.steamId, {
      faction: faction || previous?.faction || "",
      name: name || previous?.name || "",
    });
  }
}

export function knownPlayer(steamId: string) {
  return known.get(steamId);
}
