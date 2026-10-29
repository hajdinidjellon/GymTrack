import { describe, expect, it } from '@jest/globals';
import {
  defaultSchedule,
  nextScheduled,
  trainedOn,
  trainingCount,
  validSchedule,
  weekdayIndex,
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
