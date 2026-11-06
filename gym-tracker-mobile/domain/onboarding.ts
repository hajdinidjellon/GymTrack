import { translatedList } from '@/domain/format';
import { ALL_PLATES, DEFAULT_PLATES } from '@/domain/plates';
import { getSplit } from '@/domain/programs';
import { defaultSchedule, weekdayIndex, type Schedule } from '@/domain/schedule';
import { dayName, t } from '@/i18n';
import type { Experience, Goal, SplitId } from '@/types';

/** What the first-launch questions collect. Every answer has a default, so "Passer" always works. */
export interface OnboardingAnswers {
  goal: Goal;
  perWeek: number;
  experience: Experience;
  barWeight: number;
  plates: number[];
  /** The days picked on the rhythm question. Null when skipped: the program days then follow each other. */
  schedule: Schedule | null;
}

export const DEFAULT_ANSWERS: OnboardingAnswers = {
  goal: 'muscle',
  perWeek: 3,
  // Skipped: the lightest start, the safe one
  experience: 'new',
  barWeight: 20,
  plates: DEFAULT_PLATES,
  schedule: null,
};

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
export function sessionNames(perWeek: number): string[] {
  return getSplit(splitFor(perWeek)).days.map((d) => d.name);
}

/** The week on screen: the days picked, else the example week of the rhythm. */
export function answersWeek(answers: Pick<OnboardingAnswers, 'perWeek' | 'schedule'>): Schedule {
  return answers.schedule ?? defaultSchedule(sessionNames(answers.perWeek), answers.perWeek);
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

/** The legend under the example week of a rhythm. */
export function weekLegend(perWeek: number): string {
  return splitLegend(splitFor(perWeek));
}

/** The short reaction under each question: a bold lead and one sentence. */
export function goalTip(goal: Goal): [string, string] {
  return [t(`domain.onboarding.goalTips.${goal}Lead`), t(`domain.onboarding.goalTips.${goal}`)];
}

/** `count`: the sessions placed in the week, when they differ from the rhythm picked. */
export function rhythmTip(perWeek: number, count = perWeek): [string, string] {
  return [t('domain.onboarding.rhythmLead', { count }), t(`domain.onboarding.splitTips.${splitFor(perWeek)}`)];
}

export function experienceTip(experience: Experience): [string, string] {
  return [t(`domain.onboarding.experienceTips.${experience}Lead`), t(`domain.onboarding.experienceTips.${experience}`)];
}

/** Which calibration preset to start from: the empty bar for a beginner, heavier with experience. */
export function calibrationPreset(presets: number[], experience: Experience | undefined): number | undefined {
  const index = experience === 'new' ? 0 : experience === 'years' ? 3 : 2;
  return presets[Math.min(index, presets.length - 1)];
}
