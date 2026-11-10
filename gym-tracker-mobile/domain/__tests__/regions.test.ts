import { describe, expect, it } from '@jest/globals';
import { EXERCISES, makeCustomExercise, regionOf, regionsOf, REGIONS } from '@/domain/programs';
import { customExerciseSchema } from '@/domain/schemas';
import { t } from '@/i18n';
import type { MuscleGroup, MuscleRegion } from '@/types';

const catalog = Object.values(EXERCISES);
const withRegions = Object.keys(REGIONS) as MuscleGroup[];

describe('regions', () => {
  it('files every catalog exercise of a muscle that has regions', () => {
    const missing = catalog.filter((e) => withRegions.includes(e.muscleGroups[0]!) && !regionOf(e)).map((e) => e.name);
    expect(missing).toEqual([]);
  });

  it('gives every region at least one exercise, and only to its own muscle', () => {
    for (const muscle of withRegions) {
      for (const region of regionsOf(muscle)) {
        const found = catalog.filter((e) => regionOf(e) === region);
        expect(found.length).toBeGreaterThan(0);
        expect(found.every((e) => e.muscleGroups[0] === muscle)).toBe(true);
      }
    }
  });

  it('puts the incline work in the upper chest and the dips in the lower chest', () => {
    expect(regionOf(EXERCISES.incline)).toBe('upperChest');
    expect(regionOf(EXERCISES.lowfly)).toBe('upperChest');
    expect(regionOf(EXERCISES.bench)).toBe('midChest');
    expect(regionOf(EXERCISES.dips)).toBe('lowerChest');
    expect(regionOf(EXERCISES.highfly)).toBe('lowerChest');
    expect(regionOf(EXERCISES.shrug)).toBe('traps');
    expect(regionOf(EXERCISES.pullup)).toBe('lats');
    expect(regionOf(EXERCISES.lateral)).toBe('sideDelts');
  });

  it('has none for the arms and the calves', () => {
    expect(regionsOf('biceps')).toEqual([]);
    expect(regionsOf('calves')).toEqual([]);
    expect(regionOf(EXERCISES.curl)).toBeUndefined();
  });

  it('keeps the region of an own exercise only when it fits its muscle', () => {
    expect(regionOf({ name: 'Mon incliné', muscleGroups: ['chest'], region: 'upperChest' })).toBe('upperChest');
    expect(regionOf({ name: 'Mon rowing', muscleGroups: ['back'], region: 'upperChest' })).toBeUndefined();
    expect(regionOf({ name: 'Rien', muscleGroups: [] })).toBeUndefined();
  });

  it('has a short and a long name for each region, in both languages', () => {
    for (const region of withRegions.flatMap((m) => regionsOf(m)) as MuscleRegion[]) {
      expect(t(`domain.programs.regionTabs.${region}`)).not.toContain('domain.');
      expect(t(`domain.programs.regions.${region}`)).not.toContain('domain.');
    }
  });
});

describe('an own exercise with a region', () => {
  const input = { name: 'Presse inclinée Panatta', equipment: 'machine' as const, category: 'compound' as const };

  it('keeps it when it belongs to the muscle, drops it otherwise', () => {
    expect(makeCustomExercise({ ...input, muscle: 'chest', region: 'upperChest' })).toMatchObject({
      region: 'upperChest',
    });
    expect(makeCustomExercise({ ...input, muscle: 'back', region: 'upperChest' })).not.toHaveProperty('region');
  });

  it('is read back from disk, and a region the app does not know is refused', () => {
    const own = { ...input, muscleGroups: ['chest'], region: 'upperChest' };
    expect(customExerciseSchema.safeParse(own).success).toBe(true);
    expect(customExerciseSchema.safeParse({ ...own, region: 'moon' }).success).toBe(false);
  });
});
