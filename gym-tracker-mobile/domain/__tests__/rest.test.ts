import { describe, expect, it } from '@jest/globals';
import { EXERCISES, restFor, ruleFor } from '@/domain/programs';
import { clampRest, planRest, setSeconds, usualRest, withRestTaken } from '@/domain/rest';
import type { WorkoutSet } from '@/types';

const at = (seconds: number) => seconds * 1000;
const set = (patch: Partial<WorkoutSet> = {}): WorkoutSet => ({
  weight: 60,
  reps: 10,
  setType: 'normal',
  completed: true,
  ...patch,
});
/** A past session where every set after the first was preceded by `rest` seconds. */
const rested = (...rests: number[]) => ({ sets: [set(), ...rests.map((r) => set({ restTaken: r }))] });

const muscle = (def: (typeof EXERCISES)[keyof typeof EXERCISES]) => ruleFor('muscle', def, 2.5);

describe('restFor', () => {
  it.each([
    ['heavy sets', ruleFor('force', EXERCISES.squat, 2.5), EXERCISES.squat, 180],
    ['a big barbell lift', muscle(EXERCISES.squat), EXERCISES.squat, 120],
    ['a single-muscle exercise', muscle(EXERCISES.curl), EXERCISES.curl, 75],
    ['a dumbbell compound', muscle(EXERCISES.incline), EXERCISES.incline, 90],
  ])('%s', (_, rule, def, seconds) => {
    expect(restFor(rule, 90, def)).toBe(seconds);
  });

  it('keeps the default without an exercise, and never goes under 45 s', () => {
    expect(restFor(muscle(EXERCISES.curl), 90)).toBe(90);
    expect(restFor(muscle(EXERCISES.curl), 50, EXERCISES.curl)).toBe(45);
  });
});

describe('withRestTaken', () => {
  it('measures the rest between two validations, minus the set itself', () => {
    const sets = withRestTaken([set({ doneAt: at(0) }), set({ doneAt: at(150) }), set({ doneAt: at(300) })]);
    expect(sets.map((s) => s.restTaken)).toEqual([undefined, 150 - setSeconds(10), 150 - setSeconds(10)]);
    expect(sets.some((s) => 'doneAt' in s)).toBe(false);
  });

  it('ignores sets validated together, long breaks and sets not done', () => {
    const sets = withRestTaken([
      set({ doneAt: at(0) }),
      set({ doneAt: at(2) }),
      set({ doneAt: at(2 + 11 * 60) }),
      set({ doneAt: at(800), completed: false }),
      set(),
    ]);
    expect(sets.map((s) => s.restTaken)).toEqual([undefined, undefined, undefined, undefined, undefined]);
  });

  it('never gives a negative rest', () => {
    expect(withRestTaken([set({ doneAt: at(0) }), set({ doneAt: at(20), reps: 12 })])[1]!.restTaken).toBe(0);
  });
});

describe('usualRest', () => {
  it('needs a few samples before telling anything', () => {
    expect(usualRest([rested(140, 150, 160)])).toBeNull();
    expect(usualRest([])).toBeNull();
  });

  it('takes the median of the last sessions, rounded to 15 s', () => {
    expect(usualRest([rested(140, 150), rested(160, 400)])).toBe(150);
    expect(usualRest([rested(100, 105), rested(110, 200)])).toBe(105);
  });

  it('only looks at the latest sessions and skips warm-ups', () => {
    const old = Array.from({ length: 4 }, () => rested(60, 60));
    expect(usualRest([rested(180, 180), rested(180, 180), ...old])).toBe(120);
    expect(usualRest([{ sets: [set({ restTaken: 10, setType: 'warmup' })] }, rested(60, 60, 60, 60)])).toBe(60);
  });

  it('stays within limits', () => {
    expect(clampRest(5)).toBe(30);
    expect(clampRest(900)).toBe(300);
    expect(clampRest(97)).toBe(90);
  });
});

describe('planRest', () => {
  const squat = muscle(EXERCISES.squat);

  it('starts from the kind of exercise, with a reason', () => {
    expect(planRest(EXERCISES.squat, squat, 90, [])).toEqual({
      seconds: 120,
      source: 'kind',
      note: 'Gros mouvement à la barre : un peu plus de repos.',
    });
    expect(planRest(EXERCISES.curl, muscle(EXERCISES.curl), 90, []).note).toMatch(/plus court/);
    expect(planRest(EXERCISES.squat, ruleFor('force', EXERCISES.squat, 2.5), 90, []).note).toMatch(/3 min/);
    expect(planRest(EXERCISES.incline, muscle(EXERCISES.incline), 90, []).note).toBe('');
  });

  it('follows the habit once it is clear', () => {
    const slow = [rested(170, 180), rested(180, 190)];
    expect(planRest(EXERCISES.squat, squat, 90, slow)).toMatchObject({ seconds: 180, source: 'learned' });
    expect(planRest(EXERCISES.squat, squat, 90, slow).note).toMatch(/tu prends ton temps : 3 min/);
    const quick = [rested(60, 60), rested(60, 60)];
    expect(planRest(EXERCISES.squat, squat, 90, quick).note).toMatch(/tu repars vite/);
  });

  it('does not move for a few seconds', () => {
    const close = [rested(125, 125), rested(125, 125)];
    expect(planRest(EXERCISES.squat, squat, 90, close)).toMatchObject({ seconds: 120, source: 'kind' });
  });

  it('always keeps the rest the user chose', () => {
    const slow = [rested(180, 180), rested(180, 180)];
    expect(planRest(EXERCISES.squat, squat, 90, slow, 95)).toMatchObject({ seconds: 90, source: 'own' });
  });
});
