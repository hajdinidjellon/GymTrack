/**
 * ÉCHAUFFEMENT — the warm-up sets the app adds before the working sets.
 *
 * Ramp on the first working weight (not the 1RM), the way coaches do it:
 * empty bar, then about 40 / 60 / 80 %, fewer reps as it gets heavier.
 * Only the first exercise of a muscle gets the full ramp; a muscle already
 * worked earlier in the session gets one set, or none on isolation work.
 * Every load is rounded down to what the gym's plates (or the dumbbell /
 * stack step) can make. Warm-ups never count: workingSets() drops them.
 */

import { loadingOf, type Loading } from '@/domain/loading';
import { platesForSide } from '@/domain/plates';
import { roundDownToIncrement } from '@/domain/progression';
import type { ActiveExercise, AppSettings, WorkoutSet } from '@/types';

type Step = readonly [percent: number, reps: number];

/** First exercise of a muscle, on the bar: after the empty bar. */
const BAR_RAMP: Step[] = [
  [0.4, 5],
  [0.6, 3],
  [0.8, 2],
];
/** Very heavy (7 bars and more, 140 kg on a 20 kg bar): one more, closer step. */
const HEAVY_STEP: Step = [0.9, 1];
/** First exercise of a muscle, dumbbells or machine. */
const SHORT_RAMP: Step[] = [
  [0.5, 6],
  [0.75, 3],
];
/** Isolation on a cold muscle. */
const LIGHT: Step[] = [[0.5, 8]];
/** Big movement on a muscle already warm. */
const REMINDER: Step[] = [[0.7, 3]];

const EMPTY_BAR_REPS = 10;
/** Rest after the last warm-up, before the first working set (capped by the exercise's own rest). */
export const WARMUP_REST = 90;

export const isWarmup = (set: Pick<WorkoutSet, 'setType'>): boolean => set.setType === 'warmup';

type Gym = Pick<AppSettings, 'barWeight' | 'plates'>;
export type WarmupSettings = Gym & Pick<AppSettings, 'warmups' | 'warmupOverrides'>;

/** On for this exercise: its own choice, else the global one. */
export function warmupsOn(name: string, settings: Pick<AppSettings, 'warmups' | 'warmupOverrides'>): boolean {
  return settings.warmupOverrides[name] ?? settings.warmups;
}

/** The heaviest load at or under `raw` that the equipment can really make. */
export function roundWarmupLoad(loading: Loading, raw: number, gym: Gym, step: number): number {
  const sum = (plates: number[]) => plates.reduce((a, b) => a + b, 0);
  switch (loading) {
    case 'bar':
      if (raw <= gym.barWeight) return gym.barWeight;
      return gym.barWeight + 2 * sum(platesForSide((raw - gym.barWeight) / 2, gym.plates));
    case 'perSide':
      return sum(platesForSide(raw, gym.plates));
    case 'perHand':
    case 'stack':
      return roundDownToIncrement(raw, step);
  }
}

function plan(exercise: ActiveExercise, warm: boolean, loading: Loading, working: number, gym: Gym): Step[] {
  const compound = exercise.category === 'compound';
  if (warm) return compound ? REMINDER : [];
  if (!compound) return LIGHT;
  if (loading !== 'bar') return SHORT_RAMP;
  return working >= gym.barWeight * 7 ? [...BAR_RAMP, HEAVY_STEP] : BAR_RAMP;
}

/**
 * The warm-up sets for this exercise, lightest first. `warm`: an exercise
 * before it in the session already worked its main muscle.
 */
export function warmupSets(exercise: ActiveExercise, warm: boolean, gym: Gym): WorkoutSet[] {
  const first = exercise.sets.find((s) => !isWarmup(s));
  const working = first?.weight ?? 0;
  if (!first || exercise.needsWeight || exercise.equipment === 'bodyweight' || working <= 0) return [];
  const loading = loadingOf(exercise);
  if (loading === 'bar' && working <= gym.barWeight) return [];
  const step = exercise.rule?.increment ?? 2.5;

  const loads: { weight: number; reps: number }[] = [];
  if (loading === 'bar' && !warm) loads.push({ weight: gym.barWeight, reps: EMPTY_BAR_REPS });
  for (const [percent, reps] of plan(exercise, warm, loading, working, gym)) {
    const weight = roundWarmupLoad(loading, working * percent, gym, step);
    const previous = loads[loads.length - 1]?.weight ?? 0;
    // Each set heavier than the last one, always lighter than the working weight
    if (weight > previous && weight < working) loads.push({ weight, reps });
  }

  const lastRest = Math.min(WARMUP_REST, first.restTime ?? WARMUP_REST);
  return loads.map((load, i) => ({
    ...load,
    setType: 'warmup' as const,
    // Straight from one warm-up to the next; a real rest only before the working sets
    restTime: i === loads.length - 1 ? lastRest : 0,
    completed: false,
  }));
}

const sameLoads = (a: WorkoutSet[], b: WorkoutSet[]) =>
  a.length === b.length &&
  a.every((s, i) => s.weight === b[i]!.weight && s.reps === b[i]!.reps && s.restTime === b[i]!.restTime);

/** Its main muscle was worked by an exercise before it. */
function isWarm(exercises: ActiveExercise[], index: number): boolean {
  const main = exercises[index]?.muscleGroups[0];
  return !!main && exercises.slice(0, index).some((e) => e.muscleGroups.includes(main));
}

/**
 * Puts the right warm-ups in front of every exercise not started yet.
 * Started exercises, and those whose warm-ups the user changed by hand
 * (skipped, swiped), keep theirs. Called when the session starts and
 * whenever its order or its exercises change.
 */
export function withWarmups(exercises: ActiveExercise[], settings: WarmupSettings): ActiveExercise[] {
  return exercises.map((exercise, i) => {
    if (exercise.keepWarmups || exercise.sets.some((s) => s.completed)) return exercise;
    const working = exercise.sets.filter((s) => !isWarmup(s));
    const warmups = warmupsOn(exercise.name, settings) ? warmupSets(exercise, isWarm(exercises, i), settings) : [];
    // Same warm-ups as before: the same exercise, so a no-op stays a no-op
    if (sameLoads(warmups, exercise.sets.filter(isWarmup))) return exercise;
    return { ...exercise, sets: [...warmups, ...working] };
  });
}

/** "Passer l'échauffement": the warm-ups left go, and stay gone for this session. */
export function skipWarmups(exercise: ActiveExercise): ActiveExercise {
  return { ...exercise, keepWarmups: true, sets: exercise.sets.filter((s) => s.completed || !isWarmup(s)) };
}

export interface SetNumber {
  warmup: boolean;
  /** 1-based, counted among the sets of the same kind. */
  n: number;
  /** How many sets of that kind. */
  total: number;
}

/** "Échauffement 2 sur 3" or "Série 1 sur 4": warm-ups and working sets are numbered apart. */
export function setNumber(sets: Pick<WorkoutSet, 'setType'>[], index: number): SetNumber {
  const warmup = !!sets[index] && isWarmup(sets[index]);
  const same = sets.filter((s) => isWarmup(s) === warmup);
  const n = sets.slice(0, index + 1).filter((s) => isWarmup(s) === warmup).length;
  return { warmup, n, total: same.length };
}

/** Working sets only, what "3 séries" means to the user: all of them, the ones done or the ones left. */
export function workingCount(sets: Pick<WorkoutSet, 'setType' | 'completed'>[], state?: 'done' | 'left'): number {
  return sets.filter((s) => !isWarmup(s) && (state === undefined || !!s.completed === (state === 'done'))).length;
}
