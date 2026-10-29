import { describe, expect, it } from '@jest/globals';
import { loadHint, loadingOf, sidePlates } from '@/domain/loading';

const gym = { barWeight: 20, plates: [20, 15, 10, 5, 2.5, 1.25] };

describe('loadingOf', () => {
  it.each([
    [{ equipment: 'barbell' as const }, 'bar'],
    [{ equipment: 'dumbbell' as const }, 'perHand'],
    [{ equipment: 'machine' as const, plateLoaded: true }, 'perSide'],
    [{ equipment: 'machine' as const }, 'stack'],
    [{ equipment: 'bodyweight' as const }, 'stack'],
  ])('%o counts as %s', (exercise, loading) => {
    expect(loadingOf(exercise)).toBe(loading);
  });
});

describe('sidePlates', () => {
  it('takes the bar off first, but not on a plate-loaded machine', () => {
    expect(sidePlates('bar', 70, gym)).toEqual([20, 5]);
    expect(sidePlates('perSide', 25, gym)).toEqual([20, 5]);
    expect(sidePlates('perHand', 12, gym)).toEqual([]);
  });
});

describe('loadHint', () => {
  it('says what goes on each side', () => {
    expect(loadHint('bar', 62.5, gym)).toBe('Par côté : 20 + 1,25');
    expect(loadHint('bar', 20, gym)).toBe('Barre à vide');
    expect(loadHint('perSide', 25, gym)).toBe('De chaque côté : 20 + 5');
    expect(loadHint('perSide', 0, gym)).toBe('De chaque côté');
  });

  it('says a dumbbell weight is per dumbbell, and nothing for a stack', () => {
    expect(loadHint('perHand', 12, gym)).toBe('Par haltère');
    expect(loadHint('stack', 40, gym)).toBeNull();
  });
});
