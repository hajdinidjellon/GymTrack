/**
 * GAINAGE — the timer of a held set (plank, wall sit…). A short countdown
 * to get in position, then the hold. Absolute timestamps, like the rest:
 * the screen can redraw, sleep or come back, the time stays right.
 */

/** Seconds to get in position before the hold starts. */
export const HOLD_PREP = 3;

export type HoldPhase =
  { phase: 'prep'; left: number } | { phase: 'hold'; left: number; held: number } | { phase: 'done'; held: number };

/** Where the timer is, `startedAt` being the tap on "Lancer". */
export function holdPhase(startedAt: number, now: number, target: number): HoldPhase {
  const elapsed = Math.max(0, (now - startedAt) / 1000);
  if (elapsed < HOLD_PREP) return { phase: 'prep', left: Math.ceil(HOLD_PREP - elapsed) };
  const held = Math.floor(elapsed - HOLD_PREP);
  if (held >= target) return { phase: 'done', held: target };
  return { phase: 'hold', left: target - held, held };
}
