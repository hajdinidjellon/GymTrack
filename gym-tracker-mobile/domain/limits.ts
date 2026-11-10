/**
 * What a saved session can hold. The schemas (schemas.ts) refuse more, so every way in
 * (typing, arrows, adding sets or exercises, saving) stays within these bounds.
 */
/** The longest name the user types: an exercise, a day, a program. */
export const NAME_MAX = 40;

export const WORKOUT_LIMITS = { amount: 1000, sets: 50, exercises: 50, minutes: 24 * 60 } as const;

/** A weight or a number of reps, within what can be saved. */
export function clampAmount(n: number): number {
  return Math.min(WORKOUT_LIMITS.amount, Math.max(0, n));
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const fitNumber = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? clampAmount(v) : v);
const fitReps = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(clampAmount(v)) : v);

function fitSet(set: unknown): unknown {
  if (!isRecord(set)) return set;
  const target = isRecord(set.target)
    ? { ...set.target, weight: fitNumber(set.target.weight), reps: fitReps(set.target.reps) }
    : set.target;
  return { ...set, weight: fitNumber(set.weight), reps: fitReps(set.reps), target };
}

function fitExercise(exercise: unknown): unknown {
  if (!isRecord(exercise) || !Array.isArray(exercise.sets)) return exercise;
  return { ...exercise, sets: exercise.sets.slice(0, WORKOUT_LIMITS.sets).map(fitSet) };
}

/**
 * A session brought within the bounds: weights and reps clamped, extra sets and exercises
 * cut, the duration capped. A session saved by an older version with "1250 kg" typed by
 * mistake is read back like this instead of being lost.
 */
export function fitWorkout(workout: unknown): unknown {
  if (!isRecord(workout)) return workout;
  const exercises = Array.isArray(workout.exercises)
    ? workout.exercises.slice(0, WORKOUT_LIMITS.exercises).map(fitExercise)
    : workout.exercises;
  const duration =
    typeof workout.duration === 'number' ? Math.min(workout.duration, WORKOUT_LIMITS.minutes) : workout.duration;
  return { ...workout, exercises, duration };
}
