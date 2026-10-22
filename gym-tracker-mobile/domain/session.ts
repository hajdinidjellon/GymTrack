/**
 * SÉANCE EN COURS — les transitions d'état, sans effet de bord.
 * Le store (stores/sessionStore.ts) les appelle puis s'occupe des
 * vibrations, de la voix et des notifications.
 */

import { findCurrent } from '@/domain/sessionCursor';
import type { ActiveExercise, ActiveSession, Workout, WorkoutSet } from '@/types';

export function createSession(id: string, name: string, exercises: ActiveExercise[], now: Date): ActiveSession {
  return {
    workoutId: id,
    name,
    startedAt: now.toISOString(),
    exercises,
    restEndsAt: null,
    restDuration: null,
    lastCompleted: null,
  };
}

function mapExercise(
  session: ActiveSession,
  exerciseId: string,
  fn: (e: ActiveExercise) => ActiveExercise,
): ActiveSession {
  return { ...session, exercises: session.exercises.map((e) => (e.id === exerciseId ? fn(e) : e)) };
}

function patchSet(e: ActiveExercise, setIndex: number, patch: Partial<WorkoutSet>): ActiveExercise {
  const current = e.sets[setIndex];
  if (!current) return e;
  const sets = [...e.sets];
  sets[setIndex] = { ...current, ...patch };
  return { ...e, sets };
}

export function findSet(session: ActiveSession, exerciseId: string, setIndex: number): WorkoutSet | undefined {
  return session.exercises.find((e) => e.id === exerciseId)?.sets[setIndex];
}

export function updateSet(
  session: ActiveSession,
  exerciseId: string,
  setIndex: number,
  patch: Partial<WorkoutSet>,
): ActiveSession {
  return mapExercise(session, exerciseId, (e) => patchSet(e, setIndex, patch));
}

/** Rounded to the hundredth so steps of 2.5 never drift to 52.4999. Never below zero. */
export function nudge(value: number, delta: number): number {
  return Math.max(0, Math.round((value + delta) * 100) / 100);
}

/** First time on an exercise: every set still to do gets the chosen weight as its target. */
export function setStartWeight(session: ActiveSession, exerciseId: string, weight: number): ActiveSession {
  return mapExercise(session, exerciseId, (e) => ({
    ...e,
    needsWeight: false,
    sets: e.sets.map((set) =>
      set.completed ? set : { ...set, weight, target: { weight, reps: set.target?.reps ?? set.reps } },
    ),
  }));
}

export function completeSet(session: ActiveSession, exerciseId: string, setIndex: number): ActiveSession {
  return {
    ...updateSet(session, exerciseId, setIndex, { completed: true }),
    lastCompleted: { exerciseId, setIndex },
  };
}

/** Indexes of the sets still to do on this exercise. */
export function remainingSets(exercise: ActiveExercise): number[] {
  return exercise.sets.flatMap((s, i) => (s.completed ? [] : [i]));
}

export function completeRemaining(session: ActiveSession, exerciseId: string): ActiveSession {
  const exercise = session.exercises.find((e) => e.id === exerciseId);
  const indexes = exercise ? remainingSets(exercise) : [];
  const lastIndex = indexes[indexes.length - 1];
  if (lastIndex === undefined) return session;
  return {
    ...mapExercise(session, exerciseId, (e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, completed: true })) })),
    lastCompleted: { exerciseId, setIndex: lastIndex },
  };
}

export function isDone(session: ActiveSession): boolean {
  return findCurrent(session.exercises) === null;
}

export function startRest(session: ActiveSession, seconds: number, now: number): ActiveSession {
  const duration = Math.max(1, Math.round(seconds));
  return { ...session, restEndsAt: now + duration * 1000, restDuration: duration };
}

export function endRest(session: ActiveSession): ActiveSession {
  return { ...session, restEndsAt: null, restDuration: null };
}

/** Seconds left on the rest, rounded up. Zero once it is over. */
export function restLeft(session: ActiveSession, now: number): number {
  return session.restEndsAt == null ? 0 : Math.max(0, Math.ceil((session.restEndsAt - now) / 1000));
}

/** What goes into the history: only exercises with at least one validated set. */
export function toWorkout(session: ActiveSession, now: Date): Workout {
  return {
    id: session.workoutId,
    date: session.startedAt,
    name: session.name,
    type: 'strength',
    exercises: session.exercises
      .filter((e) => e.sets.some((s) => s.completed))
      .map(({ equipment: _equipment, needsWeight: _needsWeight, ...exercise }) => exercise),
    duration: Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 60000),
    feeling: 3,
    completed: true,
  };
}

/** Body of the "rest over" notification: what to do next. */
export function nextSetSummary(session: ActiveSession, formatKg: (n: number) => string): string {
  const next = findCurrent(session.exercises);
  if (!next) return 'Lance ta prochaine série.';
  const load =
    next.set.weight > 0 ? ` · ${formatKg(next.set.weight)} kg × ${next.set.reps}` : ` · ${next.set.reps} reps`;
  return `${next.exercise.name}${load}`;
}
