/**
 * FORCE — the estimated one-rep max and the records per number of reps,
 * from the sets really done. Warm-ups and drop sets never count.
 */

import { mainSets, type ExerciseSession } from '@/domain/progression';

/** Past 12 reps an estimate says more about endurance than strength: not estimated. */
export const E1RM_MAX_REPS = 12;
/** The rep counts a record is kept for. */
export const REP_BUCKETS = [1, 3, 5, 8, 10, 12, 15, 20] as const;

const half = (n: number) => Math.round(n * 2) / 2;

/** Epley: weight × (1 + reps / 30), to the half kilo. Null when it cannot be estimated. */
export function e1rm(weight: number, reps: number): number | null {
  if (weight <= 0 || reps < 1 || reps > E1RM_MAX_REPS) return null;
  return reps === 1 ? weight : half(weight * (1 + reps / 30));
}

export interface StrengthBest {
  value: number;
  /** The set it comes from. */
  weight: number;
  reps: number;
  date: string;
}

const oldestFirst = (history: ExerciseSession[]) =>
  [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

/** The best estimate ever, and the set behind it. The first one to reach it keeps it. */
export function bestE1rm(history: ExerciseSession[]): StrengthBest | null {
  let best: StrengthBest | null = null;
  for (const session of oldestFirst(history)) {
    for (const set of mainSets(session.sets)) {
      const value = e1rm(set.weight, set.reps);
      if (value !== null && (!best || value > best.value)) {
        best = { value, weight: set.weight, reps: set.reps, date: session.date };
      }
    }
  }
  return best;
}

export interface RepRecord {
  reps: number;
  weight: number;
  date: string;
}

/**
 * The heaviest weight lifted for at least N reps, for each N of REP_BUCKETS.
 * A record a higher rep count already beats is left out: 80 kg × 10 says
 * more than 80 kg × 5.
 */
export function repRecords(history: ExerciseSession[]): RepRecord[] {
  const sessions = oldestFirst(history);
  const records = REP_BUCKETS.flatMap((reps) => {
    let best: RepRecord | null = null;
    for (const session of sessions) {
      for (const set of mainSets(session.sets)) {
        if (set.weight > 0 && set.reps >= reps && (!best || set.weight > best.weight)) {
          best = { reps, weight: set.weight, date: session.date };
        }
      }
    }
    return best ? [best] : [];
  });
  return records.filter((r) => !records.some((other) => other.reps > r.reps && other.weight >= r.weight));
}
