/**
 * HISTORIQUE — ce qui a été fait dans une séance passée, série par série. Logique pure.
 */

import { effortOf, type Effort } from '@/domain/effort';
import type { Workout } from '@/types';

export interface LoggedSet {
  weight: number;
  reps: number;
  warmup: boolean;
  /** A drop set or a set to failure, when it was one. */
  kind?: 'drop' | 'failure';
  effort?: Effort;
  /** The RPE as it was given (6, 8,5…). */
  rpe?: number;
}

export interface LoggedExercise {
  name: string;
  /** Held for a time: the reps are seconds. */
  timed?: boolean;
  sets: LoggedSet[];
}

/** The exercises of a session with the sets really done, in the order they were done. */
export function loggedExercises(workout: Workout): LoggedExercise[] {
  return workout.exercises
    .map((e) => ({
      name: e.name,
      timed: e.timed,
      sets: e.sets
        .filter((s) => s.completed !== false)
        .map((s) => ({
          weight: s.weight,
          reps: s.reps,
          warmup: s.setType === 'warmup',
          ...(s.setType === 'drop' || s.setType === 'failure' ? { kind: s.setType } : {}),
          effort: effortOf(s.rpe),
          ...(s.rpe != null ? { rpe: s.rpe } : {}),
        })),
    }))
    .filter((e) => e.sets.length > 0);
}

/** Working sets done in the session: warm-ups are not counted, like on the summary. */
export function setsDone(workout: Workout): number {
  return loggedExercises(workout).reduce((n, e) => n + e.sets.filter((s) => !s.warmup).length, 0);
}

/** Newest first. */
export function byDate(workouts: Workout[]): Workout[] {
  return [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
