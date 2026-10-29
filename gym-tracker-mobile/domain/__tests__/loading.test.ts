import { describe, expect, it } from '@jest/globals';
import { loadFactor, loadHint, loadingOf, missingPerSide, sidePlates } from '@/domain/loading';

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
