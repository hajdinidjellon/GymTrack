/**
 * REPOS — combien de temps entre deux séries, pour chaque exercice.
 *
 * Dans l'ordre : le choix de l'utilisateur, puis ce qu'il prend vraiment
 * d'habitude (mesuré entre deux validations) quand c'est plus long, puis le
 * type d'exercice : 4 min en très lourd, 3 min sur les gros mouvements,
 * 2 min sur un seul muscle.
 * Logique pure.
 */

import { formatRest } from '@/domain/format';
import { restFor, type ExerciseDef } from '@/domain/programs';
import type { ProgressionRule, WorkoutSet } from '@/types';

/** Rough time to do a set, taken off the gap between two validations. */
export function setSeconds(reps: number): number {
  return 10 + reps * 3;
}

const GAP_MIN = 15; // en dessous : validées d'un coup (« Tout comme prévu »)
const GAP_MAX = 10 * 60; // au-dessus : téléphone posé, pause, discussion
export const REST_LIMITS = [30, 360] as const;
export const REST_STEP = 15;
/** Samples needed before the habit counts, and how many sessions are looked at. */
export const LEARN_SAMPLES = 4;
export const LEARN_SESSIONS = 4;

const roundStep = (s: number) => Math.round(s / REST_STEP) * REST_STEP;
export const clampRest = (s: number) => Math.max(REST_LIMITS[0], Math.min(REST_LIMITS[1], roundStep(s)));

/**
 * The rest really taken before each set, from when the sets were validated.
 * The first set has none (the rest before it is the change of exercise),
 * and gaps that are too short or too long tell nothing.
 */
export function withRestTaken(sets: WorkoutSet[]): WorkoutSet[] {
  return sets.map(({ doneAt, restTaken: _old, ...set }, i) => {
    const before = sets[i - 1]?.doneAt;
    if (doneAt == null || before == null || !set.completed) return set;
    const gap = (doneAt - before) / 1000;
    if (gap < GAP_MIN || gap > GAP_MAX) return set;
    return { ...set, restTaken: Math.max(0, Math.round(gap - setSeconds(set.reps))) };
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** What the user usually rests on this exercise, once there is enough to tell. Newest sessions first. */
export function usualRest(history: { sets: WorkoutSet[] }[]): number | null {
  const samples = history
    .slice(0, LEARN_SESSIONS)
    .flatMap((h) => h.sets.flatMap((s) => (s.restTaken != null && s.setType !== 'warmup' ? [s.restTaken] : [])));
  return samples.length >= LEARN_SAMPLES ? clampRest(median(samples)) : null;
}

export type RestSource = 'own' | 'learned' | 'kind';

export interface PlannedRest {
  seconds: number;
  source: RestSource;
  /** One sentence on why, shown on the exercise and in the rest popup. Empty for the default rest. */
  note: string;
}

export function planRest(
  def: ExerciseDef,
  rule: ProgressionRule,
  defaultRest: number,
  history: { sets: WorkoutSet[] }[],
  own?: number,
): PlannedRest {
  const base = restFor(rule, defaultRest, def);
  if (own != null)
    return { seconds: clampRest(own), source: 'own', note: 'Le repos que tu as choisi pour cet exercice.' };

  const usual = usualRest(history);
  // Seulement plus long : le repos du type d'exercice est un minimum
  if (usual != null && usual - base >= REST_STEP) {
    return {
      seconds: usual,
      source: 'learned',
      note: `Sur cet exercice, tu prends ton temps : ${formatRest(usual)} d'habitude.`,
    };
  }
  return { seconds: base, source: 'kind', note: kindNote(def, rule, base, defaultRest) };
}

function kindNote(def: ExerciseDef, rule: ProgressionRule, base: number, defaultRest: number): string {
  if (base <= defaultRest && rule.repMax > 5) return '';
  if (rule.repMax <= 5) return `Séries très lourdes : ${formatRest(base)} pour bien récupérer.`;
  if (def.category === 'compound') return `Gros mouvement : ${formatRest(base)} pour récupérer.`;
  return `Un seul muscle travaillé : ${formatRest(base)} de repos.`;
}
