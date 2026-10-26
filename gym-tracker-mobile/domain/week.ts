import type { Workout } from '@/types';

/** Monday 00:00 of the week containing `now`, local time. */
export function startOfWeek(now: Date): Date {
  const start = new Date(now);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Workouts since Monday. */
export function workoutsThisWeek(workouts: Workout[], now = new Date()): Workout[] {
  const start = startOfWeek(now);
  return workouts.filter((w) => new Date(w.date) >= start);
}

/**
 * Weeks in a row where the weekly goal was met, counting back from last week.
 * The current week counts too once its goal is reached, so the streak never
 * drops in the middle of a week that is still going.
 */
export function weekStreak(workouts: Workout[], perWeek: number, now = new Date()): number {
  const perMonday = new Map<number, number>();
  for (const w of workouts) {
    const key = startOfWeek(new Date(w.date)).getTime();
    perMonday.set(key, (perMonday.get(key) ?? 0) + 1);
  }
  const met = (monday: Date) => (perMonday.get(monday.getTime()) ?? 0) >= perWeek;
  // Mi-semaine précédente puis retour au lundi : insensible aux changements d'heure
  const previous = (monday: Date) => startOfWeek(new Date(monday.getTime() - 3.5 * 24 * 3600 * 1000));

  const thisMonday = startOfWeek(now);
  let streak = met(thisMonday) ? 1 : 0;
  for (let monday = previous(thisMonday); met(monday); monday = previous(monday)) streak++;
  return streak;
}
