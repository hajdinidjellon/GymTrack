import { describe, expect, it } from '@jest/globals';
import { removeOwnExercise, updateOwnExercise } from '@/domain/ownExercises';
import { findExerciseDef } from '@/domain/programs';

const press = {
  name: 'Presse Hamer',
  equipment: 'machine' as const,
  category: 'compound' as const,
  muscleGroups: ['legs' as const],
};
const settings = {
  customExercises: [press],
  customDays: { 'ppl/Legs': ['Squat', 'Presse Hamer'] },
  supersets: { 'ppl/Legs': ['Presse Hamer'] },
  ruleOverrides: { 'Presse Hamer': { sets: 4, repMin: 8, repMax: 10 } },
  restOverrides: { 'Presse Hamer': 120 },
  increments: { 'Presse Hamer': 5 },
  exerciseNotes: { 'Presse Hamer': 'siège 4' },
  plateLoaded: { 'Presse Hamer': true },
  warmupOverrides: { 'Presse Hamer': false },
  manualProgression: { 'Presse Hamer': true },
};

describe('own exercises', () => {
  it('fixes a typo: everything under the name follows, the old name stays an alias', () => {
    const patch = updateOwnExercise(settings, 'Presse Hamer', { ...press, name: 'Presse Hammer' });
    expect(patch.customExercises).toEqual([{ ...press, name: 'Presse Hammer', aliases: ['Presse Hamer'] }]);
    expect(patch.customDays).toEqual({ 'ppl/Legs': ['Squat', 'Presse Hammer'] });
    expect(patch.supersets).toEqual({ 'ppl/Legs': ['Presse Hammer'] });
    expect(patch.ruleOverrides).toEqual({ 'Presse Hammer': { sets: 4, repMin: 8, repMax: 10 } });
    expect(patch.exerciseNotes).toEqual({ 'Presse Hammer': 'siège 4' });
    expect(patch.manualProgression).toEqual({ 'Presse Hammer': true });
    // Saved sessions under the old name still find it
    expect(findExerciseDef('Presse Hamer', patch.customExercises)?.name).toBe('Presse Hammer');
  });

  it('changes the rest without touching the settings, and ignores an unknown name', () => {
    expect(updateOwnExercise(settings, 'Presse Hamer', { ...press, category: 'isolation' })).toEqual({
      customExercises: [{ ...press, category: 'isolation' }],
    });
    expect(updateOwnExercise(settings, 'Nope', press)).toEqual({});
  });

  it('drops an alias when renamed back to it', () => {
    const once = { ...settings, ...updateOwnExercise(settings, 'Presse Hamer', { ...press, name: 'Presse B' }) };
    const back = updateOwnExercise(once, 'Presse B', { ...press, name: 'Presse Hamer' });
    expect(back.customExercises).toEqual([{ ...press, aliases: ['Presse B'] }]);
  });

  it('removes it from the list, every day and every setting', () => {
    const patch = removeOwnExercise(settings, 'Presse Hamer');
    expect(patch.customExercises).toEqual([]);
    expect(patch.customDays).toEqual({ 'ppl/Legs': ['Squat'] });
    expect(patch.supersets).toEqual({ 'ppl/Legs': [] });
    expect(patch.increments).toEqual({});
    expect(patch.warmupOverrides).toEqual({});
  });
});
