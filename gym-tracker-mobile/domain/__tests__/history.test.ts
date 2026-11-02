import { describe, expect, it } from '@jest/globals';
import { byDate, loggedExercises, setsDone } from '@/domain/history';
import { lift, workout } from './fixtures';

describe('loggedExercises', () => {
  it('keeps only the sets done, with their effort', () => {
    const bench = lift('Développé couché', 80, [10, 9, 8]);
    bench.sets[0] = { ...bench.sets[0]!, setType: 'warmup', weight: 40 };
    bench.sets[1] = { ...bench.sets[1]!, rpe: 10 };
    bench.sets[2] = { ...bench.sets[2]!, completed: false };
    const skipped = lift('Dips', 0, [10]);
    skipped.sets[0] = { ...skipped.sets[0]!, completed: false };
    const w = workout('2026-11-01', 'Haut', [bench, skipped, lift('Curl haltères', 14, [12])]);

    expect(loggedExercises(w)).toEqual([
      {
        name: 'Développé couché',
        sets: [
          { weight: 40, reps: 10, warmup: true, effort: undefined },
          { weight: 80, reps: 9, warmup: false, effort: 'max' },
        ],
      },
      { name: 'Curl haltères', sets: [{ weight: 14, reps: 12, warmup: false, effort: undefined }] },
    ]);
    expect(setsDone(w)).toBe(2);
  });
});

describe('byDate', () => {
  it('puts the newest first', () => {
    const list = [
      workout('2026-10-20', 'Push', []),
      workout('2026-11-01', 'Haut', []),
      workout('2026-10-25', 'Pull', []),
    ];
    expect(byDate(list).map((w) => w.name)).toEqual(['Haut', 'Pull', 'Push']);
  });
});
