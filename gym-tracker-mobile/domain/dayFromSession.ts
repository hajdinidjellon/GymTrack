/**
 * A session done differently (exercises moved, swapped, added) kept as the
 * program day it came from: « Garder pour ma séance Push ». Pure logic.
 */

import { choosableDays, dayKey, type ChoosableDay } from '@/domain/programs';
import { SETTINGS_LIMITS } from '@/domain/schemas';
import type { AppSettings, SplitId } from '@/types';

export interface DayUpdate {
  /** Where the list is saved: "ppl/Push". */
  key: string;
  day: ChoosableDay;
  /** The day's list as it is now (its supersets follow the change). */
  before: string[];
  /** The list it would keep. */
  names: string[];
}

/** The program day a session or a workout is named after, if any. */
export function dayOfSession(
  name: string,
  split: SplitId,
  settings: Pick<AppSettings, 'customDays' | 'customExercises' | 'ownDays'>,
): ChoosableDay | undefined {
  return choosableDays(split, settings.customDays, settings.customExercises, settings.ownDays).find(
    (d) => d.name === name,
  );
}

/**
 * What the day would become: the session's exercises in the session's order,
 * then the day's exercises the session never had from the start (left out to
 * fit the time), so they are not lost. Without `planned` (a past workout), the
 * session's list as it is. `known` drops names no longer in the catalog.
 * Null when nothing would change, or when nothing is left to keep.
 */
export function dayUpdateFrom(
  day: ChoosableDay | undefined,
  done: string[],
  planned: string[] | undefined,
  known: (name: string) => boolean,
): DayUpdate | null {
  if (!day) return null;
  const before = day.exercises.map((e) => e.name);
  const names: string[] = [];
  const add = (name: string) => {
    if (known(name) && !names.includes(name)) names.push(name);
  };
  done.forEach(add);
  if (planned) before.filter((n) => !planned.includes(n)).forEach(add);
  const kept = names.slice(0, SETTINGS_LIMITS.dayExercises);
  if (!kept.length || kept.join('\n') === before.join('\n')) return null;
  return { key: dayKey(day.split, day.name), day, before, names: kept };
}
