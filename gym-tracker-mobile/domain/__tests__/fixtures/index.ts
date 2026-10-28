import type { ActiveExercise, ActiveSession, Exercise, Workout } from '@/types';

export function workout(date: string, name: string, exercises: Exercise[], id = date): Workout {
  return { id, date, name, type: 'strength', exercises, feeling: 3, completed: true };
}

export function lift(name: string, weight: number, reps: number[]): Exercise {
  return {
    id: name,
    name,
    category: 'compound',
    muscleGroups: ['chest'],
    sets: reps.map((r) => ({ weight, reps: r, setType: 'normal', completed: true })),
  };
}

export function active(
  id: string,
  sets: { weight: number; reps: number; completed?: boolean }[],
  patch: Partial<ActiveExercise> = {},
): ActiveExercise {
  return {
    id,
    name: id,
    category: 'compound',
    muscleGroups: ['chest'],
    equipment: 'barbell',
    needsWeight: false,
    sets: sets.map((s) => ({ ...s, setType: 'normal', restTime: 90, completed: s.completed ?? false })),
    ...patch,
  };
}

export function session(exercises: ActiveExercise[]): ActiveSession {
  return {
    workoutId: 'w1',
    name: 'Push',
    startedAt: '2026-10-20T18:00:00.000Z',
    exercises,
    restEndsAt: null,
    restDuration: null,
    lastCompleted: null,
  };
}
