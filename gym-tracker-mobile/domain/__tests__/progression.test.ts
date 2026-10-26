import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  defaultRule,
  deloadWeight,
  nextTargets,
  referenceWeight,
  roundDownToIncrement,
  ruleFromPlan,
  startWeightFromOneRepMax,
  type ExerciseSession,
} from '@/domain/progression';
import type { ProgressionRule, WorkoutSet } from '@/types';

const rule: ProgressionRule = defaultRule('kg'); // 3x8-12, +2.5

let day = 0;
/** A session where every set is at `weight`, with the given reps. */
function session(weight: number, reps: number[], extra: Partial<WorkoutSet>[] = []): ExerciseSession {
  day++;
  return {
    date: new Date(2026, 0, day).toISOString(),
    sets: reps.map((r, i) => ({ weight, reps: r, setType: 'normal', completed: true, ...extra[i] })),
  };
}

const weights = (r: ReturnType<typeof nextTargets>) => r.targets.map((t) => t.weight);
const reps = (r: ReturnType<typeof nextTargets>) => r.targets.map((t) => t.reps);

beforeEach(() => {
  day = 0;
});

describe('no history', () => {
  it('asks for calibration when there is no PR', () => {
    const r = nextTargets([], rule);
    expect(r.decision).toBe('calibrate');
    expect(reps(r)).toEqual([8, 8, 8]);
  });

  it('starts from the given weight when a PR exists', () => {
    const r = nextTargets([], rule, { startWeight: 70 });
    expect(r.decision).toBe('start');
    expect(weights(r)).toEqual([70, 70, 70]);
    expect(reps(r)).toEqual([8, 8, 8]);
  });

  it('derives the start weight from 70% of the 1RM, rounded down to the increment', () => {
    expect(startWeightFromOneRepMax(100, 2.5)).toBe(70);
    expect(startWeightFromOneRepMax(87, 2.5)).toBe(60); // 60.9 -> 60
    expect(startWeightFromOneRepMax(225, 5)).toBe(155); // 157.5 -> 155 (lbs)
  });
});

describe('adding reps', () => {
  it('keeps the weight and aims +1 rep on each set', () => {
    const r = nextTargets([session(60, [10, 9, 8])], rule);
    expect(r.decision).toBe('add_reps');
    expect(weights(r)).toEqual([60, 60, 60]);
    expect(reps(r)).toEqual([11, 10, 9]);
  });

  it('never aims above the top of the range', () => {
    const r = nextTargets([session(60, [12, 11, 10])], rule);
    expect(r.decision).toBe('add_reps');
    expect(reps(r)).toEqual([12, 12, 11]);
  });

  it('does not add weight when fewer sets than planned were done', () => {
    const r = nextTargets([session(60, [12, 12])], rule);
    expect(r.decision).toBe('add_reps');
    expect(weights(r)).toEqual([60, 60, 60]);
    expect(reps(r)).toEqual([12, 12, 8]);
  });
});

describe('adding weight', () => {
  it('adds one increment and goes back to the minimum once every set hits the top', () => {
    const r = nextTargets([session(60, [12, 12, 12])], rule);
    expect(r.decision).toBe('add_weight');
    expect(weights(r)).toEqual([62.5, 62.5, 62.5]);
    expect(reps(r)).toEqual([8, 8, 8]);
  });

  it('uses the increment of the exercise (dumbbells)', () => {
    const r = nextTargets([session(20, [12, 12, 12])], { ...rule, increment: 1 });
    expect(weights(r)).toEqual([21, 21, 21]);
  });

  it('uses 5 as the default increment in lbs', () => {
    const r = nextTargets([session(135, [12, 12, 12])], defaultRule('lbs'));
    expect(weights(r)).toEqual([140, 140, 140]);
  });

  it('treats a fixed rep count as a range of one', () => {
    const fiveByFive = ruleFromPlan(5, 5);
    expect(fiveByFive).toMatchObject({ sets: 5, repMin: 5, repMax: 5 });
    const r = nextTargets([session(100, [5, 5, 5, 5, 5])], fiveByFive);
    expect(r.decision).toBe('add_weight');
    expect(weights(r)).toEqual([102.5, 102.5, 102.5, 102.5, 102.5]);
  });
});

