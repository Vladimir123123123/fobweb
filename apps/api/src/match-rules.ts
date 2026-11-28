import { sideKeyOf } from "./sides.js";

/** Минимум минут в матче, чтобы строка попала в историю / винрейт / ELO. */
export const MIN_PLAY_MINUTES = 15;
/** Винрейт и ELO — только при таком field_size на закрытии. */
export const MIN_FIELD_WINRATE = 80;

/** Победа или поражение. От 15 минут в матче — результат по стороне, даже если вышел раньше. */
export function matchResult(faction: string, winner: string, left: boolean, playMinutes: number | null = null) {
  const mine = sideKeyOf(faction);
  const won = sideKeyOf(winner);
  const enough = playMinutes != null && playMinutes >= MIN_PLAY_MINUTES;
  if (!enough) return left ? "leave" : "";
  if (!mine || !won) return "";
  return mine === won ? "win" : "loss";
}

/** Сколько минут игрок реально был в матче (first_seen → left_at / конец). */
export function playMinutesOf(
  firstSeen: Date | null,
  leftAt: Date | null,
  started: Date | null,
  endedAt: Date | null,
  left: boolean,
) {
  const from = firstSeen || started;
  const to = leftAt || endedAt;
  if (from && to && to.getTime() >= from.getTime()) {
    return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000));
  }
  if (!left && started && endedAt && endedAt.getTime() >= started.getTime()) {
    return Math.max(0, Math.round((endedAt.getTime() - started.getTime()) / 60000));
  }
  return null;
}
