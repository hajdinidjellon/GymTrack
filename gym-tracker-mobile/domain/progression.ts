/**
 * MOTEUR DE PROGRESSION — logique pure, aucune dépendance React Native.
 *
 * Règle unique pour l'instant : la double progression.
 * Ex. 3x8-12 : on garde la charge et on vise +1 rep par série tant que
 * toutes les séries n'atteignent pas 12. Quand c'est le cas, on monte la
 * charge d'un incrément et on repart à 8.
 *
 * Ce sont les séries de travail qui décident : les séries prévues au poids
 * de travail. Un top set ou un single (plus lourd pour moins de reps) est
 * gardé tel quel et ne décide rien ; une série bonus au-delà du plan non
 * plus. Une séance de singles à des poids qui montent (test de max) n'a pas
 * de poids de travail : elle ne change pas la charge.
 *
 * Une série prévue sous le minimum = séance ratée : on garde la charge.
 * Deux séances ratées d'affilée au même poids = on baisse d'environ 10 %
 * (jamais sous la barre à vide, jamais à 0). Quand rien de plus léger n'a
 * de sens (poids du corps, barre à vide, haltères de 2 en 2), on repart
 * des reps vraiment faites, et on remonte de là.
 *
 * Poids du corps (poids à 0) : jamais de charge ajoutée automatiquement,
 * on continue +1 rep par série sans plafond.
 *
 * Machine assistée (tractions assistées) : le poids aide, la progression
 * enlève de l'aide, l'allègement en rajoute.
 *
 * Ressenti de la dernière série (domain/effort.ts) : « Facile » = +2 reps,
 * « À fond » = même cible une fois pour consolider (une séance sur deux si
 * ça se répète, pour ne jamais stagner).
 *
 * Après une pause (2 semaines sans l'exercice), on reprend plus léger :
 * 90 %, et 80 % au-delà de 4 semaines.
 *
 * Le moteur est sans état : tout se déduit de l'historique de l'exercice.
 */

import { effortOf, type Effort } from '@/domain/effort';
import type { ProgressionRule, SetTarget, WorkoutSet } from '@/types';

export const DELOAD_FACTOR = 0.9;
/** A deload never takes off more than this, even when the step is coarse. */
export const MAX_DELOAD_DROP = 0.25;
export const FAILURES_BEFORE_DELOAD = 2;
export const START_PERCENT_OF_1RM = 0.7;
/** Days off before the comeback weight, and how much is kept. Longest break first. */
export const COMEBACK_STEPS = [
  { days: 28, keep: 0.8 },
  { days: 14, keep: 0.9 },
] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

export type Units = 'kg' | 'lbs';

/** One past session of a single exercise. */
export interface ExerciseSession {
  date: string;
  sets: WorkoutSet[];
}

export type ProgressionDecision =
  | 'add_reps' // same weight, +1 rep on each set
  | 'add_two_reps' // same weight, +2 reps: the last set felt easy
  | 'hold' // same weight, same reps: the last set was all-out
  | 'add_weight' // every set hit the top of the range
  | 'repeat' // a set fell under the minimum: same weight, same targets
  | 'deload' // failed twice in a row at the same weight
  | 'ease' // failed twice, nothing lighter to load: the reps really done become the target
  | 'comeback' // back after a break: a bit lighter to find the groove again
  | 'start' // no history, starting weight derived from a PR
  | 'calibrate' // no history and no PR: the user picks the weight
  | 'manual'; // manual mode: exactly what was done last time, set by set

/** The decisions that ask for more than last time. */
export function isProgress(decision: ProgressionDecision): boolean {
  return decision === 'add_weight' || decision === 'add_reps' || decision === 'add_two_reps';
}

