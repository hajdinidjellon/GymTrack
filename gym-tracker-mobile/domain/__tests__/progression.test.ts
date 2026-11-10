import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  comebackWeight,
  defaultRule,
  deloadWeight,
  isFailedSession,
  moreHelp,
  readSession,
  workingWeight,
  isProgress,
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

describe('manual mode', () => {
  it('repeats the last session set by set, top set and back-offs included', () => {
    const last = session(180, [1, 5, 5, 5], [{ weight: 200 }]);
    const r = nextTargets([last], rule, { manual: true, now: new Date(2027, 5, 1) });
    expect(r.decision).toBe('manual');
    expect(r.targets).toEqual([
      { weight: 200, reps: 1 },
      { weight: 180, reps: 5 },
      { weight: 180, reps: 5 },
      { weight: 180, reps: 5 },
    ]);
  });

  it('asks for a weight the first time, like the automatic mode', () => {
    expect(nextTargets([], rule, { manual: true }).decision).toBe('calibrate');
  });
});
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
    expect(deloadWeight(20, 5)).toBe(15); // 18 rounds to 20, forced down to 15 (-25 %)
  });

  it.each([
    // weight, step, bar, expected
    [5, 5, undefined, 5], // never 0
    [6, 2, undefined, 6], // 4 kg would be -33 %
    [10, 2, undefined, 8], // 9 rounds to 10, one step down is -20 %
    [20, 2, undefined, 18],
    [20, 2.5, 20, 20], // never under the empty bar
    [22.5, 2.5, 20, 20],
    [100, 2.5, 20, 90],
    [15, 2.5, 20, 12.5], // lighter than the bar already (EZ bar): the bar is no floor
    [50, 0, undefined, 45],
  ])('deloads %p kg (step %p, bar %p) to %p', (weight, step, bar, expected) => {
    expect(deloadWeight(weight, step, bar)).toBe(expected);
  });

  it('starts from the reps really done when nothing lighter makes sense', () => {
    const dumbbells = { ...rule, increment: 2 };
    const r = nextTargets([session(6, [8, 7, 6]), session(6, [8, 6, 5])], dumbbells);
    expect(r.decision).toBe('ease');
    expect(weights(r)).toEqual([6, 6, 6]);
    expect(reps(r)).toEqual([8, 6, 5]);
  });

  it('then builds up from the lowered targets instead of repeating them forever', () => {
    const lowered = [8, 6, 5].map((t) => ({ target: { weight: 6, reps: t } }));
    const r = nextTargets([session(6, [8, 6, 5], lowered)], { ...rule, increment: 2 });
    expect(r.decision).toBe('add_reps');
    expect(reps(r)).toEqual([9, 7, 6]);
  });

  it('never deloads under the empty bar', () => {
    const r = nextTargets([session(20, [6, 6, 5]), session(20, [6, 5, 5])], rule, { minWeight: 20 });
    expect(r.decision).toBe('ease');
    expect(weights(r)).toEqual([20, 20, 20]);
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

describe('how the last set felt', () => {
  /** Every set at `weight`, the last one rated with this RPE. */
  const felt = (weight: number, r: number[], rpe: number) =>
    session(
      weight,
      r,
      r.map((_, i) => (i === r.length - 1 ? { rpe } : {})),
    );

  it('adds two reps when the last set was easy', () => {
    const r = nextTargets([felt(60, [9, 9, 9], 6)], rule);
    expect(r.decision).toBe('add_two_reps');
    expect(reps(r)).toEqual([11, 11, 11]);
  });

  it('never goes past the top of the range', () => {
    expect(reps(nextTargets([felt(60, [11, 11, 10], 6)], rule))).toEqual([12, 12, 12]);
  });

  it('adds one rep when the last set was just right', () => {
    expect(nextTargets([felt(60, [9, 9, 9], 8)], rule).decision).toBe('add_reps');
  });

  it('keeps the same target once when the last set was all-out', () => {
    const r = nextTargets([felt(60, [10, 9, 9], 10)], rule);
    expect(r.decision).toBe('hold');
    expect(weights(r)).toEqual([60, 60, 60]);
    expect(reps(r)).toEqual([10, 9, 9]);
  });

  it('moves on after a hold, even all-out again, then holds again', () => {
    expect(nextTargets([felt(60, [10, 9, 9], 10), felt(60, [10, 9, 9], 10)], rule).decision).toBe('add_reps');
    const three = [felt(60, [9, 9, 9], 10), felt(60, [10, 9, 9], 10), felt(60, [10, 10, 10], 10)];
    expect(nextTargets(three, rule).decision).toBe('hold');
  });

  it('holds on a first all-out session at a new weight', () => {
    expect(nextTargets([felt(60, [12, 12, 12], 10), felt(62.5, [8, 8, 8], 10)], rule).decision).toBe('hold');
  });

  it('still adds weight at the top of the range, however it felt', () => {
    expect(nextTargets([felt(60, [12, 12, 12], 10)], rule).decision).toBe('add_weight');
  });

  it('still repeats a failed session, however it felt', () => {
    expect(nextTargets([felt(60, [9, 8, 7], 6)], rule).decision).toBe('repeat');
  });

  it('adds two reps at bodyweight too', () => {
    expect(reps(nextTargets([felt(0, [12, 12, 12], 6)], rule))).toEqual([14, 14, 14]);
  });
});

describe('isProgress', () => {
  it.each([
    ['add_weight', true],
    ['add_reps', true],
    ['add_two_reps', true],
    ['hold', false],
    ['repeat', false],
    ['deload', false],
  ] as const)('%s → %s', (decision, expected) => {
    expect(isProgress(decision)).toBe(expected);
  });
});

describe('bodyweight (weight 0)', () => {
  it('never adds weight and keeps adding reps past the top of the range', () => {
    const r = nextTargets([session(0, [12, 13, 12])], rule);
    expect(r.decision).toBe('add_reps');
    expect(weights(r)).toEqual([0, 0, 0]);
    expect(reps(r)).toEqual([13, 14, 13]);
  });

  it('retries once after a failure', () => {
    const r = nextTargets([session(0, [8, 7, 6])], rule);
    expect(r.decision).toBe('repeat');
    expect(reps(r)).toEqual([8, 8, 8]);
  });

  it('lowers the target to what was done after two failures, never under 1', () => {
    const r = nextTargets([session(0, [3, 2, 1]), session(0, [3, 2, 0])], rule);
    expect(r.decision).toBe('ease');
    expect(weights(r)).toEqual([0, 0, 0]);
    expect(reps(r)).toEqual([3, 2, 1]);
  });

  it('progresses from the lowered target, one rep at a time', () => {
    const lowered = [3, 2, 1].map((t) => ({ target: { weight: 0, reps: t } }));
    const r = nextTargets([session(0, [3, 2, 1], lowered)], rule);
    expect(r.decision).toBe('add_reps');
    expect(reps(r)).toEqual([4, 3, 2]);
    expect(isFailedSession(session(0, [3, 1, 1], lowered).sets, rule)).toBe(true);
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

describe('coming back after a break', () => {
  // Dernière séance le 1er janvier 2026 (jour 1)
  const daysLater = (n: number) => new Date(new Date(2026, 0, 1).getTime() + n * 24 * 60 * 60 * 1000);

  it('changes nothing under two weeks', () => {
    expect(nextTargets([session(100, [10, 10, 10])], rule, { now: daysLater(13) }).decision).toBe('add_reps');
  });

  it('starts again at 90 % after two weeks, from the bottom of the range', () => {
    const r = nextTargets([session(100, [12, 12, 12])], rule, { now: daysLater(15) });
    expect(r).toMatchObject({ decision: 'comeback', daysOff: 15 });
    expect(weights(r)).toEqual([90, 90, 90]);
    expect(reps(r)).toEqual([8, 8, 8]);
  });

  it('starts again at 80 % after four weeks, on a loadable weight', () => {
    const r = nextTargets([session(62.5, [10, 10, 10])], rule, { now: daysLater(40) });
    expect(weights(r)).toEqual([50, 50, 50]);
  });

  it('rounds to the nearest step, never under the bar nor to 0', () => {
    expect(comebackWeight(20, 0.9, 2.5, 20)).toBe(20);
    expect(comebackWeight(52.5, 0.9, 2.5, 20)).toBe(47.5);
    expect(comebackWeight(6, 0.9, 2)).toBe(6);
    expect(comebackWeight(2, 0.8, 2.5)).toBe(2);
    const r = nextTargets([session(20, [10, 10, 10])], rule, { now: daysLater(40), minWeight: 20 });
    expect(r.decision).toBe('comeback');
    expect(weights(r)).toEqual([20, 20, 20]);
  });

  it('never comes back at 0 kg on a weight lighter than one step', () => {
    const r = nextTargets([session(2, [10, 10, 10])], rule, { now: daysLater(40) });
    expect(r.decision).toBe('comeback');
    expect(weights(r)).toEqual([2, 2, 2]);
  });

  it('leaves bodyweight lifts alone, and needs to know the date', () => {
    expect(nextTargets([session(0, [10, 10, 10])], rule, { now: daysLater(60) }).decision).toBe('add_reps');
    expect(nextTargets([session(100, [10, 10, 10])], rule).decision).toBe('add_reps');
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

describe('timed (seconds)', () => {
  const held: ProgressionRule = { kind: 'double', sets: 3, repMin: 30, repMax: 60, increment: 2.5, repStep: 5 };

  it('adds 5 s per set, 10 s after an easy one, with no ceiling', () => {
    expect(reps(nextTargets([session(0, [40, 40, 35])], held))).toEqual([45, 45, 40]);
    const easy = nextTargets([session(0, [60, 60, 60], [{}, {}, { rpe: 6 }])], held);
    expect(easy.decision).toBe('add_two_reps');
    expect(reps(easy)).toEqual([70, 70, 70]);
  });
});

describe('drop sets', () => {
  it('never hold the weight back nor count as missed', () => {
    const drop: Partial<WorkoutSet> = { setType: 'drop' };
    const done = nextTargets([session(60, [12, 12, 12, 6], [{}, {}, {}, { ...drop, weight: 45 }])], rule);
    expect(done.decision).toBe('add_weight');
    const short = nextTargets([session(60, [10, 9, 8, 4], [{}, {}, {}, drop])], rule);
    expect(short.decision).toBe('add_reps');
  });
});

describe('top sets and singles', () => {
  const force: ProgressionRule = { kind: 'double', sets: 5, repMin: 3, repMax: 5, increment: 2.5 };
  const singles = () => session(195, [1, 1, 1], [{}, { weight: 202.5 }, { weight: 207.5 }]);

  it('finds no working weight in singles at rising weights', () => {
    expect(workingWeight(singles().sets, force)).toBeNull();
    expect(readSession(singles().sets, force)).toBeNull();
  });

  it('never turns a max test into the next working weight', () => {
    const before = session(170, [5, 5, 5, 5, 4]);
    const r = nextTargets([before, singles()], force);
    expect(r.decision).toBe('add_reps');
    expect(weights(r)).toEqual([170, 170, 170, 170, 170]);
    expect(reps(r)).toEqual([5, 5, 5, 5, 5]);
  });

  it('starts at 70 % of the best single when the max test is all there is', () => {
    const r = nextTargets([singles()], force);
    expect(r.decision).toBe('start');
    expect(weights(r)).toEqual([145, 145, 145, 145, 145]);
  });

  it('counts the break from the max test', () => {
    const before = session(170, [5, 5, 5, 5, 5]);
    const test = singles();
    const now = new Date(new Date(test.date).getTime() + 3 * 24 * 60 * 60 * 1000);
    expect(nextTargets([before, test], force, { now }).decision).toBe('add_weight');
  });

  it('keeps a top set as it was, and lets the back-off sets decide', () => {
    const top = session(165, [3, 5, 5, 5], [{ weight: 185 }]);
    const r = nextTargets([top], { ...force, sets: 4 });
    expect(r.decision).toBe('add_weight');
    expect(r.targets).toEqual([
      { weight: 185, reps: 3, top: true },
      { weight: 167.5, reps: 3 },
      { weight: 167.5, reps: 3 },
      { weight: 167.5, reps: 3 },
    ]);
  });

  it('never counts a top set under the range as a failed session', () => {
    const top = session(100, [3, 10, 10, 10], [{ weight: 120 }]);
    const r = nextTargets([top], rule);
    expect(r.decision).toBe('add_reps');
    expect(r.targets.filter((x) => !x.top).map((x) => x.weight)).toEqual([100, 100]);
  });

  it('recognises a set marked as a top set, and drops it once the working weight catches up', () => {
    const marked = session(60, [12, 12, 12], [{ weight: 62.5, setType: 'top' }]);
    const r = nextTargets([marked], rule);
    expect(r.decision).toBe('add_weight');
    expect(r.targets.some((x) => x.top)).toBe(false);
  });

  it('takes the easier weight on a tie when no set reached the range', () => {
    expect(workingWeight(session(100, [6, 6, 5, 5], [{}, {}, { weight: 105 }, { weight: 105 }]).sets, rule)).toBe(100);
    expect(workingWeight([], rule)).toBeNull();
  });
});

describe('bonus sets past the plan', () => {
  it('never cancel the progression', () => {
    const r = nextTargets([session(40, [12, 12, 12, 7])], rule);
    expect(r.decision).toBe('add_weight');
    expect(weights(r)).toEqual([42.5, 42.5, 42.5]);
  });
});

describe('"+2 reps" only when the targets move by two', () => {
  it('falls back to one rep when capped at the top of the range', () => {
    const r = nextTargets([session(60, [11, 12], [{}, { rpe: 6 }])], rule);
    expect(r.decision).toBe('add_reps');
    expect(reps(r)).toEqual([12, 12, 8]);
  });
});

describe('assisted machine (less help is harder)', () => {
  const assisted = { assisted: true };

  it('takes help away at the top of the range', () => {
    const r = nextTargets([session(30, [12, 12, 12])], rule, assisted);
    expect(r.decision).toBe('add_weight');
    expect(weights(r)).toEqual([27.5, 27.5, 27.5]);
  });

  it('adds help after two failures, and more after a break', () => {
    const r = nextTargets([session(30, [6, 6, 5]), session(30, [6, 5, 5])], rule, assisted);
    expect(r.decision).toBe('deload');
    expect(weights(r)).toEqual([32.5, 32.5, 32.5]);
    const now = new Date(2027, 0, 1);
    expect(weights(nextTargets([session(30, [10, 10, 10])], rule, { ...assisted, now }))).toEqual([35, 35, 35]);
    expect(moreHelp(0, 0.9, 5)).toBe(5);
  });

  it('never counts a set with more help as progress', () => {
    const r = nextTargets([session(30, [12, 12, 12], [{}, {}, { weight: 35 }])], rule, assisted);
    expect(r.decision).toBe('add_reps');
    expect(reps(r)).toEqual([12, 12, 12]);
  });

  it('never starts from a max test', () => {
    const test = session(30, [1, 1], [{}, { weight: 20 }]);
    expect(nextTargets([test], rule, assisted).decision).toBe('calibrate');
  });
});

describe('lighter ramp-up sets not marked as warm-ups (imported history)', () => {
  /** One session from [weight, reps] pairs, in the order they were done. */
  const ramp = (pairs: [number, number][], extra: Partial<WorkoutSet> = {}): ExerciseSession => {
    day++;
    return {
      date: new Date(2026, 0, day).toISOString(),
      sets: pairs.map(([weight, r]) => ({ weight, reps: r, setType: 'normal', completed: true, ...extra })),
    };
  };
  const planned = (s: ExerciseSession, assisted = false) =>
    readSession(s.sets, rule, assisted)?.planned.map((x) => [x.weight, x.reps]);

  it.each<[string, [number, number][], [number, number][]]>([
    [
      'ramp-up then 3 working sets',
      [
        [20, 10],
        [40, 8],
        [60, 8],
        [60, 8],
        [60, 8],
      ],
      [
        [60, 8],
        [60, 8],
        [60, 8],
      ],
    ],
    [
      'ramp-up under the range',
      [
        [20, 5],
        [40, 3],
        [60, 10],
        [60, 9],
        [60, 8],
      ],
      [
        [60, 10],
        [60, 9],
        [60, 8],
      ],
    ],
    [
      'lighter back-off after the working sets',
      [
        [60, 10],
        [60, 10],
        [50, 12],
      ],
      [
        [60, 10],
        [60, 10],
        [50, 12],
      ],
    ],
    [
      'ramp-up and a back-off',
      [
        [40, 10],
        [60, 10],
        [60, 10],
        [50, 12],
      ],
      [
        [60, 10],
        [60, 10],
        [50, 12],
      ],
    ],
  ])('%s', (_, pairs, expected) => {
    expect(planned(ramp(pairs))).toEqual(expected);
  });

  it('reads 3×8 at 60 after a ramp-up: +1 rep, not a lighter target', () => {
    const r = nextTargets(
      [
        ramp([
          [20, 10],
          [40, 8],
          [60, 8],
          [60, 8],
          [60, 8],
        ]),
      ],
      rule,
    );
    expect(r.decision).toBe('add_reps');
    expect(r.targets).toEqual([
      { weight: 60, reps: 9 },
      { weight: 60, reps: 9 },
      { weight: 60, reps: 9 },
    ]);
  });

  it('adds weight when the 3 working sets hit the top after a ramp-up', () => {
    const r = nextTargets(
      [
        ramp([
          [20, 12],
          [40, 12],
          [60, 12],
          [60, 12],
          [60, 12],
        ]),
      ],
      rule,
    );
    expect(r.decision).toBe('add_weight');
    expect(weights(r)).toEqual([62.5, 62.5, 62.5]);
  });

  it('never counts a short ramp-up set as a failed session', () => {
    const fails = [
      ramp([
        [20, 5],
        [60, 8],
        [60, 8],
        [60, 8],
      ]),
      ramp([
        [20, 5],
        [60, 8],
        [60, 8],
        [60, 8],
      ]),
    ];
    expect(nextTargets(fails, rule).decision).toBe('add_reps');
  });

  it('still counts a lighter back-off under the range as missed', () => {
    expect(
      nextTargets(
        [
          ramp([
            [60, 10],
            [60, 10],
            [50, 6],
          ]),
        ],
        rule,
      ).decision,
    ).toBe('repeat');
  });

  it('keeps a heavier top set as a top set behind a ramp-up', () => {
    const r = nextTargets(
      [
        ramp([
          [40, 10],
          [80, 3],
          [60, 12],
          [60, 12],
        ]),
      ],
      rule,
    );
    expect(r.decision).toBe('add_weight');
    expect(r.targets).toEqual([
      { weight: 80, reps: 3, top: true },
      { weight: 62.5, reps: 8 },
      { weight: 62.5, reps: 8 },
    ]);
  });

  it('assisted: more help before the working help is the ramp-up, less help is not', () => {
    expect(
      planned(
        ramp([
          [50, 10],
          [40, 10],
          [30, 12],
          [30, 12],
          [30, 12],
        ]),
        true,
      ),
    ).toEqual([
      [30, 12],
      [30, 12],
      [30, 12],
    ]);
    const r = nextTargets(
      [
        ramp([
          [50, 10],
          [30, 12],
          [30, 12],
          [30, 12],
        ]),
      ],
      rule,
      { assisted: true },
    );
    expect(r.decision).toBe('add_weight');
    expect(weights(r)).toEqual([27.5, 27.5, 27.5]);
    // Less help first is harder: a top set, never a ramp-up
    const harder = readSession(
      ramp([
        [25, 6],
        [30, 10],
        [30, 10],
        [30, 10],
      ]).sets,
      rule,
      true,
    );
    expect(harder?.top.map((x) => [x.weight, x.reps])).toEqual([[25, 6]]);
  });

  it('timed: holds at the same weight are never a ramp-up', () => {
    const held: ProgressionRule = { kind: 'double', sets: 3, repMin: 30, repMax: 60, increment: 2.5, repStep: 5 };
    const s = ramp([
      [0, 20],
      [0, 40],
      [0, 40],
    ]);
    expect(readSession(s.sets, held)?.planned.map((x) => x.reps)).toEqual([20, 40, 40]);
  });
});
