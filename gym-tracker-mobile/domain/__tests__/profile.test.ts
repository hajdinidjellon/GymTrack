import { describe, expect, it } from '@jest/globals';
import { normalizeProfile } from '@/domain/profile';

describe('normalizeProfile', () => {
  it('keeps a current profile as is', () => {
    const p = { goal: 'force', program: { split: 'ul', perWeek: 4 }, prs: [], bodyStats: [] };
    expect(normalizeProfile(p)).toEqual(p);
  });

  it('maps a profile from the previous app version', () => {
    expect(normalizeProfile({ onboarding: { primaryGoal: 'pr' }, trainingFrequency: 6 })).toEqual({
      goal: 'force',
      program: { split: 'ppl', perWeek: 5 },
      prs: [],
      bodyStats: [],
    });
  });

  it('falls back to sensible defaults', () => {
    expect(normalizeProfile({})).toMatchObject({ goal: 'muscle', program: { split: 'ppl', perWeek: 3 } });
  });

  it('returns null for something that is not a profile', () => {
    expect(normalizeProfile(null)).toBeNull();
    expect(normalizeProfile('profile')).toBeNull();
    expect(normalizeProfile({ goal: 'fly' })).toBeNull();
  });
});
