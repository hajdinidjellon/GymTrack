/**
 * Où en est la séance : le premier exercice et la première série pas encore validés.
 */

import { isWarmup } from '@/domain/warmup';
import type { ActiveExercise, WorkoutSet } from '@/types';

export interface Cursor {
  exercise: ActiveExercise;
  exerciseIndex: number;
  setIndex: number;
  set: WorkoutSet;
}

const unfinished = (e: ActiveExercise) => e.sets.some((s) => !s.completed);
const workDone = (e: ActiveExercise) => e.sets.filter((s) => s.completed && !isWarmup(s)).length;

/**
 * The first exercise not finished, and its first set to do. In a superset,
 * its partners take turns: the one with the fewest working sets done goes
 * next, the first in the list on a tie.
 */
export function findCurrent(exercises: ActiveExercise[]): Cursor | null {
  let exerciseIndex = exercises.findIndex(unfinished);
  const first = exercises[exerciseIndex];
  if (!first) return null;
  if (first.superset) {
    let fewest = workDone(first);
    exercises.forEach((e, i) => {
      if (e.superset === first.superset && unfinished(e) && workDone(e) < fewest) {
        fewest = workDone(e);
        exerciseIndex = i;
      }
    });
  }
  const exercise = exercises[exerciseIndex]!;
  const setIndex = exercise.sets.findIndex((s) => !s.completed);
  return { exercise, exerciseIndex, setIndex, set: exercise.sets[setIndex]! };
}
