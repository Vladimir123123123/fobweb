import { sql } from "./db.js";

/** Очки сообщества за бой на сервере FOB. */
export const KILL_BASE = 0.2;
export const DEATH_BASE = 0.7;
export const HEADSHOT_BONUS = 0.5;
export const TEAMKILL_PENALTY = 10;
export const STREAK_GROWTH = 1.1;

const memory = new Map<string, number>();

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function killReward(streak: number, headshot: boolean) {
  const n = Math.max(1, Math.floor(streak));
  const base = KILL_BASE * STREAK_GROWTH ** (n - 1);
  return round2(base + (headshot ? HEADSHOT_BONUS : 0));
}

export function deathPenalty(streak: number) {
  const n = Math.max(0, Math.floor(streak));
  return round2(DEATH_BASE * STREAK_GROWTH ** n);
}

async function loadStreak(steamId: string) {
  if (memory.has(steamId)) return memory.get(steamId)!;
  const rows = await sql<Array<{ streak: number }>>`
    SELECT streak FROM kill_streaks WHERE steam_id = ${steamId}
  `;
  const value = Math.max(0, Number(rows[0]?.streak) || 0);
  memory.set(steamId, value);
  return value;
}

async function saveStreak(steamId: string, streak: number) {
  const value = Math.max(0, Math.floor(streak));
  memory.set(steamId, value);
  await sql`
    INSERT INTO kill_streaks (steam_id, streak, updated_at)
    VALUES (${steamId}, ${value}, ${new Date()})
    ON DUPLICATE KEY UPDATE streak = VALUES(streak), updated_at = VALUES(updated_at)
  `;
}

async function credit(steamId: string, delta: number) {
  if (!/^\d{17}$/.test(steamId) || !Number.isFinite(delta) || delta === 0) return;
  const amount = round2(delta);
  if (amount > 0) {
    await sql`
      INSERT INTO community (steam_id, xp, coins) VALUES (${steamId}, 0, ${amount})
      ON DUPLICATE KEY UPDATE coins = coins + ${amount}
    `;
    return;
  }
  await sql`
    INSERT INTO community (steam_id, xp, coins) VALUES (${steamId}, 0, 0)
    ON DUPLICATE KEY UPDATE coins = GREATEST(0, coins + ${amount})
  `;
}

type KillEvent = {
  killerSteam: string;
  victimSteam: string;
  headshot: boolean;
  suicide: boolean;
  teamkill: boolean;
};

/** Начисление после успешной записи килла в server_kills. */
export async function applyCombatPoints(event: KillEvent) {
  const killer = event.killerSteam;
  const victim = event.victimSteam;

  if (event.suicide) {
    if (/^\d{17}$/.test(victim)) {
      const streak = await loadStreak(victim);
      await credit(victim, -deathPenalty(streak));
      await saveStreak(victim, 0);
    }
    return;
  }

  if (event.teamkill) {
    if (/^\d{17}$/.test(killer)) {
      await credit(killer, -TEAMKILL_PENALTY);
      await saveStreak(killer, 0);
    }
    if (/^\d{17}$/.test(victim) && victim !== killer) {
      const streak = await loadStreak(victim);
      await credit(victim, -deathPenalty(streak));
      await saveStreak(victim, 0);
    }
    return;
  }

  if (/^\d{17}$/.test(killer)) {
    const next = (await loadStreak(killer)) + 1;
    await credit(killer, killReward(next, event.headshot));
    await saveStreak(killer, next);
  }

  if (/^\d{17}$/.test(victim) && victim !== killer) {
    const streak = await loadStreak(victim);
    await credit(victim, -deathPenalty(streak));
    await saveStreak(victim, 0);
  }
}
