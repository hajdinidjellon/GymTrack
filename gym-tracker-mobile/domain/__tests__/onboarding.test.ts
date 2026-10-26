import { describe, expect, it } from '@jest/globals';
import {
  calibrationPreset,
  experienceTip,
  goalTip,
  rhythmTip,
  splitFor,
  weekLegend,
  weekPlan,
} from '@/domain/onboarding';

describe('splitFor', () => {
  it.each([
    [2, 'fb'],
    [3, 'fb'],
    [4, 'ul'],
    [5, 'ppl'],
    [6, 'ppl'],
  ])('%i sessions a week → %s', (perWeek, split) => {
    expect(splitFor(perWeek)).toBe(split);
  });
});

describe('weekPlan', () => {
  it('alternates A and B on three days for a full body', () => {
    expect(weekPlan(3)).toEqual(['A', null, 'B', null, 'A', null, null]);
  });

  it('cycles the three days of push / pull / legs', () => {
    expect(weekPlan(5)).toEqual(['A', 'B', 'C', null, 'A', 'B', null]);
  });

  it('always leaves Sunday off', () => {
    for (const n of [2, 3, 4, 5, 6]) {
      expect(weekPlan(n).filter(Boolean)).toHaveLength(n);
      expect(weekPlan(n)[6]).toBeNull();
    }
  });

  it('falls back to three days for an unknown rhythm', () => {
    expect(weekPlan(9).filter(Boolean)).toHaveLength(3);
  });
});

describe('weekLegend', () => {
  it('names the days of the split', () => {
    expect(weekLegend(4)).toBe('A Haut · B Bas');
    expect(weekLegend(6)).toBe('A Push · B Pull · C Legs');
    expect(weekLegend(2)).toContain('full body');
  });
});

describe('tips', () => {
  it('reacts to every answer', () => {
    expect(goalTip('force')[1]).toContain('5 reps');
    expect(rhythmTip(3)).toEqual(['3 séances,', expect.stringContaining('full body')]);
    expect(rhythmTip(4)[1]).toContain('deux fois');
    expect(experienceTip('new')[1]).toContain('Barre seule');
  });
});

describe('calibrationPreset', () => {
  const presets = [20, 30, 40, 50, 60, 80];

  it('starts a beginner on the empty bar and goes heavier with experience', () => {
    expect(calibrationPreset(presets, 'new')).toBe(20);
    expect(calibrationPreset(presets, 'months')).toBe(40);
    expect(calibrationPreset(presets, 'years')).toBe(50);
  });

  it('keeps the middle preset when the experience is unknown', () => {
    expect(calibrationPreset(presets, undefined)).toBe(40);
  });

  it('stays inside short preset lists', () => {
    expect(calibrationPreset([10, 20], 'years')).toBe(20);
    expect(calibrationPreset([], 'new')).toBeUndefined();
  });
});
