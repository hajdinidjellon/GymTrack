/**
 * How a catalog exercise is written. Names are stored in French and never
 * renamed: saved sessions point at them. Old or other names go in `aliases`.
 */

import type { CustomExercise, Equipment, ExerciseCategory, MuscleGroup } from '@/types';

export interface ExerciseDef extends CustomExercise {
  /**
   * Other names of the very same exercise (old names, English names). Never a
   * variant: an alias blocks creating an exercise of that name.
   */
  aliases?: string[];
  /** Created by the user. */
  custom?: boolean;
  /** A machine loaded with plates on each side, like a Hammer Strength press. */
  plateLoaded?: boolean;
  /**
   * A cable station or a Smith machine: the usual weights differ from a stack
   * machine's. A kettlebell: one bell, the weight shown is the bell.
   */
  gear?: 'cable' | 'smith' | 'kettlebell';
  /** A counterweight helps (assisted pull-ups): less weight is harder, progress takes help away. */
  assisted?: boolean;
}

/** First muscle = the main one: where the exercise is filed and what it swaps with. */
export const ex = (
  name: string,
  equipment: Equipment,
  category: ExerciseCategory,
  muscleGroups: MuscleGroup[],
  aliases?: string[],
): ExerciseDef => ({ name, equipment, category, muscleGroups, aliases });

export const withPlates = (def: ExerciseDef): ExerciseDef => ({ ...def, plateLoaded: true });
export const onCable = (def: ExerciseDef): ExerciseDef => ({ ...def, gear: 'cable' });
export const onSmith = (def: ExerciseDef): ExerciseDef => ({ ...def, gear: 'smith' });
/** Held in the hands like a dumbbell, but one bell: no "each dumbbell", no doubling. */
export const kettlebell = (def: ExerciseDef): ExerciseDef => ({ ...def, gear: 'kettlebell' });
/** A counterweight helps: progress takes help away. */
export const helped = (def: ExerciseDef): ExerciseDef => ({ ...def, assisted: true });
export const held = (def: ExerciseDef): ExerciseDef => ({ ...def, timed: true });
