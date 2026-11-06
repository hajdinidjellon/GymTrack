import { describe, expect, it } from '@jest/globals';
import {
  isWarmup,
  roundWarmupLoad,
  setNumber,
  skipWarmups,
  warmupSets,
  warmupsOn,
  withWarmups,
  workingCount,
  type WarmupSettings,
} from '@/domain/warmup';
import type { ActiveExercise, WorkoutSet } from '@/types';
import { active } from './fixtures';

const gym = { barWeight: 20, plates: [20, 15, 10, 5, 2.5, 1.25] };

describe('warm-ups with collars', () => {
  it('start from the bar and its collars', () => {
    const sets = warmupSets(bench(100), false, { ...gym, collarWeight: 2.5 });
    expect(sets[0]?.weight).toBe(25);
    // every warm-up loads exactly: bar + collars + plates
    for (const s of sets) expect(((s.weight - 25) / 2) % 1.25).toBe(0);
  });
});
const settings: WarmupSettings = { ...gym, warmups: true, warmupOverrides: {} };
const loads = (sets: WorkoutSet[]) => sets.map((s) => [s.weight, s.reps]);

const bench = (weight: number, patch: Partial<ActiveExercise> = {}) =>
  active(
    'Développé couché',
    [
      { weight, reps: 8 },
      { weight, reps: 8 },
    ],
    patch,
  );

describe('warmupSets', () => {
  it('ramps from the empty bar to about 80 % on the first big lift', () => {
    const sets = warmupSets(bench(100), false, gym);
    expect(loads(sets)).toEqual([
      [20, 10],
      [40, 5],
      [60, 3],
      [80, 2],
    ]);
    expect(sets.every((s) => s.setType === 'warmup' && s.completed === false)).toBe(true);
  });

  it('rests only after the last warm-up, never longer than the exercise itself', () => {
    expect(warmupSets(bench(100), false, gym).map((s) => s.restTime)).toEqual([0, 0, 0, 90]);
    const shortRest = bench(100);
    shortRest.sets = shortRest.sets.map((s) => ({ ...s, restTime: 60 }));
    expect(warmupSets(shortRest, false, gym).at(-1)?.restTime).toBe(60);
    const noRest = bench(100);
    noRest.sets = noRest.sets.map(({ restTime: _r, ...s }) => s);
    expect(warmupSets(noRest, false, gym).at(-1)?.restTime).toBe(90);
  });

  it('adds a closer step on a very heavy lift', () => {
    expect(loads(warmupSets(bench(150), false, gym)).map(([kg]) => kg)).toEqual([20, 60, 90, 120, 135]);
  });

  it('skips the steps that would not be heavier than the one before', () => {
    expect(loads(warmupSets(bench(30), false, gym))).toEqual([
      [20, 10],
      [22.5, 2],
    ]);
  });

  it('rounds down to the plates the gym really has', () => {
    const sets = warmupSets(bench(90), false, { barWeight: 20, plates: [20, 10, 5] });
    expect(sets.map((s) => s.weight)).toEqual([20, 30, 50, 70]);
  });

  it('gives a single closer set when the muscle is already warm', () => {
    expect(loads(warmupSets(bench(100), true, gym))).toEqual([[70, 3]]);
    expect(warmupSets(bench(100, { category: 'isolation' }), true, gym)).toEqual([]);
  });

  it('uses a short ramp on dumbbells and machines, rounded to their step', () => {
    const dumbbell = bench(30, {
      equipment: 'dumbbell',
      rule: { kind: 'double', sets: 3, repMin: 8, repMax: 12, increment: 2 },
    });
    expect(loads(warmupSets(dumbbell, false, gym))).toEqual([
      [14, 6],
      [22, 3],
    ]);
    const plateLoaded = bench(40, { equipment: 'machine', plateLoaded: true });
    expect(loads(warmupSets(plateLoaded, false, gym))).toEqual([
      [20, 6],
      [30, 3],
    ]);
  });

  it('gives one light set to an isolation exercise on a cold muscle', () => {
    const fly = bench(50, {
      equipment: 'machine',
      category: 'isolation',
      rule: { kind: 'double', sets: 3, repMin: 10, repMax: 15, increment: 5 },
    });
    expect(loads(warmupSets(fly, false, gym))).toEqual([[25, 8]]);
  });

  it('gives nothing when there is nothing to warm up to', () => {
    expect(warmupSets(bench(20), false, gym)).toEqual([]);
    expect(warmupSets(bench(0, { equipment: 'machine' }), false, gym)).toEqual([]);
    expect(warmupSets(bench(60, { needsWeight: true }), false, gym)).toEqual([]);
    expect(warmupSets(bench(0, { equipment: 'bodyweight' }), false, gym)).toEqual([]);
    expect(warmupSets(active('x', []), false, gym)).toEqual([]);
  });
});

