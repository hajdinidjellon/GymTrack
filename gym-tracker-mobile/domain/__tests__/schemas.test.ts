import { describe, expect, it } from '@jest/globals';
import {
  parseList,
  parseSettingsPatch,
  profileSchema,
  SETTINGS_LIMITS,
  settingsPatchSchema,
  workoutSchema,
} from '@/domain/schemas';
import { lift, workout } from './fixtures';

describe('workoutSchema', () => {
  it('accepts a workout written by the app', () => {
    const w = workout('2026-10-20T18:00:00.000Z', 'Push', [lift('Squat', 100, [5, 5, 5])]);
    expect(workoutSchema.parse(w)).toEqual(w);
  });

  it.each([
    ['a negative weight', { weight: -5 }],
    ['an absurd weight', { weight: 5000 }],
    ['fractional reps', { reps: 2.5 }],
    ['an unknown set type', { setType: 'mega' }],
  ])('rejects %s', (_label, patch) => {
    const w = workout('2026-10-20', 'Push', [lift('Squat', 100, [5])]);
    w.exercises[0]!.sets[0] = { ...w.exercises[0]!.sets[0]!, ...(patch as object) };
    expect(workoutSchema.safeParse(w).success).toBe(false);
  });

  it('rejects an invalid date', () => {
    expect(workoutSchema.safeParse(workout('not a date', 'Push', [])).success).toBe(false);
  });

  it('drops unknown fields instead of carrying them along', () => {
    const w = { ...workout('2026-10-20', 'Push', []), injected: '<script>' };
    expect(workoutSchema.parse(w)).not.toHaveProperty('injected');
  });
});

describe('profileSchema', () => {
  const profile = { goal: 'muscle', program: { split: 'ppl', perWeek: 3 }, prs: [], bodyStats: [] };

  it('accepts a valid profile', () => {
    expect(profileSchema.safeParse(profile).success).toBe(true);
  });

  it('rejects an unknown split or an impossible frequency', () => {
    expect(profileSchema.safeParse({ ...profile, program: { split: 'bro', perWeek: 3 } }).success).toBe(false);
    expect(profileSchema.safeParse({ ...profile, program: { split: 'ppl', perWeek: 9 } }).success).toBe(false);
    const week = ['Push', null, 'Pull', null, 'Legs', null, null];
    expect(profileSchema.safeParse({ ...profile, program: { split: 'ppl', perWeek: 3, schedule: week } }).success).toBe(
      true,
    );
    expect(
      profileSchema.safeParse({ ...profile, program: { split: 'ppl', perWeek: 3, schedule: week.slice(1) } }).success,
    ).toBe(false);
  });
});

describe('settingsPatchSchema', () => {
  it('accepts a partial patch', () => {
    expect(settingsPatchSchema.parse({ voice: false })).toEqual({ voice: false });
  });

  it('rejects wrong types', () => {
    expect(settingsPatchSchema.safeParse({ plates: 'all' }).success).toBe(false);
  });

  it('checks own rests and own exercises', () => {
    const own = { name: 'Écarté Panatta', equipment: 'machine', category: 'isolation', muscleGroups: ['chest'] };
    expect(settingsPatchSchema.parse({ restOverrides: { Squat: 150 }, customExercises: [own] })).toEqual({
      restOverrides: { Squat: 150 },
      customExercises: [own],
    });
    // A broken entry is dropped, never the whole list
    expect(settingsPatchSchema.parse({ restOverrides: { Squat: 5, Bench: 120 } })).toEqual({
      restOverrides: { Bench: 120 },
    });
    expect(settingsPatchSchema.parse({ customExercises: [{ ...own, name: '  ' }, own] })).toEqual({
      customExercises: [own],
    });
    expect(settingsPatchSchema.parse({ customExercises: [{ ...own, muscleGroups: [] }] })).toEqual({
      customExercises: [],
    });
  });
});

describe('parseSettingsPatch', () => {
  const own = { name: 'Écarté Panatta', equipment: 'machine', category: 'isolation', muscleGroups: ['chest'] };

  it('keeps every good field when one is broken', () => {
    expect(parseSettingsPatch({ voice: false, barWeight: 'heavy', plates: [20, 10] })).toEqual({
      voice: false,
      plates: [20, 10],
    });
  });

  it('cuts a list longer than the app keeps, instead of losing it', () => {
    const names = Array.from({ length: 35 }, (_, i) => `Exo ${i}`);
    const parsed = parseSettingsPatch({ customDays: { 'ppl/Push': names }, ownDays: { ppl: names } });
    expect(parsed.customDays?.['ppl/Push']).toEqual(names.slice(0, SETTINGS_LIMITS.dayExercises));
    expect(parsed.ownDays?.ppl).toHaveLength(SETTINGS_LIMITS.ownDays);
    const many = Array.from({ length: 205 }, (_, i) => ({ ...own, name: `Own ${i}` }));
    expect(parseSettingsPatch({ customExercises: many }).customExercises).toHaveLength(SETTINGS_LIMITS.customExercises);
  });

  it('ignores unknown keys and what is not an object', () => {
    expect(parseSettingsPatch({ hacked: true, toString: 1, voice: true })).toEqual({ voice: true });
    expect(parseSettingsPatch(null)).toEqual({});
    expect(parseSettingsPatch([1, 2])).toEqual({});
    expect(parseSettingsPatch('voice')).toEqual({});
  });
});

describe('parseList', () => {
  it('keeps the valid items and counts the others', () => {
    const good = workout('2026-10-20', 'Push', []);
    const { valid, rejected } = parseList(workoutSchema, [good, null, { id: 'x' }]);
    expect(valid).toEqual([good]);
    expect(rejected).toBe(2);
  });
});
