import { describe, expect, it } from '@jest/globals';
import {
  defaultSchedule,
  nextScheduled,
  renameInSchedule,
  trainedOn,
  trainingCount,
  validSchedule,
  weekdayIndex,
  weekSessions,
  whenLabel,
} from '@/domain/schedule';
import type { Workout } from '@/types';

const PPL = ['Push', 'Pull', 'Legs'];
// 2026-10-28 is a Wednesday
const WEDNESDAY = new Date(2026, 9, 28, 18);

describe('weekdayIndex', () => {
  it('counts from Monday', () => {
    expect(weekdayIndex(new Date(2026, 9, 26))).toBe(0);
    expect(weekdayIndex(WEDNESDAY)).toBe(2);
    expect(weekdayIndex(new Date(2026, 10, 1))).toBe(6);
  });
});

describe('defaultSchedule', () => {
  it('puts the program days in order on the example days', () => {
    expect(defaultSchedule(PPL, 3)).toEqual(['Push', null, 'Pull', null, 'Legs', null, null]);
    expect(defaultSchedule(['Haut', 'Bas'], 4)).toEqual(['Haut', 'Bas', null, 'Haut', 'Bas', null, null]);
  });

  it('falls back to 3 days, and to rest without program days', () => {
    expect(trainingCount(defaultSchedule(PPL, 9))).toBe(3);
    expect(defaultSchedule([], 3)).toEqual([null, null, null, null, null, null, null]);
  });
});

describe('validSchedule', () => {
  const week = ['Push', null, 'Pull', null, 'Legs', null, null];

  it('keeps a week that fits the program', () => {
    expect(validSchedule(week, PPL)).toBe(week);
  });

  it.each([
    ['missing', undefined],
    ['too short', ['Push']],
    ['unknown day', ['Haut', null, null, null, null, null, null]],
    ['only rest', [null, null, null, null, null, null, null]],
  ])('drops a week that is %s', (_, schedule) => {
    expect(validSchedule(schedule, PPL)).toBeNull();
  });
});

describe('nextScheduled', () => {
  it('finds the next session after today', () => {
    const week = ['Push', null, 'Pull', null, 'Legs', null, null];
    expect(nextScheduled(week, WEDNESDAY)).toEqual({ name: 'Legs', inDays: 2 });
  });

  it('wraps to the same day next week', () => {
    const week = [null, null, 'Pull', null, null, null, null];
    expect(nextScheduled(week, WEDNESDAY)).toEqual({ name: 'Pull', inDays: 7 });
  });

  it('is null for a week of rest', () => {
    expect(nextScheduled([null, null, null, null, null, null, null], WEDNESDAY)).toBeNull();
  });
});

it.each([
  [1, 'demain'],
  [2, 'vendredi'],
  [7, 'mercredi prochain'],
])('whenLabel(%i) → %s', (inDays, label) => {
  expect(whenLabel(inDays, WEDNESDAY)).toBe(label);
});

it('trainedOn compares local days', () => {
  const w = { date: new Date(2026, 9, 28, 7).toISOString() } as Workout;
  expect(trainedOn([w], WEDNESDAY)).toBe(true);
  expect(trainedOn([w], new Date(2026, 9, 29, 7))).toBe(false);
});

describe('nextScheduled with days that cannot be done', () => {
  it('skips them', () => {
    const week = ['Push', null, null, 'Vide', 'Legs', null, null];
    expect(nextScheduled(week, WEDNESDAY, (name) => name !== 'Vide')).toEqual({ name: 'Legs', inDays: 2 });
  });
});

describe('weekSessions', () => {
  const settings = {
    ownDays: { ppl: ['Push B', 'Vide'], ul: ['Haut B'] },
    customDays: { 'ppl/Push B': ['Dips'] },
  };

  it('offers the program days, then the own days with exercises', () => {
    expect(weekSessions('ppl', settings)).toEqual({
      known: ['Push', 'Pull', 'Legs', 'Push B', 'Vide'],
      offered: ['Push', 'Pull', 'Legs', 'Push B'],
    });
  });

  it('keeps offering an empty day already in the week', () => {
    expect(weekSessions('ppl', settings, ['Vide', null, null, null, null, null, null]).offered).toContain('Vide');
  });

  it('works without any own day', () => {
    expect(weekSessions('ul', {}).offered).toEqual(['Haut', 'Bas']);
  });
});

describe('renameInSchedule', () => {
  const program = { split: 'ppl' as const, perWeek: 3, schedule: ['Push', null, 'Push B', null, 'Push B', null, null] };

  it('follows a rename on every weekday', () => {
    expect(renameInSchedule(program, 'Push B', 'Push lourd').schedule).toEqual([
      'Push',
      null,
      'Push lourd',
      null,
      'Push lourd',
      null,
      null,
    ]);
  });

  it('frees the weekdays of a removed day', () => {
    expect(renameInSchedule(program, 'Push B', null)).toEqual({
      split: 'ppl',
      perWeek: 1,
      schedule: ['Push', null, null, null, null, null, null],
    });
  });

  it('drops a week left without any session', () => {
    expect(
      renameInSchedule({ ...program, schedule: ['Push B', null, null, null, null, null, null] }, 'Push B', null),
    ).toEqual({
      split: 'ppl',
      perWeek: 3,
    });
  });

  it('leaves a program without that day alone', () => {
    expect(renameInSchedule(program, 'Autre', null)).toBe(program);
    const free = { split: 'ppl' as const, perWeek: 3 };
    expect(renameInSchedule(free, 'Push B', 'X')).toBe(free);
  });
});
