import { describe, expect, it } from '@jest/globals';
import {
  cleanName,
  currentDraft,
  customProgramSettings,
  draftFrom,
  draftProblem,
  type CustomProgramDraft,
} from '@/domain/customProgram';
import { withNickname } from '@/domain/nicknames';
import { answersSessionNames, answersWeek, DEFAULT_ANSWERS } from '@/domain/onboarding';
import { programDays, programTitle, searchExercises } from '@/domain/programs';
import { DEFAULT_SETTINGS } from '@/domain/settings';
import { nextDay } from '@/domain/sessionBuilder';
import { suggestedSplit } from '@/domain/programSwitch';
import { exerciseName, setExerciseNicknames } from '@/i18n';
import type { AppSettings, Workout } from '@/types';

const base: AppSettings = { ...DEFAULT_SETTINGS };
const draft = (name: string, ...days: CustomProgramDraft['days']): CustomProgramDraft => ({ name, days });
const apply = (settings: AppSettings, d: CustomProgramDraft): AppSettings => ({
  ...settings,
  ...customProgramSettings(settings, d),
});
const days = (s: AppSettings) => programDays('custom', s.customDays, s.customExercises, s.ownDays);

describe('a program of their own', () => {
  it('keeps the names the user typed, cleaned', () => {
    const s = apply(
      base,
      draft('  Ma   prise de masse ', { name: ' Journée A ' }, { name: 'Pecs' }, { name: 'Cardio' }),
    );
    expect(s.programName).toBe('Ma prise de masse');
    expect(days(s).map((d) => d.name)).toEqual(['Journée A', 'Pecs', 'Cardio']);
    expect(days(s).every((d) => d.exercises.length === 0)).toBe(true);
    expect(programTitle('custom', s.programName)).toBe('Ma prise de masse');
  });

  it('is called "Mon programme" without a name of its own', () => {
    const s = apply(base, draft('   ', { name: 'A' }));
    expect(s.programName).toBeNull();
    expect(programTitle('custom', s.programName)).toBe('Mon programme');
    expect(programTitle('ppl', 'Ignored')).toBe('Push · Pull · Legs');
  });

  it('copies another program, exercises and supersets included, under the new names', () => {
    const settings: AppSettings = { ...base, supersets: { 'ppl/Push': ['Développé couché'] } };
    const copy = draftFrom('ppl', settings).map((d, i) => ({ ...d, name: ['Pecs', 'Dos', 'Jambes'][i]! }));
    const s = apply(settings, draft('', ...copy));
    const push = programDays('ppl', undefined, undefined).find((d) => d.name === 'Push')!;
    expect(
      days(s)
        .find((d) => d.name === 'Pecs')!
        .exercises.map((e) => e.name),
    ).toEqual(push.exercises.map((e) => e.name));
    expect(s.supersets['custom/Pecs']).toEqual(['Développé couché']);
  });

  it('renames its own sessions in place, and drops what the old version had', () => {
    const first = apply(base, draft('', ...draftFrom('ul', base)));
    const edited = currentDraft(first);
    edited.days[0] = { ...edited.days[0]!, name: 'Haut lourd' };
    edited.days.pop();
    const s = apply(first, edited);
    expect(days(s).map((d) => d.name)).toEqual(['Haut lourd']);
    expect(s.customDays['custom/Haut lourd']).toEqual(first.customDays['custom/Haut']);
    expect(s.customDays['custom/Haut']).toBeUndefined();
    expect(s.customDays['custom/Bas']).toBeUndefined();
  });

  it('leaves the other programs alone', () => {
    const settings: AppSettings = { ...base, customDays: { 'ppl/Push': ['Dips'] }, ownDays: { ppl: ['Bras'] } };
    const s = apply(settings, draft('', { name: 'A' }));
    expect(s.customDays['ppl/Push']).toEqual(['Dips']);
    expect(s.ownDays.ppl).toEqual(['Bras']);
  });

  it.each([
    [draft(''), 'noDay'],
    [draft('', { name: 'A' }, { name: '  ' }), 'emptyDay'],
    [draft('', { name: 'Pecs' }, { name: ' pecs ' }), 'sameDay'],
    [draft('', ...Array.from({ length: 15 }, (_, i) => ({ name: `J${i}` }))), 'tooMany'],
    [draft('', { name: 'A' }, { name: 'B' }), null],
  ])('%j → %s', (d, problem) => {
    expect(draftProblem(d)).toBe(problem);
  });

  it('cuts a name to one line of 40 characters', () => {
    expect(cleanName(`  a\n  b ${'x'.repeat(60)}`)).toHaveLength(40);
  });
});

describe('a program of their own, day to day', () => {
  const ctx = (settings: AppSettings, workouts: Workout[] = []) => ({
    profile: { goal: 'muscle' as const, program: { split: 'custom' as const, perWeek: 3 }, prs: [] },
    settings,
    workouts,
  });

  it('offers their own session while it has no day yet', () => {
    expect(nextDay(ctx(base)).exercises).toEqual([]);
  });

  it('goes through its days in order', () => {
    const s = apply(base, draft('', ...draftFrom('ul', base)));
    const done = {
      id: '1',
      date: new Date().toISOString(),
      name: 'Haut',
      type: 'strength',
      exercises: [],
      feeling: 3,
      completed: true,
    } as Workout;
    expect(nextDay(ctx(s, [done])).name).toBe('Bas');
  });

  it('never offers to switch to the program a day was copied from', () => {
    const push = (i: number) =>
      ({
        id: `${i}`,
        date: new Date(2026, 0, i + 1).toISOString(),
        name: 'Push',
        type: 'strength',
        exercises: [],
        feeling: 3,
        completed: true,
      }) as Workout;
    expect(suggestedSplit([push(1), push(2), push(3)], 'custom')).toBeNull();
  });
});

describe('onboarding with a program of their own', () => {
  it('lays the week out with the session names typed', () => {
    const answers = {
      ...DEFAULT_ANSWERS,
      split: 'custom' as const,
      perWeek: 3,
      custom: draft('', { name: 'A' }, { name: ' ' }, { name: 'Cardio' }),
    };
    expect(answersSessionNames(answers)).toEqual(['A', 'Cardio']);
    expect(answersWeek(answers).filter(Boolean)).toEqual(['A', 'Cardio', 'A']);
  });
});

describe('the user’s own name for an exercise', () => {
  const settings = { exerciseNicknames: {}, customExercises: [] };

  it('is shown everywhere, and found by the search', () => {
    const next = withNickname(settings, 'Développé couché', ' DC  lourd ');
    expect(next).toEqual({ nicknames: { 'Développé couché': 'DC lourd' } });
    setExerciseNicknames({ 'Développé couché': 'DC lourd' });
    try {
      expect(exerciseName('Développé couché')).toBe('DC lourd');
      expect(searchExercises('dc lourd').map((d) => d.name)).toContain('Développé couché');
    } finally {
      setExerciseNicknames({});
    }
  });

  it('goes back to the exercise’s own name when emptied or typed again', () => {
    const named = { ...settings, exerciseNicknames: { 'Développé couché': 'DC lourd' } };
    expect(withNickname(named, 'Développé couché', '')).toEqual({ nicknames: {} });
    expect(withNickname(named, 'Développé couché', 'Développé couché')).toEqual({ nicknames: {} });
  });

  it('is refused when another exercise already has that name', () => {
    expect(withNickname(settings, 'Développé couché', 'squat')).toEqual({ error: expect.any(String) });
  });
});
