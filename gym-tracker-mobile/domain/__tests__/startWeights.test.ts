import { describe, expect, it } from '@jest/globals';
import { EXERCISES } from '@/domain/programs';
import { startPresets } from '@/domain/startWeights';

const first = (def: Parameters<typeof startPresets>[0]) => startPresets(def)[0];

describe('startPresets', () => {
  it.each([
    ['the squat, heavy on the bar', EXERCISES.squat, 40],
    ['the bench, on the bar', EXERCISES.bench, 20],
    ['a bar curl', EXERCISES.barcurl, 20],
    ['the Smith bench', EXERCISES.smithbench, 10],
    ['the leg press, per side', EXERCISES.legpress, 20],
    ['the chest press, per side', EXERCISES.chestpress, 10],
    ['the lat pulldown on the cable', EXERCISES.pulldown, 30],
    ['a cable fly', EXERCISES.fly, 5],
    ['a cable kickback for the glutes', EXERCISES.glutekick, 10],
    ['the pec deck, a stack', EXERCISES.pecdeck, 10],
    ['the leg extension, a stack', EXERCISES.legext, 20],
    ['a dumbbell press', EXERCISES.dbbench, 8],
    ['lateral raises', EXERCISES.lateral, 4],
    ['goblet squats', EXERCISES.goblet, 8],
  ])('starts %s at its own weights', (_, def, lightest) => {
    expect(startPresets(def)).toHaveLength(6);
    expect(first(def)).toBe(lightest);
  });

  it('offers nothing for a bodyweight exercise', () => {
    expect(startPresets(EXERCISES.dips)).toEqual([]);
  });

  it('follows the user when a machine takes plates', () => {
    expect(first({ ...EXERCISES.pecdeck, plateLoaded: true })).toBe(5);
  });

  it('lists the weights lightest first', () => {
    for (const def of Object.values(EXERCISES)) {
      const presets = startPresets(def);
      expect([...presets].sort((a, b) => a - b)).toEqual(presets);
    }
  });
});
