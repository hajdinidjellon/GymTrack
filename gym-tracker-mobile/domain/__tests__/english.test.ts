import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { contactEmailError, passwordError, usernameError } from '@/domain/account';
import { EFFORT_LABELS } from '@/domain/effort';
import { workoutsToCsv } from '@/domain/exportCsv';
import { formatClock, formatDay, formatRest, formatShortDay, formatThousands, listFr } from '@/domain/format';
import { insights } from '@/domain/insights';
import { LOADING_SUFFIX, loadHint } from '@/domain/loading';
import { lockScreenProps } from '@/domain/lockScreen';
import { BAR_CHOICES, EXPERIENCES, WEEKDAYS, experienceTip, goalTip, rhythmTip, weekLegend } from '@/domain/onboarding';
import { describeSide, formatKg, platesPhrase, DEFAULT_PLATES } from '@/domain/plates';
import {
  EXERCISES,
  GOALS,
  MUSCLE_LABELS,
  SPLITS,
  aliasMatch,
  makeCustomExercise,
  searchExercises,
} from '@/domain/programs';
import { planRest } from '@/domain/rest';
import { followersLabel } from '@/domain/ruleSync';
import { WEEKDAY_NAMES, whenLabel } from '@/domain/schedule';
import { nextSetSummary } from '@/domain/session';
import { breakLabel, deltaLabel, lastTimeLabel, reasonLabel, targetLoad } from '@/domain/sessionBuilder';
import { findCurrent } from '@/domain/sessionCursor';
import { weekDays } from '@/domain/stats';
import { nextExerciseLine, platesLine, restOverLine, setLine } from '@/domain/voiceLines';
import { setLocale } from '@/i18n';
import { EXERCISE_NAMES_EN } from '@/i18n/exerciseNames';
import type { ProgressionRule, Workout } from '@/types';
import { active, lift, session, workout } from './fixtures';

beforeEach(() => setLocale('en'));
afterEach(() => setLocale('fr'));

const gym = { barWeight: 20, plates: DEFAULT_PLATES };
const rule: ProgressionRule = { kind: 'double', sets: 3, repMin: 8, repMax: 12, increment: 2.5 };

describe('catalog names', () => {
  it('has an English name for every exercise, none of them twice', () => {
    const names = Object.values(EXERCISES).map((e) => e.name);
    for (const name of names) expect([name, EXERCISE_NAMES_EN[name]?.trim() ? 'ok' : 'missing']).toEqual([name, 'ok']);
    const english = names.map((n) => EXERCISE_NAMES_EN[n]!.toLowerCase());
    expect(new Set(english).size).toBe(english.length);
  });

  it('finds an exercise by its English name, its French name and its old names', () => {
    const found = (q: string) => searchExercises(q).map((e) => e.name);
    expect(found('overhead press')).toContain('Développé militaire');
    expect(found('militaire')).toContain('Développé militaire');
    expect(found('butterfly')).toContain('Pec deck');
    expect(aliasMatch(EXERCISES.ohp, 'overhead')).toBeUndefined();
    expect(aliasMatch(EXERCISES.ohp, 'militaire')).toBe('Développé militaire');
    expect(aliasMatch(EXERCISES.pecdeck, 'butterfly')).toBe('Butterfly');
  });

  it('refuses an own exercise named like a catalog one, in English too', () => {
    expect(makeCustomExercise({ name: ' ', equipment: 'machine', category: 'compound', muscle: 'chest' })).toEqual({
      error: 'Give your exercise a name.',
    });
    expect(
      makeCustomExercise({ name: 'bench press', equipment: 'barbell', category: 'compound', muscle: 'chest' }),
    ).toEqual({ error: 'This exercise already exists.' });
    expect(
      makeCustomExercise({ name: 'Leg curl couché', equipment: 'machine', category: 'isolation', muscle: 'legs' }),
    ).toEqual({ error: 'It already exists as “Leg curl”.' });
  });
});