describe('roundWarmupLoad', () => {
  it('never goes under the empty bar', () => {
    expect(roundWarmupLoad('bar', 12, gym, 2.5)).toBe(20);
  });

  it('rounds the stack and the dumbbells down to their step', () => {
    expect(roundWarmupLoad('stack', 37, gym, 5)).toBe(35);
    expect(roundWarmupLoad('perHand', 13, gym, 2)).toBe(12);
  });
});

describe('warmupsOn', () => {
  it("follows the exercise's own choice, else the global one", () => {
    expect(warmupsOn('Squat', settings)).toBe(true);
    expect(warmupsOn('Squat', { warmups: true, warmupOverrides: { Squat: false } })).toBe(false);
    expect(warmupsOn('Squat', { warmups: false, warmupOverrides: { Squat: true } })).toBe(true);
    expect(warmupsOn('Dips', { warmups: false, warmupOverrides: {} })).toBe(false);
  });
});

describe('withWarmups', () => {
  const fly = () =>
    active('Écarté poulie', [{ weight: 30, reps: 12 }], {
      category: 'isolation',
      equipment: 'machine',
      rule: { kind: 'double', sets: 3, repMin: 10, repMax: 15, increment: 5 },
    });
  const squat = () => active('Squat', [{ weight: 100, reps: 5 }], { muscleGroups: ['legs'] });

  it('ramps the first exercise of each muscle, not the ones after it', () => {
    const [b, f, s] = withWarmups([bench(100), fly(), squat()], settings);
    expect(b!.sets.filter(isWarmup)).toHaveLength(4);
    expect(f!.sets.filter(isWarmup)).toHaveLength(0);
    expect(s!.sets.filter(isWarmup)).toHaveLength(4);
  });

  it('computes them again after a reorder, without doubling them', () => {
    const first = withWarmups([bench(100), fly()], settings);
    const swapped = withWarmups([first[1]!, first[0]!], settings);
    expect(loads(swapped[0]!.sets.filter(isWarmup))).toEqual([[15, 8]]);
    expect(loads(swapped[1]!.sets.filter(isWarmup))).toEqual([[70, 3]]);
    expect(workingCount(swapped[1]!.sets)).toBe(2);
  });

  it('leaves started exercises and the ones changed by hand alone', () => {
    const started = bench(100);
    started.sets[0] = { ...started.sets[0]!, completed: true };
    const kept = bench(100, { keepWarmups: true });
    const [a, b] = withWarmups([started, kept], settings);
    expect(a).toBe(started);
    expect(b).toBe(kept);
  });

  it('returns the same exercise when there is nothing to add or remove', () => {
    const dips = active('Dips', [{ weight: 0, reps: 10 }], { equipment: 'bodyweight' });
    expect(withWarmups([dips], settings)[0]).toBe(dips);
  });

  it('takes the warm-ups away once they are turned off', () => {
    const [warm] = withWarmups([bench(100)], settings);
    const [off] = withWarmups([warm!], { ...settings, warmups: false });
    expect(off!.sets.filter(isWarmup)).toEqual([]);
    const [own] = withWarmups([warm!], { ...settings, warmupOverrides: { 'Développé couché': false } });
    expect(own!.sets.filter(isWarmup)).toEqual([]);
  });
});

describe('skipWarmups', () => {
  it('drops the warm-ups left, keeps the ones done, and stays that way', () => {
    const [warm] = withWarmups([bench(100)], settings);
    warm!.sets[0] = { ...warm!.sets[0]!, completed: true };
    const skipped = skipWarmups(warm!);
    expect(skipped.keepWarmups).toBe(true);
    expect(loads(skipped.sets)).toEqual([
      [20, 10],
      [100, 8],
      [100, 8],
    ]);
  });
});

describe('numbering', () => {
  const sets = [
    { setType: 'warmup' as const, completed: true },
    { setType: 'warmup' as const },
    { setType: 'normal' as const, completed: true },
    { setType: 'normal' as const },
    { setType: 'normal' as const },
  ];

  it('numbers warm-ups and working sets apart', () => {
    expect(setNumber(sets, 1)).toEqual({ warmup: true, drop: false, n: 2, total: 2 });
    expect(setNumber(sets, 3)).toEqual({ warmup: false, drop: false, n: 2, total: 3 });
    expect(setNumber(sets, 9)).toEqual({ warmup: false, drop: false, n: 3, total: 3 });
  });

  it('counts the working sets, all, done or left', () => {
    expect(workingCount(sets)).toBe(3);
    expect(workingCount(sets, 'done')).toBe(1);
    expect(workingCount(sets, 'left')).toBe(2);
  });
});
