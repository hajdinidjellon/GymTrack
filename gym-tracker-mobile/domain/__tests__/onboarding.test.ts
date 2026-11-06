import { describe, expect, it } from '@jest/globals';
import {
  answersWeek,
  calibrationPreset,
  experienceTip,
  firstSession,
  goalTip,
  rhythmTip,
  sessionLetter,
  sessionNames,
  splitFor,
  weekLegend,
  scheduleLegend,
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

describe('answersWeek', () => {
  it('shows the example week of the rhythm until days are picked', () => {
    expect(answersWeek({ perWeek: 3, schedule: null })).toEqual([
      'Full body A',
      null,
      'Full body B',
      null,
      'Full body A',
      null,
      null,
    ]);
    const picked = [null, 'Haut', null, 'Bas', null, null, null];
    expect(answersWeek({ perWeek: 4, schedule: picked })).toBe(picked);
  });
});

describe('sessionLetter', () => {
  it('gives each session its letter in the program order', () => {
    expect(sessionLetter('Pull', sessionNames(5))).toBe('B');
    expect(sessionLetter('Inconnue', sessionNames(5))).toBe('A');
  });
});

describe('firstSession', () => {
  const names = sessionNames(4);
  // 2026-11-04 is a Wednesday
  const wednesday = new Date(2026, 10, 4, 12);

  it("is today's session in the week", () => {
    expect(firstSession([null, null, 'Bas', null, null, null, null], names, wednesday)).toBe('Bas');
  });

  it("is the program's first on a rest day or without a week", () => {
    expect(firstSession(['Bas', null, null, null, null, null, null], names, wednesday)).toBe('Haut');
    expect(firstSession(null, names, wednesday)).toBe('Haut');
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
    // The sessions placed in the week, not the rhythm picked
    expect(rhythmTip(4, 5)[0]).toBe('5 séances,');
    expect(experienceTip('new')[1]).toContain('Barre à vide');
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

describe('scheduleLegend', () => {
  it('is the program legend without own days', () => {
    expect(scheduleLegend('ppl', ['Push', 'Pull', 'Legs'])).toBe('A Push · B Pull · C Legs');
    expect(scheduleLegend('fb', ['Full body A', 'Full body B'])).toContain('full body');
  });

  it('gives the own days their letter after the program', () => {
    expect(scheduleLegend('ul', ['Haut', 'Bas', 'Haut B'])).toBe('A Haut · B Bas · C Haut B');
  });
});
