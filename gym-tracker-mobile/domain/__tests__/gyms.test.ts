import { describe, expect, it } from '@jest/globals';
import { findGym, GYM_CHAINS, HOME_GYM, POPULAR_GYMS, searchGyms } from '@/domain/gyms';

describe('gyms', () => {
  it('offers the four best known chains first', () => {
    expect(POPULAR_GYMS.map((g) => g.name)).toEqual(['Basic-Fit', 'Fitness Park', "L'Orange Bleue", 'Keepcool']);
  });

  it('knows the machine steps of the chains it has sources for, nothing for the others', () => {
    expect(findGym('basicfit')).toMatchObject({ stackStep: 4.5, cableStep: 2.3, barWeight: 20 });
    expect(findGym('fitnesspark')).toMatchObject({ stackStep: 5, cableStep: 2.5 });
    expect(findGym('neoness')).toMatchObject({ stackStep: null, cableStep: null });
    expect(findGym('home')).toBe(HOME_GYM);
    expect(findGym(null)).toBeUndefined();
  });

  it('finds a chain from part of its name, accents, case and dashes aside', () => {
    expect(searchGyms('orange').map((g) => g.id)).toEqual(['orangebleue']);
    expect(searchGyms('basic fit').map((g) => g.id)).toEqual(['basicfit']);
    expect(searchGyms('VITA LIBERTE').map((g) => g.id)).toEqual(['vitaliberte']);
    expect(searchGyms('  ')).toEqual([]);
    expect(searchGyms('zzz')).toEqual([]);
  });

  it('has no chain twice', () => {
    expect(new Set(GYM_CHAINS.map((g) => g.id)).size).toBe(GYM_CHAINS.length);
  });
});
