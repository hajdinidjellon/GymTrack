import { describe, expect, it } from '@jest/globals';
import { clampAmount, fitWorkout, WORKOUT_LIMITS } from '@/domain/limits';
import { storedWorkoutSchema, workoutSchema } from '@/domain/schemas';
import * as Session from '@/domain/session';
import { active, session } from './fixtures';

const set = (weight: number, reps: number) => ({ weight, reps, setType: 'normal', completed: true });
const saved = (sets: unknown[], more: Record<string, unknown> = {}) => ({
  id: 'w1',
  date: '2026-10-20T18:00:00.000Z',
  name: 'Push',
  type: 'strength',
  exercises: [{ id: 'e1', name: 'Squat', category: 'compound', muscleGroups: ['legs'], sets }],
  feeling: 3,
  completed: true,
  ...more,
});

describe('clampAmount', () => {
  it.each([
    [-5, 0],
    [125, 125],
    [1250, WORKOUT_LIMITS.amount],
  ])('%p → %p', (n, expected) => {
    expect(clampAmount(n)).toBe(expected);
  });
});

describe('a session saved by an older version', () => {
  it('reads back a session with "1250 kg" typed by mistake, instead of losing it', () => {
    const raw = saved([set(1250, 5), { ...set(100, 5000), target: { weight: 2000, reps: 8 } }], { duration: 5000 });
    expect(workoutSchema.safeParse(raw).success).toBe(false);
    const read = storedWorkoutSchema.parse(raw);
    expect(read.exercises[0]!.sets.map((s) => [s.weight, s.reps])).toEqual([
      [1000, 5],
      [100, 1000],
    ]);
    expect(read.exercises[0]!.sets[1]!.target).toEqual({ weight: 1000, reps: 8 });
    expect(read.duration).toBe(WORKOUT_LIMITS.minutes);
  });

  it('cuts the sets and exercises over the limits', () => {
    const many = Array.from({ length: 60 }, () => set(60, 8));
    const read = storedWorkoutSchema.parse(saved(many));
    expect(read.exercises[0]!.sets).toHaveLength(WORKOUT_LIMITS.sets);
  });

  it('still refuses what is not a session at all', () => {
    expect(storedWorkoutSchema.safeParse({ id: 'w1' }).success).toBe(false);
    expect(storedWorkoutSchema.safeParse(null).success).toBe(false);
    expect(fitWorkout('oops')).toBe('oops');
  });
});

describe('the running session stays within what can be saved', () => {
  const bench = () => active('bench', [{ weight: 60, reps: 10 }]);

  it('clamps a typed weight or rep count', () => {
    const s = Session.updateSet(session([bench()]), 'bench', 0, { weight: 1250, reps: 4000 });
    expect(s.exercises[0]!.sets[0]).toMatchObject({ weight: 1000, reps: 1000 });
  });

  it('never nudges over the limit', () => {
    expect(Session.nudge(999, 2.5)).toBe(1000);
  });

  it('stops adding sets and exercises at the limits', () => {
    const full = active(
      'bench',
      Array.from({ length: WORKOUT_LIMITS.sets }, () => ({ weight: 60, reps: 10, completed: true })),
    );
    expect(Session.addSet(session([full]), 'bench').exercises[0]!.sets).toHaveLength(WORKOUT_LIMITS.sets);
    expect(Session.addDropSet(session([full]), 'bench', 0).exercises[0]!.sets).toHaveLength(WORKOUT_LIMITS.sets);
    const crowded = session(Array.from({ length: WORKOUT_LIMITS.exercises }, (_, i) => active(`e${i}`, [])));
    expect(Session.addExercise(crowded, active('one more', [])).exercises).toHaveLength(WORKOUT_LIMITS.exercises);
  });

  it('saves a session that always reads back', () => {
    const typed = session([active('bench', [{ weight: 1250, reps: 5, completed: true }])]);
    const workout = Session.toWorkout(typed, new Date('2026-10-20T19:00:00.000Z'));
    expect(workoutSchema.safeParse(workout).success).toBe(true);
    expect(workout.exercises[0]!.sets[0]!.weight).toBe(1000);
  });
});
