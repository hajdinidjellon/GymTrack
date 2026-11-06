import { describe, expect, it } from '@jest/globals';
import {
  incrementChoices,
  loadableIncrement,
  loadableWeight,
  loadFactor,
  loadHint,
  loadingOf,
  missingPerSide,
  sidePlates,
} from '@/domain/loading';

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

describe('increments the plates can make', () => {
  const standard = [20, 15, 10, 5, 2.5, 1.25];
  const change = [...standard, 0.5, 0.25];

  it('offers on the bar only twice a plate the gym has', () => {
    expect(incrementChoices('bar', standard)).toEqual([2.5, 5]);
    expect(incrementChoices('bar', [...standard, 0.5])).toEqual([1, 2, 2.5, 5]);
    expect(incrementChoices('bar', change)).toEqual([0.5, 1, 2, 2.5, 5]);
    expect(incrementChoices('bar', [20, 10, 5])).toEqual([10]);
    expect(incrementChoices('bar', [])).toEqual([5]);
  });

  it('offers one plate per side on a plate-loaded machine, and every step elsewhere', () => {
    expect(incrementChoices('perSide', standard)).toEqual([1.25, 2.5, 5]);
    expect(incrementChoices('perHand', standard)).toEqual([1, 1.25, 2, 2.5, 5]);
    expect(incrementChoices('stack', [])).toEqual([1, 1.25, 2, 2.5, 5]);
  });

  it('moves a step the plates cannot make to the next one they make', () => {
    expect(loadableIncrement('bar', 1.25, standard)).toBe(2.5);
    expect(loadableIncrement('bar', 1, standard)).toBe(2.5);
    expect(loadableIncrement('bar', 2.5, standard)).toBe(2.5);
    expect(loadableIncrement('bar', 10, standard)).toBe(10);
    expect(loadableIncrement('bar', 2.5, [20, 10, 5])).toBe(10);
    expect(loadableIncrement('bar', 7, [20, 10, 5])).toBe(10);
    expect(loadableIncrement('perHand', 1, standard)).toBe(1);
  });

  it('rounds a weight down to what the plates make', () => {
    const gym = { barWeight: 20, plates: standard };
    expect(loadableWeight('bar', 101.25, gym)).toBe(100);
    expect(loadableWeight('bar', 15, gym)).toBe(15);
    expect(loadableWeight('bar', 63, { ...gym, collarWeight: 2.5 })).toBe(62.5);
    expect(loadableWeight('perSide', 26, gym)).toBe(25);
    expect(loadableWeight('perSide', 0, gym)).toBe(0);
    expect(loadableWeight('stack', 41, gym)).toBe(41);
  });
});

describe('collars', () => {
  const comp = { barWeight: 20, plates: [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25], collarWeight: 2.5 };

  it('takes the bar and both collars off before the plates', () => {
    // 210 − 20 − 2 × 2,5 = 185, 92,5 per side
    expect(sidePlates('bar', 210, comp)).toEqual([25, 25, 25, 15, 2.5]);
    expect(missingPerSide('bar', 210, comp)).toBe(0);
    expect(loadHint('bar', 25, comp)).toBe('Barre à vide');
  });

  it('never puts collars on a plate-loaded machine', () => {
    expect(sidePlates('perSide', 25, comp)).toEqual([25]);
  });

  it('says a weight under the bar and its collars', () => {
    expect(loadHint('bar', 22.5, comp)).toBe('Plus léger que la barre et ses colliers (25 kg)');
  });
});

describe('loadHint', () => {
  it('says what goes on each side', () => {
    expect(loadHint('bar', 62.5, gym)).toBe('Par côté : 20 + 1,25');
    expect(loadHint('bar', 20, gym)).toBe('Barre à vide');
    expect(loadHint('perSide', 25, gym)).toBe('De chaque côté : 20 + 5');
    expect(loadHint('perSide', 0, gym)).toBe('De chaque côté');
  });

  it('says what the gym plates cannot make, and a weight under the bar', () => {
    const noSmall = { barWeight: 20, plates: [20, 10, 5, 2.5] };
    expect(missingPerSide('bar', 62.5, noSmall)).toBe(1.25);
    expect(loadHint('bar', 62.5, noSmall)).toBe('Par côté : 20 · il manque 1,25 kg par côté');
    expect(loadHint('perSide', 26, noSmall)).toBe('De chaque côté : 20 + 5 · il manque 1 kg par côté');
    expect(missingPerSide('bar', 15, noSmall)).toBe(0);
    expect(missingPerSide('perHand', 13, noSmall)).toBe(0);
    expect(loadHint('bar', 17.5, gym)).toBe('Plus léger que la barre (20 kg)');
  });

  it('says a dumbbell weight is per dumbbell, and nothing for a stack', () => {
    expect(loadHint('perHand', 12, gym)).toBe('Par haltère');
    expect(loadHint('stack', 40, gym)).toBeNull();
  });
});

describe('loadFactor', () => {
  const settings = { countBothSides: true, customExercises: [], plateLoaded: {} };

  it('counts both sides and both dumbbells when asked', () => {
    const factor = loadFactor(settings);
    expect(factor('Presse à cuisses')).toBe(2);
    expect(factor('Curl haltères')).toBe(2);
    expect(factor('Squat')).toBe(1);
    expect(factor('Pec deck')).toBe(1);
    expect(factor('Inconnu')).toBe(1);
    expect(loadFactor({ ...settings, plateLoaded: { 'Presse à cuisses': false } })('Presse à cuisses')).toBe(1);
  });

  it('counts the weight as logged by default', () => {
    expect(loadFactor({ ...settings, countBothSides: false })('Presse à cuisses')).toBe(1);
  });
});
