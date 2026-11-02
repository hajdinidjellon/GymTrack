import { describe, expect, it } from '@jest/globals';
import { bestE1rm, e1rm, repRecords } from '@/domain/strength';
import type { ExerciseSession } from '@/domain/progression';
import type { SetType } from '@/types';

const session = (date: string, sets: [number, number, SetType?][]): ExerciseSession => ({
  date,
  sets: sets.map(([weight, reps, setType = 'normal']) => ({ weight, reps, setType, completed: true })),
});

describe('e1rm', () => {
  it('estimates with Epley, to the half kilo', () => {
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(80, 8)).toBe(101.5);
    expect(e1rm(100, 5)).toBe(116.5);
  });

  it('does not estimate past 12 reps, nor without weight', () => {
    expect(e1rm(50, 13)).toBeNull();
    expect(e1rm(0, 8)).toBeNull();
    expect(e1rm(60, 0)).toBeNull();
  });
});

describe('bestE1rm', () => {
  it('keeps the best estimate ever, warm-ups and drops left out', () => {
    const history = [
      session('2026-10-20', [
        [100, 5],
        [120, 3, 'warmup'],
      ]),
      session('2026-10-01', [
        [80, 8],
        [140, 5, 'drop'],
      ]),
      session('2026-10-27', [[90, 9]]),
    ];
    expect(bestE1rm(history)).toEqual({ value: 117, weight: 90, reps: 9, date: '2026-10-27' });
  });

  it('gives nothing without a set to estimate from', () => {
    expect(bestE1rm([session('2026-10-01', [[0, 12]])])).toBeNull();
    expect(bestE1rm([])).toBeNull();
  });

  it('lets the first to reach a value keep it', () => {
    const history = [session('2026-10-08', [[100, 1]]), session('2026-10-01', [[100, 1]])];
    expect(bestE1rm(history)?.date).toBe('2026-10-01');
  });
});

describe('repRecords', () => {
  it('keeps the heaviest weight for at least N reps, without the ones beaten by more reps', () => {
    const history = [
      session('2026-10-01', [
        [100, 1],
        [90, 5],
        [80, 10],
      ]),
      session('2026-10-08', [
        [85, 8],
        [60, 15],
        [80, 12, 'drop'],
      ]),
    ];
    expect(repRecords(history)).toEqual([
      { reps: 1, weight: 100, date: '2026-10-01' },
      { reps: 5, weight: 90, date: '2026-10-01' },
      { reps: 8, weight: 85, date: '2026-10-08' },
      { reps: 10, weight: 80, date: '2026-10-01' },
      { reps: 15, weight: 60, date: '2026-10-08' },
    ]);
  });

  it('is empty at bodyweight', () => {
    expect(repRecords([session('2026-10-01', [[0, 20]])])).toEqual([]);
  });
});
