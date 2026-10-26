/**
 * MOTEUR DE PROGRESSION — logique pure, aucune dépendance React Native.
 *
 * Règle unique pour l'instant : la double progression.
 * Ex. 3x8-12 : on garde la charge et on vise +1 rep par série tant que
 * toutes les séries n'atteignent pas 12. Quand c'est le cas, on monte la
 * charge d'un incrément et on repart à 8.
 *
 * Une série sous le minimum = séance ratée : on garde la charge.
 * Deux séances ratées d'affilée au même poids = on baisse de 10 %.
 *
 * Poids du corps (poids à 0) : jamais de charge ajoutée automatiquement,
 * on continue +1 rep par série sans plafond.
 *
 * Le moteur est sans état : tout se déduit de l'historique de l'exercice.
 */

import type { ProgressionRule, SetTarget, WorkoutSet } from '@/types';

export const DELOAD_FACTOR = 0.9;
export const FAILURES_BEFORE_DELOAD = 2;
export const START_PERCENT_OF_1RM = 0.7;

export type Units = 'kg' | 'lbs';

/** One past session of a single exercise. */
export interface ExerciseSession {
  date: string;
  sets: WorkoutSet[];
}

export type ProgressionDecision =
  | 'add_reps' // same weight, +1 rep on each set
  | 'add_weight' // every set hit the top of the range
  | 'repeat' // a set fell under the minimum: same weight, same targets
  | 'deload' // failed twice in a row at the same weight
  | 'start' // no history, starting weight derived from a PR
  | 'calibrate'; // no history and no PR: the user picks the weight

export interface ProgressionResult {
  decision: ProgressionDecision;
  targets: SetTarget[];
}

export function defaultIncrement(units: Units): number {
  return units === 'lbs' ? 5 : 2.5;
}

export function defaultRule(units: Units = 'kg'): ProgressionRule {
  return { kind: 'double', sets: 3, repMin: 8, repMax: 12, increment: defaultIncrement(units) };
}

/** Builds a rule from a planned exercise. A fixed rep count becomes a range of one. */
export function ruleFromPlan(
  targetSets: number,
  targetReps: number | [number, number],
  units: Units = 'kg',
): ProgressionRule {
  const [repMin, repMax] = Array.isArray(targetReps) ? targetReps : [targetReps, targetReps];
  return {
    kind: 'double',
    sets: Math.max(1, targetSets),
    repMin,
    repMax: Math.max(repMin, repMax),
    increment: defaultIncrement(units),
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Rounds down to a loadable weight. The epsilon absorbs float noise (89.99999 / 2.5). */
export function roundDownToIncrement(weight: number, increment: number): number {
  if (increment <= 0) return round2(weight);
  return round2(Math.floor(weight / increment + 1e-6) * increment);
}

/** -10%, rounded to the nearest loadable weight, and always at least one increment lighter. */
export function deloadWeight(weight: number, increment: number): number {
  if (increment <= 0) return round2(Math.max(0, weight * DELOAD_FACTOR));
  const nearest = Math.round((weight * DELOAD_FACTOR) / increment) * increment;
  return round2(Math.max(0, Math.min(nearest, weight - increment)));
}

export function startWeightFromOneRepMax(oneRepMax: number, increment: number): number {
  return roundDownToIncrement(oneRepMax * START_PERCENT_OF_1RM, increment);
}

/** Warm-ups never count, and neither do sets that were never validated. */
export function workingSets(sets: WorkoutSet[]): WorkoutSet[] {
  return sets.filter((s) => s.setType !== 'warmup' && s.completed !== false);
}

/** The weight most sets were done at. On a tie, the heavier one. */
export function referenceWeight(sets: WorkoutSet[]): number {
  const counts = new Map<number, number>();
  for (const s of sets) counts.set(s.weight, (counts.get(s.weight) ?? 0) + 1);

  let best = 0;
  let bestCount = 0;
  for (const [weight, count] of counts) {
    if (count > bestCount || (count === bestCount && weight > best)) {
      best = weight;
      bestCount = count;
    }
  }
  return best;
}

export function isFailedSession(sets: WorkoutSet[], rule: ProgressionRule): boolean {
  return sets.some((s) => s.reps < rule.repMin);
}

function hitTopOfRange(sets: WorkoutSet[], weight: number, rule: ProgressionRule): boolean {
  return sets.length >= rule.sets && sets.every((s) => s.weight >= weight && s.reps >= rule.repMax);
}

function fill(rule: ProgressionRule, weight: number, reps: (i: number) => number): SetTarget[] {
  return Array.from({ length: rule.sets }, (_, i) => ({ weight: round2(weight), reps: reps(i) }));
}

/**
 * Computes today's target for each set.
 * `history` can be in any order; sessions with no working set are ignored.
 */
export function nextTargets(
  history: ExerciseSession[],
  rule: ProgressionRule,
  options: { startWeight?: number } = {},
): ProgressionResult {
  const sessions = history
    .map((h) => ({ date: h.date, sets: workingSets(h.sets) }))
    .filter((h) => h.sets.length > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const last = sessions[0];
  if (!last) {
    if (options.startWeight != null) {
      return { decision: 'start', targets: fill(rule, options.startWeight, () => rule.repMin) };
    }
    return { decision: 'calibrate', targets: fill(rule, 0, () => rule.repMin) };
  }

  const weight = referenceWeight(last.sets);
  const bodyweight = weight === 0;
  // Au poids du corps, pas de plafond : les reps sont la seule progression
  const clampReps = (r: number) => Math.max(rule.repMin, bodyweight ? r : Math.min(rule.repMax, r));

  if (isFailedSession(last.sets, rule)) {
    let failures = 0;
    for (const s of sessions) {
      if (!isFailedSession(s.sets, rule) || referenceWeight(s.sets) !== weight) break;
      failures++;
    }

    // Impossible d'alléger le poids du corps : on retente simplement
    if (failures >= FAILURES_BEFORE_DELOAD && !bodyweight) {
      const lighter = deloadWeight(weight, rule.increment);
      return { decision: 'deload', targets: fill(rule, lighter, () => rule.repMin) };
    }

    // Même charge, mêmes cibles qu'à la dernière séance
    return {
      decision: 'repeat',
      targets: fill(rule, weight, (i) => {
        const set = last.sets[i];
        if (!set) return rule.repMin;
        return clampReps(set.target?.reps ?? set.reps);
      }),
    };
  }

  if (!bodyweight && hitTopOfRange(last.sets, weight, rule)) {
    return { decision: 'add_weight', targets: fill(rule, weight + rule.increment, () => rule.repMin) };
  }

  return {
    decision: 'add_reps',
    targets: fill(rule, weight, (i) => {
      const set = last.sets[i];
      if (!set) return rule.repMin;
      // Une série faite plus légère ne compte pas comme un progrès à ce poids
      return clampReps(set.weight >= weight ? set.reps + 1 : set.reps);
    }),
  };
}
