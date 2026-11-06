/**
 * TEMPS DE LA SÉANCE — quand elle a vraiment fini (une séance oubliée ouverte
 * ne dure pas 5 h), si elle est restée ouverte, et le temps passé sur chaque
 * exercice. Logique pure.
 */

import type { ActiveSession, Workout, WorkoutSet } from '@/types';

const MINUTE = 60_000;
/** Nothing done for this long: the session was over, the phone just stayed open. */
export const IDLE_END_MS = 30 * MINUTE;
/** Nothing done for this long, or since another day: the app asks before reopening it. */
export const STALE_MS = 2 * 60 * MINUTE;
/** Saved before the end was capped: a session this long was left open, its time tells nothing. */
export const LEFT_OPEN_MINUTES = 4 * 60;

type WithSets = { sets: WorkoutSet[] };

function doneTimes(exercise: WithSets): number[] {
  return exercise.sets.flatMap((s) => (s.completed && s.doneAt != null ? [s.doneAt] : []));
}

/** When the last set was validated, if any set was. */
export function lastSetAt(exercises: WithSets[]): number | null {
  const times = exercises.flatMap(doneTimes);
  return times.length ? Math.max(...times) : null;
}

/** The last thing done: the last set validated, else the start (or the moment it was kept open). */
export function lastActivity(session: ActiveSession): number {
  const start = Date.parse(session.startedAt);
  return Math.max(start, lastSetAt(session.exercises) ?? start);
}

/** When the session ends if saved `now`: now, unless nothing was done for long; then its last set. */
export function sessionEnd(session: ActiveSession, now: number): number {
  const last = lastActivity(session);
  return now - last > IDLE_END_MS ? last : now;
}

/**
 * Left open: nothing done for hours, or since another day. Kept open on
 * purpose (`keptOpenAt`, "Reprendre"): asked again only after a new long wait.
 */
export function isStale(session: ActiveSession, now: number): boolean {
  const last = Math.max(lastActivity(session), session.keptOpenAt ?? 0);
  const idle = now - last;
  if (idle > STALE_MS) return true;
  return idle > IDLE_END_MS && new Date(last).toDateString() !== new Date(now).toDateString();
}

/** The end of a saved session moved by hand: never before its start nor after `now`. */
export function withEnd(workout: Workout, end: number, now: number): Workout {
  const start = Date.parse(workout.date);
  const minutes = Math.round((Math.min(end, now) - start) / MINUTE);
  return { ...workout, duration: Math.max(1, minutes) };
}

/** When a saved session ended: its start plus its duration. */
export function workoutEnd(workout: Workout): number | null {
  return workout.duration == null ? null : Date.parse(workout.date) + workout.duration * MINUTE;
}

export interface TimelineBlock {
  /** One exercise, or the ones done in turn (superset, machines shared). */
  names: string[];
  minutes: number;
}

export interface Timeline {
  start: number;
  end: number;
  minutes: number;
  /** Time per exercise, in the order done. Empty when the sets have no time (older sessions). */
  blocks: TimelineBlock[];
}

/**
 * When the session started and ended, and how long each exercise took: from
 * the end of the one before (the start, for the first) to its last set.
 * Exercises done in turn share one block.
 */
export function timeline(workout: Workout): Timeline | null {
  const end = workoutEnd(workout);
  if (end == null) return null;
  const start = Date.parse(workout.date);
  const spans = workout.exercises.map((e) => {
    const times = doneTimes(e);
    return times.length ? { name: e.name, first: Math.min(...times), last: Math.max(...times) } : null;
  });
  const timed = spans.filter((s): s is NonNullable<typeof s> => s != null);
  const base = { start, end, minutes: workout.duration ?? 0 };
  if (timed.length === 0 || timed.length !== spans.length) return { ...base, blocks: [] };

  const merged: { names: string[]; last: number }[] = [];
  for (const span of [...timed].sort((a, b) => a.first - b.first)) {
    const open = merged[merged.length - 1];
    if (open && span.first < open.last) {
      open.names.push(span.name);
      open.last = Math.max(open.last, span.last);
    } else merged.push({ names: [span.name], last: span.last });
  }
  let from = start;
  const blocks = merged.map((b) => {
    const minutes = Math.max(1, Math.round((b.last - from) / MINUTE));
    from = b.last;
    return { names: b.names, minutes };
  });
  return { ...base, blocks };
}
