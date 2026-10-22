/**
 * Où en est la séance : le premier exercice et la première série pas encore validés.
 */

import type { ActiveExercise, WorkoutSet } from '@/types';

export interface Cursor {
  exercise: ActiveExercise;
  exerciseIndex: number;
  setIndex: number;
  set: WorkoutSet;
}

export function findCurrent(exercises: ActiveExercise[]): Cursor | null {
  for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
    const exercise = exercises[exerciseIndex]!;
    const setIndex = exercise.sets.findIndex((s) => !s.completed);
    const set = exercise.sets[setIndex];
    if (set) return { exercise, exerciseIndex, setIndex, set };
  }
  return null;
}
