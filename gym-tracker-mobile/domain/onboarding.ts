import { translatedList } from '@/domain/format';
import { ALL_PLATES, DEFAULT_PLATES } from '@/domain/plates';
import { getSplit } from '@/domain/programs';
import { defaultSchedule, weekdayIndex, type Schedule } from '@/domain/schedule';
import { dayName, t } from '@/i18n';
import type { AgeGroup, Experience, Goal, Sex, SplitId, UserProfile } from '@/types';

/** What the first-launch questions collect. Every answer has a default, so "Passer" always works. */
export interface OnboardingAnswers {
  goal: Goal;
  perWeek: number;
  experience: Experience;
  barWeight: number;
  plates: number[];
  /** The days picked on the rhythm question. Null when skipped: the program days then follow each other. */
  schedule: Schedule | null;
  /** The program picked. Null: the one the rhythm gives (`splitFor`). */
  split: SplitId | null;
  /** « Toi » : each one optional, null when not said. */
  sex: Sex | null;
  ageGroup: AgeGroup | null;
  bodyWeight: number | null;
  /** Usual session time, in minutes. */
  sessionMinutes: number;
  /** The gym chain picked (`domain/gyms.ts`), and the steps of its machines. */
  gym: string | null;
  stackStep: number | null;
  cableStep: number | null;
}

export const DEFAULT_ANSWERS: OnboardingAnswers = {
  goal: 'muscle',
  perWeek: 3,
  // Skipped: the lightest start, the safe one
  experience: 'new',
  barWeight: 20,
  plates: DEFAULT_PLATES,
  schedule: null,
  split: null,
  sex: null,
  ageGroup: null,
  bodyWeight: null,
  sessionMinutes: 60,
  gym: null,
  stackStep: null,
  cableStep: null,
};

export const SESSION_MINUTES = [30, 45, 60, 75, 90];
export const AGE_GROUPS: AgeGroup[] = ['16', '25', '35', '45', '55'];
/** Where the body weight stepper starts before the user touches it. */
export const BODY_WEIGHT_START = 70;
export const BODY_WEIGHT_RANGE = { min: 35, max: 200 } as const;

/** The programs offered at first launch, in plain words, and the rhythms each one suits. */
const programDef = (id: SplitId, rhythms: number[]) => ({
  id,
  rhythms,
  get title() {
    return t(`domain.onboarding.programs.${id}Title`);
  },
  get sub() {
    return t(`domain.onboarding.programs.${id}Sub`);
  },
});

export const PROGRAM_CHOICES = [
  programDef('fb', [2, 3]),
  programDef('ul', [4]),
  programDef('ppl', [5, 6]),
  programDef('glutes', [3, 4, 5]),
];

/** The program of the answers: the one picked, else the one the rhythm gives. */
export function answersSplit(answers: Pick<OnboardingAnswers, 'perWeek' | 'split'>): SplitId {
  return answers.split ?? splitFor(answers.perWeek);
}

export const PER_WEEK_CHOICES = [2, 3, 4, 5, 6];
export const BAR_CHOICES = [
  {
    kg: 20,
    get label() {
      return t('domain.onboarding.barClassic');
    },
  },
  {
    kg: 15,
    get label() {
      return t('domain.onboarding.barShort');
    },
  },
];
/** Every plate a gym may have, heaviest first. */
export const GYM_PLATES = ALL_PLATES;

const experienceDef = (id: Experience, level: number) => ({
  id,
  level,
  get title() {
    return t(`domain.onboarding.${id}Title`);
  },
  get sub() {
    return t(`domain.onboarding.${id}Sub`);
  },
});

export const EXPERIENCES: { id: Experience; title: string; sub: string; level: number }[] = [
  experienceDef('new', 1),
  experienceDef('months', 2),
  experienceDef('years', 3),
];

/** 2–3 sessions: full body. 4: upper / lower. 5–6: push / pull / legs. */
export function splitFor(perWeek: number): SplitId {
  if (perWeek <= 3) return 'fb';
  if (perWeek === 4) return 'ul';
  return 'ppl';
}

export const WEEKDAYS = translatedList([
  'domain.weekdaysShort.mon',
  'domain.weekdaysShort.tue',
  'domain.weekdaysShort.wed',
  'domain.weekdaysShort.thu',
  'domain.weekdaysShort.fri',
  'domain.weekdaysShort.sat',
  'domain.weekdaysShort.sun',
]);