describe('labels in English', () => {
  it('reads the constants in the current language', () => {
    expect(Object.values(EFFORT_LABELS)).toEqual(['Easy', 'Just right', 'All out']);
    expect(LOADING_SUFFIX.perHand).toBe('each dumbbell');
    expect(Object.values(MUSCLE_LABELS)).toEqual([
      'Chest',
      'Back',
      'Shoulders',
      'Biceps',
      'Triceps',
      'Arms',
      'Legs',
      'Glutes',
      'Calves',
      'Abs',
    ]);
    expect(SPLITS.map((s) => `${s.title} (${s.meta})`)).toEqual([
      'Push · Pull · Legs (3–6 d)',
      'Upper · Lower (4 d)',
      'Full body (2–3 d)',
    ]);
    expect(GOALS.map((g) => g.title)).toEqual(['Build muscle', 'Get stronger', 'Stay in shape']);
    expect(GOALS[1]!.sub).toBe('5 × 3–5 reps, heavy');
    expect(WEEKDAY_NAMES.join(' ')).toBe('Monday Tuesday Wednesday Thursday Friday Saturday Sunday');
    expect(WEEKDAYS[0]).toBe('Mon');
    setLocale('fr');
    expect(WEEKDAYS[0]).toBe('lun');
    expect(EFFORT_LABELS.easy).toBe('Facile');
  });

  it('formats numbers, rests and dates', () => {
    expect(formatKg(62.5)).toBe('62.5');
    expect(formatThousands(4800)).toBe('4,800');
    expect(formatThousands(1234567)).toBe('1,234,567');
    expect(formatRest(45)).toBe('45 s');
    expect(formatRest(120)).toBe('2 min');
    expect(formatRest(150)).toBe('2 min 30 s');
    expect(formatDay(new Date(2026, 9, 20))).toBe('Tuesday, Oct 20');
    expect(formatShortDay(new Date(2026, 9, 20).toISOString())).toBe('Tue, Oct 20');
    expect(formatClock(90)).toBe('1:30');
    expect(listFr(['a', 'b', 'c'])).toBe('a, b and c');
    setLocale('fr');
    expect(formatThousands(4800)).toBe('4\u202f800');
  });

  it('checks the account form', () => {
    expect(usernameError('ab')).toBe('Your username needs at least 3 characters.');
    expect(usernameError('a'.repeat(21))).toBe('Your username can be 20 characters max.');
    expect(usernameError('élan')).toBe('Your username: letters without accents, numbers, dot, dash or _ only.');
    expect(passwordError('123')).toBe('Your password needs at least 6 characters.');
    expect(contactEmailError('nope')).toBe("This email doesn't look valid.");
  });

  it('describes the plates', () => {
    expect(describeSide([])).toBe('Empty bar');
    expect(platesPhrase(5, DEFAULT_PLATES)).toBe('a 5 plate');
    expect(platesPhrase(12.5, DEFAULT_PLATES)).toBe('a 10 and a 2.5');
    expect(loadHint('bar', 62.5, gym)).toBe('Per side: 20 + 1.25');
    expect(loadHint('bar', 62.5, { barWeight: 20, plates: [20, 10, 5] })).toBe('Per side: 20 · 1.25 kg short per side');
    expect(loadHint('bar', 10, gym)).toBe('Lighter than the bar (20 kg)');
    expect(loadHint('bar', 20, gym)).toBe('Empty bar');
    expect(loadHint('perSide', 25, gym)).toBe('Each side: 20 + 5');
    expect(loadHint('perSide', 0, gym)).toBe('Each side');
    expect(loadHint('perHand', 12, gym)).toBe('Each dumbbell');
  });
});

