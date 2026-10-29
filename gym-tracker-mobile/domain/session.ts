/**
 * SÉANCE EN COURS — les transitions d'état, sans effet de bord.
 * Le store (stores/sessionStore.ts) les appelle puis s'occupe des
 * vibrations, de la voix et des notifications.
 */

import { moveItem } from '@/domain/reorder';
import { EFFORT_RPE, effortOf, type Effort } from '@/domain/effort';
import { withRestTaken } from '@/domain/rest';
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

/**
 * Marks the set done. The sets after it start from what was really done:
 * 100 kg instead of the planned 70 on set 1 means 100 kg on set 2 too.
 * `now` dates the validation: the gaps tell how long the user really rests.
 */
export function completeSet(session: ActiveSession, exerciseId: string, setIndex: number, now?: number): ActiveSession {
  return {
    ...mapExercise(session, exerciseId, (e) => {
      const done = e.sets[setIndex];
      if (!done) return e;
      return {
        ...e,
        sets: e.sets.map((set, i) => {
          if (i === setIndex) return { ...set, completed: true, doneAt: now };
          if (i > setIndex && !set.completed) return { ...set, weight: done.weight, reps: done.reps };
          return set;
        }),
      };
    }),
    lastCompleted: { exerciseId, setIndex },
  };
}

/**
 * Takes back the last validated set (a mis-tap). The rest it started is
 * cancelled too. Nothing to undo: the session is returned as is.
 */
export function undoLastSet(session: ActiveSession): ActiveSession {
  const last = session.lastCompleted;
  if (!last || !findSet(session, last.exerciseId, last.setIndex)?.completed) return session;
  return {
    ...endRest(updateSet(session, last.exerciseId, last.setIndex, { completed: false })),
    lastCompleted: null,
  };
}

/** One more set at the end, a copy of the last one, still to do: no rating, no time. */
export function addSet(session: ActiveSession, exerciseId: string): ActiveSession {
  return mapExercise(session, exerciseId, (e) => {
    const last = e.sets[e.sets.length - 1];
    if (!last) return e;
    const { rpe: _rpe, doneAt: _doneAt, ...copy } = last;
    const target = last.target ?? { weight: last.weight, reps: last.reps };
    return { ...e, sets: [...e.sets, { ...copy, completed: false, target }] };
  });
}

/** How the last validated set felt. The same effort a second time takes the rating back. */
export function rateLastSet(session: ActiveSession, effort: Effort): ActiveSession {
  const last = session.lastCompleted;
  const set = last && findSet(session, last.exerciseId, last.setIndex);
  if (!last || !set?.completed) return session;
  const rpe = effortOf(set.rpe) === effort ? undefined : EFFORT_RPE[effort];
  return updateSet(session, last.exerciseId, last.setIndex, { rpe });
}

/**
 * Removes a set still to do. A validated set stays (undo it first), and an
 * exercise always keeps one set.
 */
export function removeSet(session: ActiveSession, exerciseId: string, setIndex: number): ActiveSession {
  const exercise = session.exercises.find((e) => e.id === exerciseId);
  const set = exercise?.sets[setIndex];
  if (!exercise || !set || set.completed || exercise.sets.length <= 1) return session;
  const last = session.lastCompleted;
  const shifted =
    last && last.exerciseId === exerciseId && last.setIndex > setIndex
      ? { ...last, setIndex: last.setIndex - 1 }
      : last;
  return {
    ...mapExercise(session, exerciseId, (e) => ({ ...e, sets: e.sets.filter((_, i) => i !== setIndex) })),
    lastCompleted: shifted,
  };
}

/** Indexes of the sets still to do on this exercise. */
export function remainingSets(exercise: ActiveExercise): number[] {
  return exercise.sets.flatMap((s, i) => (s.completed ? [] : [i]));
}

export function completeRemaining(session: ActiveSession, exerciseId: string, now?: number): ActiveSession {
  const exercise = session.exercises.find((e) => e.id === exerciseId);
  const indexes = exercise ? remainingSets(exercise) : [];
  const lastIndex = indexes[indexes.length - 1];
  if (lastIndex === undefined) return session;
  return {
    ...mapExercise(session, exerciseId, (e) => ({
      ...e,
      sets: e.sets.map((s) => (s.completed ? s : { ...s, completed: true, doneAt: now })),
    })),
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

/**
 * Swaps an exercise for another one (machine taken, sore shoulder…). Not
 * started yet: it takes its place. Started: the sets done stay, the ones
 * left are dropped and the new exercise comes right after.
 */
export function replaceExercise(session: ActiveSession, exerciseId: string, next: ActiveExercise): ActiveSession {
  const index = session.exercises.findIndex((e) => e.id === exerciseId);
  const current = session.exercises[index];
  if (!current) return session;
  const done = current.sets.filter((s) => s.completed);
  const exercises = [...session.exercises];
  if (done.length === 0) exercises.splice(index, 1, next);
  else exercises.splice(index, 1, { ...current, sets: done }, next);
  return { ...session, exercises };
}

const isFinished = (e: ActiveExercise) => e.sets.every((s) => s.completed);

/**
 * The machine just freed up: this exercise becomes the current one. It moves
 * in front of the exercise in progress, which simply waits its turn. The
 * cursor stays "the first exercise not finished", so nothing else changes.
 */
export function doNow(session: ActiveSession, exerciseId: string): ActiveSession {
  const from = session.exercises.findIndex((e) => e.id === exerciseId);
  const target = session.exercises[from];
  const current = findCurrent(session.exercises);
  if (!target || !current || isFinished(target) || current.exercise.id === exerciseId) return session;
  return { ...session, exercises: moveItem(session.exercises, from, current.exerciseIndex) };
}

/**
 * The machine is taken: this exercise goes to the end of the session. Already
 * the last one left to do: the session is returned as is.
 */
export function doLater(session: ActiveSession, exerciseId: string): ActiveSession {
  const from = session.exercises.findIndex((e) => e.id === exerciseId);
  const target = session.exercises[from];
  const waitingAfter = session.exercises.slice(from + 1).some((e) => !isFinished(e));
  if (!target || isFinished(target) || !waitingAfter) return session;
  return { ...session, exercises: moveItem(session.exercises, from, session.exercises.length - 1) };
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
      .map(
        ({
          equipment: _e,
          needsWeight: _n,
          plateLoaded: _p,
          lastTime: _l,
          reason: _r,
          restNote: _rn,
          ...exercise
        }) => ({
          ...exercise,
          sets: withRestTaken(exercise.sets),
        }),
      ),
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
