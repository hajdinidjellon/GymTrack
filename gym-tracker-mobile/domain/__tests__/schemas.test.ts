import { describe, expect, it } from '@jest/globals';
import { parseList, profileSchema, settingsPatchSchema, workoutSchema } from '@/domain/schemas';
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
  });
});

describe('settingsPatchSchema', () => {
  it('accepts a partial patch', () => {
    expect(settingsPatchSchema.parse({ voice: false })).toEqual({ voice: false });
  });

  it('rejects wrong types', () => {
    expect(settingsPatchSchema.safeParse({ plates: 'all' }).success).toBe(false);
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
