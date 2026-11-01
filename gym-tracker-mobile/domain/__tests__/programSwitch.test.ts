import { describe, expect, it } from '@jest/globals';
import { choosableDays, splitOfDay } from '@/domain/programs';
import { latestWorkoutDate, suggestedSplit } from '@/domain/programSwitch';
import { nextDay, planDay, type BuildContext } from '@/domain/sessionBuilder';
import { workout } from './fixtures';

const w = (date: string, name: string) => workout(date, name, []);

describe('choosableDays', () => {
  it('lists the program first, then the other programs for a one-off session', () => {
    const days = choosableDays('ppl', {}, []);
    expect(days.map((d) => [d.name, d.split, d.extra])).toEqual([
      ['Push', 'ppl', false],
      ['Pull', 'ppl', false],
      ['Legs', 'ppl', false],
      ['Haut', 'ul', true],
      ['Bas', 'ul', true],
      ['Full body A', 'fb', true],
      ['Full body B', 'fb', true],
    ]);
  });

  it('keeps the exercises the user chose for an extra day, under its own program', () => {
    const haut = choosableDays('ppl', { 'ul/Haut': ['Tractions', 'Curl marteau'] }, []).find((d) => d.name === 'Haut');
    expect(haut?.exercises.map((e) => e.name)).toEqual(['Tractions', 'Curl marteau']);
  });
});

describe('splitOfDay', () => {
  it("finds the program of a day, the user's first", () => {
    expect(splitOfDay('Push', 'ppl')).toBe('ppl');
    expect(splitOfDay('Haut', 'ppl')).toBe('ul');
    expect(splitOfDay('Séance', 'ppl')).toBeUndefined();
  });
});

describe('a one-off session', () => {
  const ctx = (workouts: BuildContext['workouts']): BuildContext => ({
    profile: { goal: 'muscle', program: { split: 'ppl', perWeek: 3 }, prs: [] },
    settings: { units: 'kg', defaultRestTime: 90, increments: {} },
    workouts,
  });

  it('does not move the program along', () => {
    expect(nextDay(ctx([w('2026-10-20', 'Legs'), w('2026-10-27', 'Haut')])).name).toBe('Push');
  });

  it('takes the progression of each exercise from every session, its own day or not', () => {
    const pushed = workout('2026-10-20', 'Push', [
      {
        id: 'b',
        name: 'Développé couché',
        category: 'compound',
        muscleGroups: ['chest'],
        sets: [10, 10, 10].map((reps) => ({ weight: 80, reps, setType: 'normal' as const, completed: true })),
      },
    ]);
    const haut = choosableDays('ppl', {}, []).find((d) => d.name === 'Haut')!;
    const lift = planDay(haut, ctx([pushed])).lifts.find((l) => l.def.name === 'Développé couché');
    expect(lift?.last.map((s) => s.weight)).toEqual([80, 80, 80]);
  });
});

describe('suggestedSplit', () => {
  it('stays quiet for a one-off, or two', () => {
    expect(suggestedSplit([w('2026-10-20', 'Push'), w('2026-10-27', 'Haut')], 'ppl')).toBeNull();
    expect(suggestedSplit([w('2026-10-26', 'Haut'), w('2026-10-27', 'Bas')], 'ppl')).toBeNull();
  });

  it('offers the other program after three sessions in a row from it', () => {
    const list = [w('2026-10-20', 'Push'), w('2026-10-25', 'Haut'), w('2026-10-27', 'Bas'), w('2026-10-29', 'Haut')];
    expect(suggestedSplit(list, 'ppl')).toBe('ul');
  });

  it('needs them all from the same program', () => {
    const mixed = [w('2026-10-25', 'Haut'), w('2026-10-27', 'Full body A'), w('2026-10-29', 'Haut')];
    expect(suggestedSplit(mixed, 'ppl')).toBeNull();
    const back = [w('2026-10-25', 'Haut'), w('2026-10-27', 'Bas'), w('2026-10-29', 'Push')];
    expect(suggestedSplit(back, 'ppl')).toBeNull();
    expect(
      suggestedSplit([w('2026-10-25', 'Push'), w('2026-10-27', 'Pull'), w('2026-10-29', 'Legs')], 'ppl'),
    ).toBeNull();
  });

  it('after a no, asks again only when it goes on', () => {
    const list = [w('2026-10-25', 'Haut'), w('2026-10-27', 'Bas'), w('2026-10-29', 'Haut')];
    const no = latestWorkoutDate(list);
    expect(no).toBe('2026-10-29');
    expect(suggestedSplit(list, 'ppl', no)).toBeNull();
    const more = [...list, w('2026-10-31', 'Bas'), w('2026-11-02', 'Haut'), w('2026-11-04', 'Bas')];
    expect(suggestedSplit(more, 'ppl', no)).toBe('ul');
    expect(latestWorkoutDate([])).toBeNull();
  });
});
