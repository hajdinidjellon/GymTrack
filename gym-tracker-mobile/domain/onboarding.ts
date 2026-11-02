import { translatedList } from '@/domain/format';
import { DEFAULT_PLATES } from '@/domain/plates';
import { getSplit } from '@/domain/programs';
import { TRAINING_DAYS } from '@/domain/schedule';
import { dayName, t } from '@/i18n';
import type { Experience, Goal, SplitId } from '@/types';

/** What the first-launch questions collect. Every answer has a default, so "Passer" always works. */
export interface OnboardingAnswers {
  goal: Goal;
  perWeek: number;
  experience: Experience;
  barWeight: number;
  plates: number[];
}

export const DEFAULT_ANSWERS: OnboardingAnswers = {
  goal: 'muscle',
  perWeek: 3,
  // Skipped: the lightest start, the safe one
  experience: 'new',
  barWeight: 20,
  plates: DEFAULT_PLATES,
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
export const GYM_PLATES = [25, ...DEFAULT_PLATES];

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

/**
 * An example week: for each day, the letter of the program day done on it
 * (A, B, C… in the split's order) or null for rest.
 */
export function weekPlan(perWeek: number): (string | null)[] {
  const days = getSplit(splitFor(perWeek)).days.length;
  const training = TRAINING_DAYS[perWeek] ?? TRAINING_DAYS[3]!;
  return WEEKDAYS.map((_, i) => {
    const n = training.indexOf(i);
    return n < 0 ? null : String.fromCharCode(65 + (n % days));
  });
}

/** "A Haut · B Bas" under the example week. */
export function weekLegend(perWeek: number): string {
  const split = splitFor(perWeek);
  if (split === 'fb') return t('domain.onboarding.legendFullBody');
  return getSplit(split)
    .days.map((d, i) => `${String.fromCharCode(65 + i)} ${dayName(d.name)}`)
    .join(' · ');
}

/** The short reaction under each question: a bold lead and one sentence. */
export function goalTip(goal: Goal): [string, string] {
  return [t(`domain.onboarding.goalTips.${goal}Lead`), t(`domain.onboarding.goalTips.${goal}`)];
}

export function rhythmTip(perWeek: number): [string, string] {
  return [t('domain.onboarding.rhythmLead', { count: perWeek }), t(`domain.onboarding.splitTips.${splitFor(perWeek)}`)];
}

export function experienceTip(experience: Experience): [string, string] {
  return [t(`domain.onboarding.experienceTips.${experience}Lead`), t(`domain.onboarding.experienceTips.${experience}`)];
}

/** Which calibration preset to start from: the empty bar for a beginner, heavier with experience. */
export function calibrationPreset(presets: number[], experience: Experience | undefined): number | undefined {
  const index = experience === 'new' ? 0 : experience === 'years' ? 3 : 2;
  return presets[Math.min(index, presets.length - 1)];
}
