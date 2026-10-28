/**
 * CHIFFRES — ce que les écrans Aujourd'hui, Progrès et Profil résument
 * de l'historique. Logique pure.
 */

import { workingSets } from '@/domain/progression';
import { EXERCISES, type ExerciseDef } from '@/domain/programs';
import { exerciseHistory, tonnage } from '@/domain/sessionBuilder';
import { startOfWeek } from '@/domain/week';
import type { Workout } from '@/types';

const DAY = 24 * 3600 * 1000;
const LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export interface WeekDay {
  letter: string;
  date: Date;
  done: boolean;
  today: boolean;
  future: boolean;
}

/** Monday to Sunday of the current week, with the days trained. */
export function weekDays(workouts: Workout[], now = new Date()): WeekDay[] {
  const monday = startOfWeek(now);
  return LETTERS.map((letter, i) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return {
      letter,
      date,
      done: workouts.some((w) => sameDay(new Date(w.date), date)),
      today: sameDay(date, now),
      future: date.getTime() > now.getTime() && !sameDay(date, now),
    };
  });
}

export interface WeekVolume {
  start: Date;
  tonnage: number;
  sessions: number;
}

/** Weight lifted per week over the last `weeks` weeks, oldest first, current week last. */
export function weeklyVolume(workouts: Workout[], weeks: number, now = new Date()): WeekVolume[] {
  const thisMonday = startOfWeek(now);
  const starts = Array.from({ length: weeks }, (_, i) =>
    startOfWeek(new Date(thisMonday.getTime() - (weeks - 1 - i) * 7 * DAY + DAY / 2)),
  );
  return starts.map((start) => {
    const inWeek = workouts.filter((w) => startOfWeek(new Date(w.date)).getTime() === start.getTime());
    return { start, tonnage: inWeek.reduce((sum, w) => sum + tonnage(w), 0), sessions: inWeek.length };
  });
}

export interface PersonalBest {
  name: string;
  weight: number;
  reps: number;
  date: string;
}

/** Heaviest validated working set of each exercise, most recent record first. Bodyweight lifts are left out. */
export function personalBests(workouts: Workout[], catalog: ExerciseDef[] = Object.values(EXERCISES)): PersonalBest[] {
  const bests = catalog.flatMap((def) => {
    let best: PersonalBest | null = null;
    // Du plus ancien au plus récent : à égalité, le premier à l'avoir soulevé garde le record
    for (const session of [...exerciseHistory(def, workouts)].reverse()) {
      for (const set of workingSets(session.sets)) {
        if (set.weight > 0 && (!best || set.weight > best.weight)) {
          best = { name: def.name, weight: set.weight, reps: set.reps, date: session.date };
        }
      }
    }
    return best ? [best] : [];
  });
  return bests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export interface Totals {
  sessions: number;
  tonnage: number;
  since: string | null;
}

export function totals(workouts: Workout[]): Totals {
  const dates = workouts.map((w) => new Date(w.date).getTime());
  return {
    sessions: workouts.length,
    tonnage: workouts.reduce((sum, w) => sum + tonnage(w), 0),
    since: dates.length ? new Date(Math.min(...dates)).toISOString() : null,
  };
}
