// The user's week: for each day from Monday, the program day done on it, or null for rest.
import { translatedList } from '@/domain/format';
import { hasExercises, programDays } from '@/domain/programs';
import { t } from '@/i18n';
import type { CustomExercise, Program, SplitId, Workout } from '@/types';

export type Schedule = (string | null)[];

export const WEEKDAY_NAMES = translatedList([
  'domain.weekdays.mon',
  'domain.weekdays.tue',
  'domain.weekdays.wed',
  'domain.weekdays.thu',
  'domain.weekdays.fri',
  'domain.weekdays.sat',
  'domain.weekdays.sun',
]);

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

/**
 * The sessions a week can hold: the program's days, then the days the user
 * added to it once they have exercises. A day already in the week stays
 * offered, so it can be seen and taken off.
 */
export function weekSessions(
  split: SplitId,
  settings: {
    customDays?: Record<string, string[]>;
    customExercises?: CustomExercise[];
    ownDays?: Record<string, string[]>;
  },
  week: Schedule = [],
): { known: string[]; offered: string[] } {
  const days = programDays(split, settings.customDays, settings.customExercises, settings.ownDays);
  return {
    known: days.map((d) => d.name),
    offered: days.filter((d) => !d.own || hasExercises(d) || week.includes(d.name)).map((d) => d.name),
  };
}

export function trainingCount(schedule: Schedule): number {
  return schedule.filter((name) => name !== null).length;
}

/**
 * The first session after today, and in how many days. `canDo`: a day that
 * cannot be done (an own day left empty) is skipped.
 */
export function nextScheduled(
  schedule: Schedule,
  now: Date,
  canDo: (name: string) => boolean = () => true,
): { name: string; inDays: number } | null {
  const today = weekdayIndex(now);
  for (let inDays = 1; inDays <= 7; inDays++) {
    const name = schedule[(today + inDays) % 7];
    if (name && canDo(name)) return { name, inDays };
  }
  return null;
}

/**
 * The program once a day of the week was renamed (`to`) or removed (`to` null):
 * a rename follows on every weekday, a removal frees its weekdays. A week left
 * without any session is dropped, the count of sessions stays.
 */
export function renameInSchedule(program: Program, from: string, to: string | null): Program {
  const { schedule } = program;
  if (!schedule?.includes(from)) return program;
  const week = schedule.map((name) => (name === from ? to : name));
  const count = trainingCount(week);
  if (count === 0) {
    const { schedule: _gone, ...rest } = program;
    return rest;
  }
  return { ...program, perWeek: count, schedule: week };
}

/** "demain", "jeudi", "lundi prochain". */
export function whenLabel(inDays: number, now: Date): string {
  if (inDays === 1) return t('domain.schedule.tomorrow');
  const name = WEEKDAY_NAMES[(weekdayIndex(now) + inDays) % 7]!;
  return inDays === 7 ? t('domain.schedule.nextWeek', { day: name }) : name;
}

export function trainedOn(workouts: Workout[], date: Date): boolean {
  return workouts.some((w) => new Date(w.date).toDateString() === date.toDateString());
}