/** The session names of the program the rhythm gives. */
export function sessionNames(perWeek: number, split: SplitId = splitFor(perWeek)): string[] {
  return getSplit(split).days.map((d) => d.name);
}

/** The week on screen: the days picked, else the example week of the rhythm. */
export function answersWeek(
  answers: Pick<OnboardingAnswers, 'perWeek' | 'schedule'> & Partial<Pick<OnboardingAnswers, 'split'>>,
): Schedule {
  return (
    answers.schedule ??
    defaultSchedule(sessionNames(answers.perWeek, answersSplit({ split: null, ...answers })), answers.perWeek)
  );
}

/** "A", "B", "C": the letter of a session in its program's order. */
export function sessionLetter(name: string, names: string[]): string {
  return String.fromCharCode(65 + Math.max(0, names.indexOf(name)));
}

/** The first session to show: today's in the week, else the program's first. */
export function firstSession(week: Schedule | null, names: string[], now = new Date()): string {
  return week?.[weekdayIndex(now)] ?? names[0]!;
}

/** "A Haut · B Bas": what each letter of the week stands for. */
export function splitLegend(split: SplitId): string {
  if (split === 'fb') return t('domain.onboarding.legendFullBody');
  return getSplit(split)
    .days.map((d, i) => `${String.fromCharCode(65 + i)} ${dayName(d.name)}`)
    .join(' · ');
}

/** The legend under a week whose sessions are `names`: the program's, then the user's own days. */
export function scheduleLegend(split: SplitId, names: string[]): string {
  const builtIn = getSplit(split).days.length;
  if (names.length <= builtIn) return splitLegend(split);
  return names.map((name, i) => `${String.fromCharCode(65 + i)} ${dayName(name)}`).join(' · ');
}

/** The legend under the example week of a rhythm. */
export function weekLegend(perWeek: number, split: SplitId = splitFor(perWeek)): string {
  return splitLegend(split);
}

/** The short reaction under each question: a bold lead and one sentence. */
export function goalTip(goal: Goal): [string, string] {
  return [t(`domain.onboarding.goalTips.${goal}Lead`), t(`domain.onboarding.goalTips.${goal}`)];
}

/** `count`: the sessions placed in the week, when they differ from the rhythm picked. */
export function rhythmTip(perWeek: number, count = perWeek, split: SplitId = splitFor(perWeek)): [string, string] {
  return [t('domain.onboarding.rhythmLead', { count }), t(`domain.onboarding.splitTips.${split}`)];
}

export function experienceTip(experience: Experience): [string, string] {
  return [t(`domain.onboarding.experienceTips.${experience}Lead`), t(`domain.onboarding.experienceTips.${experience}`)];
}

/** What the user said of themselves, for the first weights. Every part optional. */
export interface Body {
  sex?: Sex;
  ageGroup?: AgeGroup;
  bodyWeight?: number;
}

/** The body the profile describes: its sex, age group and latest body weight. */
export function bodyOf(profile: Pick<UserProfile, 'sex' | 'ageGroup' | 'bodyStats'> | null | undefined): Body {
  if (!profile) return {};
  const latest = [...profile.bodyStats].sort((a, b) => b.date.localeCompare(a.date))[0];
  return {
    ...(profile.sex ? { sex: profile.sex } : {}),
    ...(profile.ageGroup ? { ageGroup: profile.ageGroup } : {}),
    ...(latest ? { bodyWeight: latest.weight } : {}),
  };
}

/**
 * Which calibration preset to start from: the lightest for a beginner,
 * heavier with experience; a step lighter for a woman, a light body or 55
 * and over, a step heavier for a heavy body. A beginner never starts above
 * the second preset: too light is fixed in one session, too heavy hurts.
 */
export function calibrationPreset(
  presets: number[],
  experience: Experience | undefined,
  body: Body = {},
): number | undefined {
  let index = experience === 'new' ? 0 : experience === 'years' ? 3 : 2;
  if (body.sex === 'female') index--;
  if (body.ageGroup === '55') index--;
  if (body.bodyWeight != null && body.bodyWeight < 60) index--;
  if (body.bodyWeight != null && body.bodyWeight >= 95) index++;
  const ceiling = experience === 'new' ? 1 : presets.length - 1;
  return presets[Math.max(0, Math.min(index, ceiling, presets.length - 1))];
}
