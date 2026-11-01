/**
 * HISTORIQUE — ce qui a été fait dans une séance passée, série par série. Logique pure.
 */

import { effortOf, type Effort } from '@/domain/effort';
import type { Workout } from '@/types';

export interface LoggedSet {
  weight: number;
  reps: number;
  warmup: boolean;
  effort?: Effort;
}

export interface LoggedExercise {
  name: string;
  sets: LoggedSet[];
}

/** The exercises of a session with the sets really done, in the order they were done. */
export function loggedExercises(workout: Workout): LoggedExercise[] {
  return workout.exercises
    .map((e) => ({
      name: e.name,
      sets: e.sets
        .filter((s) => s.completed !== false)
        .map((s) => ({ weight: s.weight, reps: s.reps, warmup: s.setType === 'warmup', effort: effortOf(s.rpe) })),
    }))
    .filter((e) => e.sets.length > 0);
}

/** Sets done in the session, warm-ups included. */
export function setsDone(workout: Workout): number {
  return loggedExercises(workout).reduce((n, e) => n + e.sets.length, 0);
}

/** Newest first. */
export function byDate(workouts: Workout[]): Workout[] {
  return [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
