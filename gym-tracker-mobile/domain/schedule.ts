// The user's week: for each day from Monday, the program day done on it, or null for rest.
import type { Workout } from '@/types';

export type Schedule = (string | null)[];

export const WEEKDAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

// Jours d'exemple, lundi = 0 : on laisse au moins un jour de repos quand c'est possible
export const TRAINING_DAYS: Record<number, number[]> = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

/** Monday = 0 … Sunday = 6. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** A starting week: the program days in order on the example days. */
export function defaultSchedule(dayNames: string[], perWeek: number): Schedule {
  const training = TRAINING_DAYS[perWeek] ?? TRAINING_DAYS[3]!;
  return WEEKDAY_NAMES.map((_, i) => {
    const n = training.indexOf(i);
    return n < 0 || dayNames.length === 0 ? null : dayNames[n % dayNames.length]!;
  });
}

/** The saved week if it still fits the program (7 days, known names, one session at least), else null. */
export function validSchedule(schedule: Schedule | undefined, dayNames: string[]): Schedule | null {
  if (!schedule || schedule.length !== 7) return null;
  if (schedule.some((name) => name !== null && !dayNames.includes(name))) return null;
  return trainingCount(schedule) > 0 ? schedule : null;
}

export function trainingCount(schedule: Schedule): number {
  return schedule.filter((name) => name !== null).length;
}

/** The first session after today, and in how many days. */
export function nextScheduled(schedule: Schedule, now: Date): { name: string; inDays: number } | null {
  const today = weekdayIndex(now);
  for (let inDays = 1; inDays <= 7; inDays++) {
    const name = schedule[(today + inDays) % 7];
    if (name) return { name, inDays };
  }
  return null;
}

/** "demain", "jeudi", "lundi prochain". */
export function whenLabel(inDays: number, now: Date): string {
  if (inDays === 1) return 'demain';
  const name = WEEKDAY_NAMES[(weekdayIndex(now) + inDays) % 7]!;
  return inDays === 7 ? `${name} prochain` : name;
}

export function trainedOn(workouts: Workout[], date: Date): boolean {
  return workouts.some((w) => new Date(w.date).toDateString() === date.toDateString());
}
