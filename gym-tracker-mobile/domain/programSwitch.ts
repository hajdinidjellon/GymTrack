/**
 * CHANGER DE PROGRAMME ? — une séance hors programme, c'est une exception.
 * Plusieurs d'affilée du même autre programme : la personne a changé, l'app
 * propose de suivre. Logique pure.
 */

import { splitOfDay } from '@/domain/programs';
import type { SplitId, Workout } from '@/types';

/** Sessions in a row from another program before the app offers to switch. */
export const SWITCH_AFTER = 3;

/**
 * The program the last sessions all came from, when it is not the user's.
 * `after`: the date of the last session when the user said no; only the
 * sessions after it count, so the question comes back only if it goes on.
 */
export function suggestedSplit(workouts: Workout[], current: SplitId, after?: string | null): SplitId | null {
  // Their own program: its days may share a name with another program's ("Push" kept from a copy)
  if (current === 'custom') return null;
  const since = after ? new Date(after).getTime() : -Infinity;
  const recent = workouts
    .filter((w) => new Date(w.date).getTime() > since)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, SWITCH_AFTER);
  if (recent.length < SWITCH_AFTER) return null;
  const splits = recent.map((w) => splitOfDay(w.name, current));
  const first = splits[0];
  return first && first !== current && splits.every((s) => s === first) ? first : null;
}

/** The date to remember when the user keeps their program: their newest session. */
export function latestWorkoutDate(workouts: Workout[]): string | null {
  return workouts.reduce<string | null>(
    (latest, w) => (!latest || new Date(w.date) > new Date(latest) ? w.date : latest),
    null,
  );
}