describe('the plan in English', () => {
  const targets = [
    { weight: 62.5, reps: 10 },
    { weight: 62.5, reps: 10 },
  ];

  it('says what changed and why', () => {
    expect(deltaLabel({ decision: 'add_weight', rule })).toBe('+2.5 kg');
    expect(deltaLabel({ decision: 'add_reps', rule })).toBe('+1 rep');
    expect(deltaLabel({ decision: 'add_two_reps', rule })).toBe('+2 reps');
    expect(deltaLabel({ decision: 'hold', rule })).toBe('same target');
    expect(deltaLabel({ decision: 'deload', rule })).toBe('lighter');
    expect(deltaLabel({ decision: 'comeback', rule })).toBe('comeback');
    expect(deltaLabel({ decision: 'start', rule })).toBe('start');
    expect(deltaLabel({ decision: 'calibrate', rule })).toBe('to set');
    const reason = (decision: Parameters<typeof reasonLabel>[0]['decision'], weight = 62.5, daysOff?: number) =>
      reasonLabel({ decision, rule, targets: [{ weight, reps: 8 }], daysOff });
    expect(reason('add_weight')).toBe('Every set hit 12 reps: we add 2.5 kg.');
    expect(reason('add_reps')).toBe('One more rep per set. At 12 reps on every set, we add weight.');
    expect(reason('add_reps', 0)).toBe('One more rep per set than last time.');
    expect(reason('add_two_reps')).toBe('Your last set was easy: two more reps per set.');
    expect(reason('hold')).toBe('Your last set was all out: same target to lock it in.');
    expect(reason('repeat')).toBe('A set fell under 8 reps: same target again.');
    expect(reason('deload')).toBe('Two tough sessions in a row: 10% lighter to bounce back.');
    expect(reason('comeback', 62.5, 21)).toBe(
      '3 weeks without this exercise: a bit lighter to get back into the groove.',
    );
    expect(reason('start')).toBe('Starting weight set at 70% of your record.');
    expect(reason('start', 0)).toBe('First session: aim for the bottom of the range.');
    expect(reason('calibrate')).toBe('First time: pick your weight, then we work out the rest.');
  });

  it('counts weeks and months', () => {
    expect(breakLabel(7)).toBe('1 week');
    expect(breakLabel(14)).toBe('2 weeks');
    expect(breakLabel(30)).toBe('1 month');
    expect(breakLabel(95)).toBe('3 months');
  });

  it('reads the targets', () => {
    expect(lastTimeLabel(targets)).toBe('62.5 kg × 10 · 10');
    expect(lastTimeLabel([{ weight: 0, reps: 12 }])).toBe('12 reps');
    expect(targetLoad(targets)).toBe('62.5 kg × 10');
    expect(targetLoad([{ weight: 0, reps: 12 }])).toBe('12 reps');
  });

  it('explains the rest', () => {
    expect(planRest(EXERCISES.curl, rule, 90, [], 100).note).toBe('The rest you picked for this exercise.');
    expect(planRest(EXERCISES.curl, rule, 90, []).note).toBe('One muscle worked: 2 min of rest.');
    expect(planRest(EXERCISES.squat, rule, 90, []).note).toBe('Big lift: 3 min to recover.');
    expect(planRest(EXERCISES.squat, { ...rule, repMax: 5 }, 90, []).note).toBe(
      'Very heavy sets: 4 min to recover fully.',
    );
    const rested = [{ sets: Array.from({ length: 4 }, () => ({ ...lift('x', 50, [10]).sets[0]!, restTaken: 270 })) }];
    expect(planRest(EXERCISES.squat, rule, 90, rested).note).toBe(
      'You take your time on this one: 4 min 30 s usually.',
    );
  });

  it('names the followers and the next day', () => {
    expect(followersLabel(['Bench press', 'Dips'])).toBe('Bench press and Dips');
    expect(followersLabel(['a', 'b', 'c', 'd'])).toBe('a, b, c + 1 more');
    const monday = new Date(2026, 9, 19);
    expect(whenLabel(1, monday)).toBe('tomorrow');
    expect(whenLabel(3, monday)).toBe('Thursday');
    expect(whenLabel(7, monday)).toBe('next Monday');
    expect(weekDays([], monday).map((d) => d.letter)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
  });
});

describe('the onboarding in English', () => {
  it('gives the choices and the tips', () => {
    expect(BAR_CHOICES.map((b) => b.label)).toEqual(['standard', 'short']);
    expect(EXPERIENCES.map((e) => `${e.title}: ${e.sub}`)).toEqual([
      "I'm new: We start with the empty bar",
      'A few months: I know the movements',
      'Over a year: I know my weights',
    ]);
    expect(weekLegend(3)).toBe('A and B: two full body sessions, taking turns');
    expect(weekLegend(4)).toBe('A Upper · B Lower');
    expect(goalTip('force')[0]).toBe('We go heavy.');
    expect(rhythmTip(4)).toEqual(['4 sessions:', 'upper body, then lower body. Each muscle works twice a week.']);
    expect(experienceTip('years')).toEqual([
      'You know your weights?',
      'Enter them on your first session, and we take it from there.',
    ]);
  });
});

describe('voice, lock screen and notification in English', () => {
  const cursor = (ex = active('Squat', [{ weight: 62.5, reps: 10 }])) => findCurrent([ex])!;

  it('speaks English with the English exercise names', () => {
    expect(platesLine(cursor(), gym)).toBe('Put 20 and 1.25 on each side.');
    expect(platesLine(cursor(active('Squat', [{ weight: 20, reps: 5 }])), gym)).toBe('Empty bar.');
    expect(platesLine(cursor(), { barWeight: 20, plates: [20, 10, 5] })).toBe(
      "Put 20 on each side. You're 1.25 short on each side.",
    );
    expect(setLine(cursor())).toBe('Set 1. 62.5 kilos, 10 reps.');
    expect(setLine(cursor(active('Curl', [{ weight: 12, reps: 10 }], { equipment: 'dumbbell' })))).toBe(
      'Set 1. 12 kilos each dumbbell, 10 reps.',
    );
    expect(setLine(cursor(active('Dips', [{ weight: 0, reps: 12 }], { equipment: 'bodyweight' })))).toBe(
      'Set 1. 12 reps.',
    );
    expect(restOverLine(cursor())).toBe("Let's go. Set 1. 62.5 kilos, 10 reps.");
    const bench = active('Développé couché', [{ weight: 0, reps: 8 }], { needsWeight: true });
    expect(nextExerciseLine(cursor(bench), { ...gym, exerciseNotes: { 'Développé couché': 'seat 4.' } })).toBe(
      'Next exercise: Bench press. Pick your starting weight. Note: seat 4.',
    );
  });

  it('fills the lock screen', () => {
    const s = { ...session([active('Développé couché', [{ weight: 80, reps: 8 }])]), name: 'Haut' };
    expect(lockScreenProps(s, gym, 0)).toMatchObject({
      session: 'Upper',
      exercise: 'Bench press',
      setLabel: 'Set 1/1',
      target: '80 kg × 8',
      plates: '20 + 10 per side',
    });
    const curl = session([active('Curl haltères', [{ weight: 12, reps: 10 }], { equipment: 'dumbbell' })]);
    expect(lockScreenProps(curl, gym, 0).target).toBe('12 kg each dumbbell × 10');
    const dips = session([active('Dips', [{ weight: 0, reps: 10 }], { equipment: 'bodyweight' })]);
    expect(lockScreenProps(dips, gym, 0).target).toBe('10 reps');
    const pick = session([active('Squat', [{ weight: 0, reps: 10 }], { needsWeight: true })]);
    expect(lockScreenProps(pick, gym, 0).target).toBe('Pick your weight in the app');
    const done = session([active('Squat', [{ weight: 60, reps: 10, completed: true }])]);
    expect(lockScreenProps(done, gym, 0)).toMatchObject({
      exercise: 'Session done',
      target: 'Open the app to save it',
    });
  });

  it('sums up the next set for the notification', () => {
    const s = session([active('Développé couché', [{ weight: 62.5, reps: 8 }])]);
    expect(nextSetSummary(s, formatKg)).toBe('Bench press · 62.5 kg × 8');
    expect(nextSetSummary(session([active('Dips', [{ weight: 0, reps: 12 }])]), formatKg)).toBe('Dips · 12 reps');
    expect(nextSetSummary(session([]), formatKg)).toBe('Start your next set.');
  });
});

describe('history in English', () => {
  const on = (month: number, day: number, hour = 19) => new Date(2026, month - 1, day, hour).toISOString();
  const now = new Date(2026, 9, 26, 12);

  it('tells what the app knows', () => {
    const workouts: Workout[] = [5, 7, 9, 12, 14, 16, 19, 21, 23].map((day, i) => {
      const done = lift('Squat', 60 + i * 2.5, [10, 10, 10, 10]);
      return {
        ...workout(on(10, day), 'Full body A', [
          { ...done, sets: done.sets.map((s, j) => (j > 0 ? { ...s, restTaken: 150 } : s)) },
        ]),
        duration: 50,
      };
    });
    const found = insights(workouts, { perWeek: 3, now });
    expect(Object.fromEntries(found.map((i) => [i.id, `${i.title} | ${i.text}`]))).toEqual({
      time: 'Your time | You mostly train in the evening.',
      days: 'Your days | You usually come in on Monday, Wednesday and Friday.',
      duration: 'Your usual session | Your sessions last about 50 min.',
      rhythm: "Your pace | 6 sessions in 2 weeks: you're keeping your pace of 3 a week.",
      rest: 'Your rests | Squat 2 min 30 s, on average between sets.',
      strong: 'Your strong point | Squat: +20 kg since you started.',
    });
    const behind = [
      workout(on(10, 5, 8), 'A', [lift('Squat', 60, [10])]),
      workout(on(10, 13, 13), 'B', [lift('Squat', 60, [10])]),
      workout(on(10, 21, 16), 'A', [lift('Squat', 50, [10])]),
      workout(on(10, 23, 20), 'B', []),
    ];
    expect(insights(behind, { perWeek: 3, now }).find((i) => i.id === 'rhythm')?.text).toBe(
      '3 sessions out of 9 planned over the last 3 weeks.',
    );
  });

  it('writes the CSV header in English, values unchanged', () => {
    const w = workout(on(10, 7, 7), 'Legs', [
      {
        ...lift('Squat', 62.5, [5]),
        sets: [{ weight: 62.5, reps: 5, setType: 'warmup', completed: true }],
      },
    ]);
    expect(workoutsToCsv([w]).split('\n')).toEqual([
      'date;time;session;exercise;set;weight (kg);reps;warm-up;rest (s)',
      '2026-10-07;07:00;Legs;Squat;1;62,5;5;yes;',
    ]);
  });
});
