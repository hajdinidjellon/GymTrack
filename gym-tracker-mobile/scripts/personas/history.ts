/** A persona's past sessions, planned and logged the way the app does it. */
import { calibrationPreset, bodyOf } from '@/domain/onboarding';
import { findExerciseDef } from '@/domain/programs';
import { workoutSchema } from '@/domain/schemas';
import * as Session from '@/domain/session';
import { nextDay, planDay, toActiveExercises, type BuildContext } from '@/domain/sessionBuilder';
import { startPresets } from '@/domain/startWeights';
import { isWarmup } from '@/domain/warmup';
import type { AppSettings, UserProfile, Workout } from '@/types';
import type { Persona } from './personas';

/** Same numbers on every run: the accounts can be rebuilt identically. */
function random(seed: string): () => number {
  let a = [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761), 1) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Training days of a week, spread out: 3 → Mon Wed Fri, 4 → Mon Tue Thu Fri. */
const WEEK_DAYS: Record<number, number[]> = {
  2: [1, 4],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
};

export function sessionDates(persona: Persona, now: Date): Date[] {
  if (persona.weeks === 0) return [];
  const last = new Date(now);
  last.setDate(last.getDate() - persona.daysOff);
  const monday = new Date(last);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - 7 * (persona.weeks - 1));
  const days = WEEK_DAYS[persona.profile.program.perWeek] ?? WEEK_DAYS[3]!;
  const dates: Date[] = [];
  for (let w = 0; w < persona.weeks; w++) {
    for (const d of days) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + 7 * w + d);
      date.setHours(persona.hour, 0, 0, 0);
      if (date <= last) dates.push(date);
    }
  }
  return dates;
}

export function buildHistory(persona: Persona, profile: UserProfile, settings: AppSettings, now: Date): Workout[] {
  const roll = random(persona.username);
  const pick = <T>(list: T[]): T => list[Math.floor(roll() * list.length)]!;
  const workouts: Workout[] = [];

  for (const date of sessionDates(persona, now)) {
    const ctx: BuildContext = { profile, settings, workouts, now: date };
    const day = nextDay(ctx);
    const plan = planDay({ ...day, split: profile.program.split }, ctx);
    let session = Session.createSession(
      `seed-${persona.username}-${date.getTime()}`,
      plan.name,
      toActiveExercises(plan),
      date,
    );
    session = Session.refreshWarmups(session, settings);
    let clock = date.getTime();

    for (const start of session.exercises) {
      if (start.needsWeight) {
        const gear = findExerciseDef(start.name, settings.customExercises)?.gear;
        const presets = startPresets({ ...start, gear });
        const weight = calibrationPreset(presets, profile.experience, bodyOf(profile)) ?? 20;
        session = Session.setStartWeight(session, start.id, weight);
      }
      const count = session.exercises.find((e) => e.id === start.id)!.sets.length;
      for (let i = 0; i < count; i++) {
        const set = session.exercises.find((e) => e.id === start.id)!.sets[i]!;
        const lastSet = i === count - 1;
        if (lastSet && !isWarmup(set) && set.reps > 3 && roll() < persona.missRate) {
          session = Session.updateSet(session, start.id, i, { reps: set.reps - (roll() < 0.5 ? 1 : 2) });
        }
        clock += (isWarmup(set) ? 60 : (set.restTime ?? settings.defaultRestTime)) * 1000 + 40_000;
        session = Session.completeSet(session, start.id, i, clock);
      }
      session = Session.rateLastSet(session, pick(persona.efforts));
      clock += 90_000;
    }

    const workout = workoutSchema.parse(Session.toWorkout(session, new Date(clock)));
    workouts.unshift(workout);
  }
  return workouts;
}