describe('failed sets', () => {
  it('keeps the weight and the previous targets after one failure', () => {
    const targets = [9, 9, 9].map((t) => ({ target: { weight: 60, reps: t } }));
    const r = nextTargets([session(60, [9, 9, 7], targets)], rule);
    expect(r.decision).toBe('repeat');
    expect(weights(r)).toEqual([60, 60, 60]);
    expect(reps(r)).toEqual([9, 9, 9]);
  });

  it('falls back to the reps done (at least the minimum) when no target was stored', () => {
    const r = nextTargets([session(60, [10, 9, 6])], rule);
    expect(r.decision).toBe('repeat');
    expect(reps(r)).toEqual([10, 9, 8]);
  });

  it('deloads by 10% after two failures in a row at the same weight', () => {
    const r = nextTargets([session(100, [8, 8, 6]), session(100, [8, 7, 6])], rule);
    expect(r.decision).toBe('deload');
    expect(weights(r)).toEqual([90, 90, 90]);
    expect(reps(r)).toEqual([8, 8, 8]);
  });

  it('rounds the deload to the nearest loadable weight', () => {
    const r = nextTargets([session(52.5, [7, 7, 7]), session(52.5, [7, 7, 6])], rule);
    expect(weights(r)).toEqual([47.5, 47.5, 47.5]); // 47.25 -> 47.5
  });

  it('always deloads by at least one increment', () => {
    expect(deloadWeight(100, 2.5)).toBe(90);
    expect(deloadWeight(52.5, 2.5)).toBe(47.5);
    expect(deloadWeight(20, 5)).toBe(15); // 18 rounds to 20, forced down to 15
    expect(deloadWeight(5, 5)).toBe(0);
  });

  it('does not deload when the two failures were at different weights', () => {
    const r = nextTargets([session(97.5, [7, 7, 7]), session(100, [7, 7, 7])], rule);
    expect(r.decision).toBe('repeat');
    expect(weights(r)).toEqual([100, 100, 100]);
  });

  it('does not deload when a good session sits between two failures', () => {
    const r = nextTargets([session(100, [8, 8, 7]), session(100, [9, 8, 8]), session(100, [9, 8, 7])], rule);
    expect(r.decision).toBe('repeat');
  });

  it('progresses normally after a deload', () => {
    const r = nextTargets([session(100, [8, 7, 6]), session(100, [7, 7, 6]), session(90, [8, 8, 8])], rule);
    expect(r.decision).toBe('add_reps');
    expect(weights(r)).toEqual([90, 90, 90]);
    expect(reps(r)).toEqual([9, 9, 9]);
  });
});

describe('bodyweight (weight 0)', () => {
  it('never adds weight and keeps adding reps past the top of the range', () => {
    const r = nextTargets([session(0, [12, 13, 12])], rule);
    expect(r.decision).toBe('add_reps');
    expect(weights(r)).toEqual([0, 0, 0]);
    expect(reps(r)).toEqual([13, 14, 13]);
  });

  it('retries instead of deloading after two failures', () => {
    const r = nextTargets([session(0, [8, 7, 6]), session(0, [8, 7, 7])], rule);
    expect(r.decision).toBe('repeat');
    expect(weights(r)).toEqual([0, 0, 0]);
    expect(reps(r)).toEqual([8, 8, 8]);
  });
});

describe('what counts as history', () => {
  it('ignores warm-up sets', () => {
    const s = session(60, [12, 12, 12]);
    s.sets.unshift({ weight: 20, reps: 5, setType: 'warmup', completed: true });
    const r = nextTargets([s], rule);
    expect(r.decision).toBe('add_weight');
    expect(weights(r)).toEqual([62.5, 62.5, 62.5]);
  });

  it('ignores sets that were never validated', () => {
    const r = nextTargets([session(60, [10, 10, 0], [{}, {}, { completed: false }])], rule);
    expect(r.decision).toBe('add_reps');
    expect(reps(r)).toEqual([11, 11, 8]);
  });

  it('only looks at the latest session, whatever the input order', () => {
    const older = session(60, [12, 12, 12]);
    const newer = session(62.5, [9, 8, 8]);
    const r = nextTargets([newer, older], rule);
    expect(r.decision).toBe('add_reps');
    expect(weights(r)).toEqual([62.5, 62.5, 62.5]);
    expect(reps(r)).toEqual([10, 9, 9]);
  });

  it('does not count a set done lighter as progress at the reference weight', () => {
    const r = nextTargets([session(60, [12, 12, 10], [{}, {}, { weight: 55 }])], rule);
    expect(r.decision).toBe('add_reps');
    expect(weights(r)).toEqual([60, 60, 60]);
    expect(reps(r)).toEqual([12, 12, 10]);
  });
});

describe('helpers', () => {
  it('picks the most frequent weight, the heavier one on a tie', () => {
    const set = (weight: number): WorkoutSet => ({ weight, reps: 8, setType: 'normal' });
    expect(referenceWeight([set(60), set(60), set(55)])).toBe(60);
    expect(referenceWeight([set(55), set(60)])).toBe(60);
  });

  it('absorbs float noise when rounding', () => {
    expect(roundDownToIncrement(100 * 0.9, 2.5)).toBe(90);
    expect(roundDownToIncrement(89.9999999999, 2.5)).toBe(90);
  });
});
