import { DEFAULT_PLATES } from '@/domain/plates';
import { getSplit } from '@/domain/programs';
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
  experience: 'months',
  barWeight: 20,
  plates: DEFAULT_PLATES,
};

export const PER_WEEK_CHOICES = [2, 3, 4, 5, 6];
export const BAR_CHOICES = [
  { kg: 20, label: 'classique' },
  { kg: 15, label: 'courte' },
];
/** Every plate a gym may have, heaviest first. */
export const GYM_PLATES = [25, ...DEFAULT_PLATES];

export const EXPERIENCES: { id: Experience; title: string; sub: string; level: number }[] = [
  { id: 'new', title: 'Je débute', sub: 'On commence avec la barre seule', level: 1 },
  { id: 'months', title: 'Quelques mois', sub: 'Je connais les mouvements', level: 2 },
  { id: 'years', title: "Plus d'un an", sub: 'Je connais mes charges', level: 3 },
];

/** 2–3 sessions: full body. 4: upper / lower. 5–6: push / pull / legs. */
export function splitFor(perWeek: number): SplitId {
  if (perWeek <= 3) return 'fb';
  if (perWeek === 4) return 'ul';
  return 'ppl';
}

// Jours d'exemple, lundi = 0 : on laisse au moins un jour de repos quand c'est possible
const WEEK_DAYS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
};

export const WEEKDAYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];

/**
 * An example week: for each day, the letter of the program day done on it
 * (A, B, C… in the split's order) or null for rest.
 */
export function weekPlan(perWeek: number): (string | null)[] {
  const days = getSplit(splitFor(perWeek)).days.length;
  const training = WEEK_DAYS[perWeek] ?? WEEK_DAYS[3]!;
  return WEEKDAYS.map((_, i) => {
    const n = training.indexOf(i);
    return n < 0 ? null : String.fromCharCode(65 + (n % days));
  });
}

/** "A Haut · B Bas" under the example week. */
export function weekLegend(perWeek: number): string {
  const split = splitFor(perWeek);
  if (split === 'fb') return 'A et B : deux séances full body qui alternent';
  return getSplit(split)
    .days.map((d, i) => `${String.fromCharCode(65 + i)} ${d.name}`)
    .join(' · ');
}

const GOAL_TIPS: Record<Goal, [string, string]> = {
  muscle: ['Bon choix.', 'Quand tu fais toutes tes reps, on ajoute du poids à la séance suivante.'],
  force: ['On va lourd.', 'Peu de reps, plus de repos, et la charge monte dès que tu tiens 5 reps partout.'],
  forme: ['Court et efficace.', 'Plus de reps, des charges légères et des repos courts.'],
};

const SPLIT_TIPS: Record<SplitId, string> = {
  fb: "c'est du full body. Tout le corps à chaque fois, et un jour de repos entre deux.",
  ul: 'haut du corps, puis bas du corps. Chaque muscle travaille deux fois par semaine.',
  ppl: 'pousser, tirer, jambes. Chaque séance vise un groupe de muscles à fond.',
};

const EXPERIENCE_TIPS: Record<Experience, [string, string]> = {
  new: ['On y va doucement.', 'Barre seule pour apprendre les mouvements, la charge monte vite ensuite.'],
  months: [
    'Pas besoin de connaître tes charges.',
    'À la première séance, tu choisis un poids par exercice : on calcule le reste.',
  ],
  years: ['Tu connais tes charges ?', 'Tu les entres à la première séance, et on prend le relais.'],
};

/** The short reaction under each question: a bold lead and one sentence. */
export function goalTip(goal: Goal): [string, string] {
  return GOAL_TIPS[goal];
}

export function rhythmTip(perWeek: number): [string, string] {
  return [`${perWeek} séances,`, SPLIT_TIPS[splitFor(perWeek)]];
}

export function experienceTip(experience: Experience): [string, string] {
  return EXPERIENCE_TIPS[experience];
}

/** Which calibration preset to start from: the empty bar for a beginner, heavier with experience. */
export function calibrationPreset(presets: number[], experience: Experience | undefined): number | undefined {
  const index = experience === 'new' ? 0 : experience === 'years' ? 3 : 2;
  return presets[Math.min(index, presets.length - 1)];
}