export interface ProgressionResult {
  decision: ProgressionDecision;
  targets: SetTarget[];
  /** Comeback only: days since the last session of the exercise. */
  daysOff?: number;
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

const nearestStep = (weight: number, increment: number) =>
  increment > 0 ? round2(Math.round(weight / increment + 1e-9) * increment) : round2(weight);

/** The lightest a lift can go: the empty bar while the weight is on it, else one step. Never 0. */
function floorFor(weight: number, increment: number, minWeight?: number): number {
  if (minWeight != null && weight >= minWeight) return minWeight;
  return increment > 0 ? Math.min(increment, weight) : 0;
}

/**
 * -10 % on the nearest loadable weight. When the step is too coarse for
 * that (6 kg dumbbells, steps of 2), one step lighter as long as it stays
 * within 25 %; else the weight as it is. Never under the empty bar, never 0.
 */
export function deloadWeight(weight: number, increment: number, minWeight?: number): number {
  const floor = floorFor(weight, increment, minWeight);
  let lighter = nearestStep(weight * DELOAD_FACTOR, increment);
  if (lighter >= weight) lighter = round2(weight - increment);
  if (weight - lighter > weight * MAX_DELOAD_DROP + 1e-6) return weight;
  const out = Math.max(lighter, floor);
  return out < weight ? out : weight;
}

/** The comeback weight: `keep` of it on the nearest loadable step, between the floor and the weight. */
export function comebackWeight(weight: number, keep: number, increment: number, minWeight?: number): number {
  const floor = floorFor(weight, increment, minWeight);
  return Math.min(weight, Math.max(floor, nearestStep(weight * keep, increment)));
}

/** Assisted machine: more help instead of less weight, at least one step. */
export function moreHelp(weight: number, keep: number, increment: number): number {
  return Math.max(nearestStep(weight * (2 - keep), increment), round2(weight + increment));
}

export function startWeightFromOneRepMax(oneRepMax: number, increment: number): number {
  return roundDownToIncrement(oneRepMax * START_PERCENT_OF_1RM, increment);
}

/** Warm-ups never count, and neither do sets that were never validated. */
export function workingSets(sets: WorkoutSet[]): WorkoutSet[] {
  return sets.filter((s) => s.setType !== 'warmup' && s.completed !== false);
}

/**
 * The sets that steer the next targets: working sets without the drop sets.
 * A drop is lighter on purpose: it is neither a missed set nor the weight of the day.
 */
export function mainSets(sets: WorkoutSet[]): WorkoutSet[] {
  return workingSets(sets).filter((s) => s.setType !== 'drop');
}

/** The most frequent weight; `prefer` settles a tie. */
function mostCommon(sets: WorkoutSet[], prefer: (a: number, b: number) => boolean): { weight: number; count: number } {
  const counts = new Map<number, number>();
  for (const s of sets) counts.set(s.weight, (counts.get(s.weight) ?? 0) + 1);
  let best = { weight: 0, count: 0 };
  for (const [weight, count] of counts) {
    if (count > best.count || (count === best.count && prefer(weight, best.weight))) best = { weight, count };
  }
  return best;
}

/** The weight most sets were done at. On a tie, the heavier one. */
export function referenceWeight(sets: WorkoutSet[]): number {
  return mostCommon(sets, (a, b) => a > b).weight;
}

/** Heavier is harder; on an assisted machine, less help is harder. */
const harderThan = (assisted: boolean) => (a: number, b: number) => (assisted ? a < b : a > b);

/**
 * The weight the working sets were done at. The sets that reached the
 * bottom of the range decide; when none did, the most common weight, on a
 * tie the easier one. Null for singles at rising weights (a max test):
 * there is no working weight to build on.
 */
export function workingWeight(sets: WorkoutSet[], rule: ProgressionRule, assisted = false): number | null {
  if (sets.length === 0) return null;
  const harder = harderThan(assisted);
  const inRange = sets.filter((s) => s.reps >= rule.repMin);
  if (inRange.length) return mostCommon(inRange, harder).weight;
  const common = mostCommon(sets, (a, b) => harder(b, a));
  const distinct = new Set(sets.map((s) => s.weight)).size;
  return distinct === 1 || common.count >= 2 ? common.weight : null;
}

/** What one past session says. */
export interface SessionRead {
  /** The working weight. */
  weight: number;
  /** Heavier for fewer reps than the working sets (top set, single): kept as is, never steer. */
  top: WorkoutSet[];
  /** The working sets the plan asked for. Bonus sets past the plan never decide. */
  planned: WorkoutSet[];
}

export function readSession(sets: WorkoutSet[], rule: ProgressionRule, assisted = false): SessionRead | null {
  const weight = workingWeight(sets, rule, assisted);
  if (weight === null) return null;
  const harder = harderThan(assisted);
  const minReps = Math.min(...sets.filter((s) => s.weight === weight).map((s) => s.reps));
  // Always room for one working set
  const top = sets
    .filter((s) => harder(s.weight, weight) && (s.reps < minReps || s.setType === 'top'))
    .slice(0, Math.max(0, rule.sets - 1));
  const work = sets.filter((s) => !top.includes(s));
  return { weight, top, planned: work.slice(0, Math.max(1, rule.sets - top.length)) };
}

/** A set under the bottom of the range, or under its own target when that was lowered on purpose. */
function missed(set: WorkoutSet, rule: ProgressionRule): boolean {
  return set.reps < Math.min(rule.repMin, set.target?.reps ?? rule.repMin);
}

export function isFailedSession(sets: WorkoutSet[], rule: ProgressionRule): boolean {
  return sets.some((s) => missed(s, rule));
}

function hitTopOfRange(read: SessionRead, rule: ProgressionRule, assisted: boolean): boolean {
  const harder = harderThan(assisted);
  return (
    read.planned.length >= rule.sets - read.top.length &&
    read.planned.every((s) => !harder(read.weight, s.weight) && s.reps >= rule.repMax)
  );
}

/** How the last working set of a session felt: what was left in the tank. */
function lastEffort(sets: WorkoutSet[]): Effort | undefined {
  return effortOf(sets[sets.length - 1]?.rpe);
}

interface ReadSession extends ExerciseSession {
  read: SessionRead;
}

/** All-out sessions in a row at this weight, the latest first. */
function allOutStreak(sessions: ReadSession[], weight: number): number {
  let streak = 0;
  for (const s of sessions) {
    if (lastEffort(s.read.planned) !== 'max' || s.read.weight !== weight) break;
    streak++;
  }
  return streak;
}

/** The best Epley estimate of a session (12 reps at most). */
function bestEstimate(sets: WorkoutSet[]): number {
  return Math.max(
    0,
    ...sets
      .filter((s) => s.reps >= 1 && s.reps <= 12)
      .map((s) => (s.reps === 1 ? s.weight : s.weight * (1 + s.reps / 30))),
  );
}

function fill(count: number, weight: number, reps: (i: number) => number): SetTarget[] {
  return Array.from({ length: count }, (_, i) => ({ weight: round2(weight), reps: reps(i) }));
}

export interface TargetOptions {
  startWeight?: number;
  /** Today. Without it, breaks are not looked at. */
  now?: Date;
  /** Never lighter than this once on it: the empty bar of a barbell lift. */
  minWeight?: number;
  /** Assisted machine: the weight is help, less of it is harder. */
  assisted?: boolean;
  /** The user follows their own cycle: last session again, set by set. */
  manual?: boolean;
}

/**
 * Computes today's target for each set.
 * `history` can be in any order; sessions with no working set are ignored,
 * and so are max tests: they have no working weight.
 */
export function nextTargets(
  history: ExerciseSession[],
  rule: ProgressionRule,
  options: TargetOptions = {},
): ProgressionResult {
  const assisted = !!options.assisted;
  const harder = harderThan(assisted);
  const done = history
    .map((h) => ({ date: h.date, sets: mainSets(h.sets) }))
    .filter((h) => h.sets.length > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sessions: ReadSession[] = done.flatMap((h) => {
    const read = readSession(h.sets, rule, assisted);
    return read ? [{ ...h, read }] : [];
  });

  const last = sessions[0];
  if (!last) {
    // Only max tests so far: start from 70 % of the best of them, like from a record
    const tested = assisted ? 0 : Math.max(0, ...done.map((h) => bestEstimate(h.sets)));
    const start = tested > 0 ? startWeightFromOneRepMax(tested, rule.increment) : options.startWeight;
    if (start != null) return { decision: 'start', targets: fill(rule.sets, start, () => rule.repMin) };
    return { decision: 'calibrate', targets: fill(rule.sets, 0, () => rule.repMin) };
  }

  // Mode manuel : l'utilisateur suit son cycle, on reprend sa dernière séance telle quelle
  if (options.manual) {
    return { decision: 'manual', targets: last.sets.map((s) => ({ weight: s.weight, reps: s.reps })) };
  }

  const { weight, planned, top } = last.read;
  const bodyweight = weight === 0;

  if (options.now && !bodyweight) {
    // The break counts from the last time the exercise was done, max test included
    const daysOff = Math.floor((options.now.getTime() - new Date(done[0]!.date).getTime()) / DAY_MS);
    const step = COMEBACK_STEPS.find((s) => daysOff >= s.days);
    if (step) {
      const lighter = assisted
        ? moreHelp(weight, step.keep, rule.increment)
        : comebackWeight(weight, step.keep, rule.increment, options.minWeight);
      return { decision: 'comeback', targets: fill(rule.sets, lighter, () => rule.repMin), daysOff };
    }
  }

  // Targets lowered under the range stay the floor until the range is back in reach
  const lowest = Math.min(...planned.map((s) => s.target?.reps ?? rule.repMin));
  const floor = Math.max(1, Math.min(rule.repMin, lowest));
  // Au poids du corps, pas de plafond : les reps sont la seule progression
  const clampReps = (r: number) => Math.max(floor, bodyweight ? r : Math.min(rule.repMax, r));
  const working = Math.max(1, rule.sets - top.length);
  // The top sets stay as they were, as long as they are still harder than the working weight
  const withTop = (targets: SetTarget[], at = weight): SetTarget[] => [
    ...top.filter((s) => harder(s.weight, at)).map((s) => ({ weight: s.weight, reps: s.reps, top: true })),
    ...targets,
  ];

  if (isFailedSession(planned, rule)) {
    let failures = 0;
    for (const s of sessions) {
      if (!isFailedSession(s.read.planned, rule) || s.read.weight !== weight) break;
      failures++;
    }

    if (failures >= FAILURES_BEFORE_DELOAD) {
      const lighter = bodyweight
        ? weight
        : assisted
          ? moreHelp(weight, DELOAD_FACTOR, rule.increment)
          : deloadWeight(weight, rule.increment, options.minWeight);
      if (lighter !== weight) return { decision: 'deload', targets: fill(rule.sets, lighter, () => rule.repMin) };
      // Nothing lighter makes sense: the reps really done become the target, and they climb from there
      const lowestDone = Math.max(1, Math.min(...planned.map((s) => s.reps)));
      return {
        decision: 'ease',
        targets: fill(rule.sets, weight, (i) => Math.max(1, planned[i]?.reps ?? lowestDone)),
      };
    }

    // Même charge, mêmes cibles qu'à la dernière séance
    return {
      decision: 'repeat',
      targets: withTop(
        fill(working, weight, (i) => {
          const set = planned[i];
          return set ? clampReps(set.target?.reps ?? set.reps) : floor;
        }),
      ),
    };
  }

  if (!bodyweight && hitTopOfRange(last.read, rule, assisted)) {
    const next = round2(assisted ? Math.max(0, weight - rule.increment) : weight + rule.increment);
    return {
      decision: 'add_weight',
      targets: withTop(
        fill(working, next, () => rule.repMin),
        next,
      ),
    };
  }

  const effort = lastEffort(planned);
  const hold = effort === 'max' && allOutStreak(sessions, weight) % 2 === 1;
  const unit = rule.repStep ?? 1;
  const step = hold ? 0 : effort === 'easy' ? 2 * unit : unit;
  const targets = fill(working, weight, (i) => {
    const set = planned[i];
    if (!set) return floor;
    // Une série faite plus légère ne compte pas comme un progrès à ce poids
    return clampReps(harder(weight, set.weight) ? set.reps : set.reps + step);
  });
  // "+2 reps" only when a target really moved by two: capped at the top of the range, it did not
  const moved = Math.max(0, ...planned.map((s, i) => (targets[i]?.reps ?? 0) - s.reps));
  const decision = hold ? 'hold' : step === 2 * unit && moved >= 2 * unit ? 'add_two_reps' : 'add_reps';
  return { decision, targets: withTop(targets) };
}
