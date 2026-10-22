/**
 * SÉANCE DU JOUR — choisit la séance suivante du programme et calcule
 * chaque cible avec le moteur de progression. Logique pure.
 */

import {
  nextTargets,
  referenceWeight,
  startWeightFromOneRepMax,
  workingSets,
  type ExerciseSession,
  type ProgressionDecision,
} from '@/domain/progression';
import { formatKg } from '@/domain/plates';
import {
  defaultIncrementFor,
  findExerciseDef,
  getSplit,
  restFor,
  ruleFor,
  type ExerciseDef,
  type ProgramDay,
} from '@/domain/programs';
import type {
  ActiveExercise,
  AppSettings,
  PersonalRecord,
  ProgressionRule,
  SetTarget,
  UserProfile,
  Workout,
  WorkoutSet,
} from '@/types';

export interface BuildContext {
  profile: Pick<UserProfile, 'goal' | 'program' | 'prs'>;
  settings: Pick<AppSettings, 'units' | 'defaultRestTime' | 'increments'>;
  workouts: Workout[];
}

export interface PlannedLift {
  def: ExerciseDef;
  rule: ProgressionRule;
  decision: ProgressionDecision;
  targets: SetTarget[];
  restTime: number;
  /** Working sets of the last session, if any. */
  last: SetTarget[];
}

export interface PlannedDay {
  name: string;
  lifts: PlannedLift[];
  minutes: number;
}

function matches(def: ExerciseDef, name: string): boolean {
  const lower = name.toLowerCase();
  return def.name.toLowerCase() === lower || !!def.aliases?.some((a) => a.toLowerCase() === lower);
}

/** Every past session of this exercise, newest first, with the rule it used. */
export function exerciseHistory(
  def: ExerciseDef,
  workouts: Workout[],
): (ExerciseSession & { rule?: ProgressionRule })[] {
  const out: (ExerciseSession & { rule?: ProgressionRule })[] = [];
  for (const w of workouts) {
    for (const e of w.exercises) {
      if (matches(def, e.name)) out.push({ date: w.date, sets: e.sets, rule: e.rule });
    }
  }
  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** The day after the last one done, in program order. */
export function nextDay(ctx: BuildContext): ProgramDay {
  const { days } = getSplit(ctx.profile.program.split);
  const last = [...ctx.workouts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .find((w) => days.some((d) => d.name === w.name));
  const index = last ? days.findIndex((d) => d.name === last.name) : -1;
  return days[(index + 1) % days.length]!;
}

function prFor(def: ExerciseDef, prs: PersonalRecord[]): PersonalRecord | undefined {
  return prs.find((p) => matches(def, p.exercise));
}

export function planLift(def: ExerciseDef, ctx: BuildContext): PlannedLift {
  const history = exerciseHistory(def, ctx.workouts);
  const lastRule = history.find((h) => h.rule)?.rule;
  const increment =
    ctx.settings.increments[def.name] ?? lastRule?.increment ?? defaultIncrementFor(def.equipment, ctx.settings.units);
  const rule = ruleFor(ctx.profile.goal, def, increment);

  let startWeight: number | undefined;
  if (def.equipment === 'bodyweight') startWeight = 0;
  else {
    const pr = prFor(def, ctx.profile.prs);
    if (pr) startWeight = startWeightFromOneRepMax(pr.oneRepMax, increment);
  }

  const { decision, targets } = nextTargets(history, rule, { startWeight });
  const lastSession = history.find((h) => workingSets(h.sets).length > 0);
  const last = lastSession ? workingSets(lastSession.sets).map((set) => ({ weight: set.weight, reps: set.reps })) : [];
  return { def, rule, decision, targets, restTime: restFor(rule, ctx.settings.defaultRestTime), last };
}

export function planDay(day: ProgramDay, ctx: BuildContext): PlannedDay {
  const lifts = day.exercises.map((def) => planLift(def, ctx));
  // ~40 s par série plus le repos
  const seconds = lifts.reduce((sum, l) => sum + l.targets.length * (40 + l.restTime), 0);
  return { name: day.name, lifts, minutes: Math.round(seconds / 300) * 5 };
}

export function toActiveExercises(day: PlannedDay): ActiveExercise[] {
  return day.lifts.map((lift, i) => {
    const needsWeight = lift.decision === 'calibrate';
    return {
      id: `${lift.def.name}-${Date.now()}-${i}`,
      name: lift.def.name,
      category: lift.def.category,
      muscleGroups: lift.def.muscleGroups,
      equipment: lift.def.equipment,
      rule: lift.rule,
      calibration: needsWeight || undefined,
      needsWeight,
      lastTime: lift.last.length ? lastTimeLabel(lift.last) : undefined,
      reason: reasonLabel(lift),
      sets: lift.targets.map((t) => ({
        weight: t.weight,
        reps: t.reps,
        setType: 'normal' as const,
        restTime: lift.restTime,
        completed: false,
        target: t,
      })),
    };
  });
}

/** What changed since last time, in a few words. */
export function deltaLabel(lift: Pick<PlannedLift, 'decision' | 'rule'>): string {
  switch (lift.decision) {
    case 'add_reps':
      return '+1 rep';
    case 'add_weight':
      return `+${formatKg(lift.rule.increment)} kg`;
    case 'repeat':
      return 'même cible';
    case 'deload':
      return 'allégé';
    case 'start':
      return 'départ';
    case 'calibrate':
      return 'à régler';
  }
}

/** "60 kg × 10 · 10 · 9", or "12 · 11 · 10 reps" at bodyweight. */
export function lastTimeLabel(sets: SetTarget[]): string {
  const reps = sets.map((s) => s.reps).join(' · ');
  const weight = referenceWeight(sets.map((s) => ({ ...s, setType: 'normal' as const })));
  return weight > 0 ? `${formatKg(weight)} kg × ${reps}` : `${reps} reps`;
}

/** Why today's target is what it is, in one sentence. */
export function reasonLabel(lift: Pick<PlannedLift, 'decision' | 'rule' | 'targets'>): string {
  const { rule } = lift;
  const bodyweight = (lift.targets[0]?.weight ?? 0) === 0;
  switch (lift.decision) {
    case 'add_weight':
      return `Toutes tes séries ont atteint ${rule.repMax} reps : on ajoute ${formatKg(rule.increment)} kg.`;
    case 'add_reps':
      return bodyweight
        ? 'Une rep de plus par série que la dernière fois.'
        : `Une rep de plus par série. À ${rule.repMax} reps partout, on ajoute du poids.`;
    case 'repeat':
      return `Une série est passée sous ${rule.repMin} reps : on garde la même cible.`;
    case 'deload':
      return 'Deux séances difficiles de suite : on allège de 10 % pour mieux repartir.';
    case 'start':
      return bodyweight
        ? 'Première séance : vise le bas de la fourchette.'
        : 'Charge de départ calculée à 70 % de ton record.';
    case 'calibrate':
      return 'Première fois : choisis ta charge, ensuite on calcule tout.';
  }
}

/** "3 × 10 · 62,5 kg", or "3 × 13" at bodyweight. Uneven reps show the lowest. */
export function targetLabel(targets: SetTarget[]): string {
  const first = targets[0];
  if (!first) return '';
  const reps = Math.min(...targets.map((t) => t.reps));
  const base = `${targets.length} × ${reps}`;
  return first.weight > 0 ? `${base} · ${formatKg(first.weight)} kg` : base;
}

/** Weight lifted on validated working sets. */
export function tonnage(workout: Workout): number {
  return workout.exercises.reduce(
    (sum, e) => sum + workingSets(e.sets).reduce((s, set) => s + set.weight * set.reps, 0),
    0,
  );
}

export interface NewRecord {
  name: string;
  weight: number;
  previous: number;
}

/**
 * Exercises of `workout` lifted heavier than ever before (best validated
 * working set). A first session is not a record: there is nothing to beat.
 */
export function newRecords(workout: Workout, history: Workout[]): NewRecord[] {
  const best = (sets: WorkoutSet[]) => Math.max(0, ...workingSets(sets).map((s) => s.weight));
  return workout.exercises.flatMap((exercise) => {
    const def = findExerciseDef(exercise.name);
    const now = best(exercise.sets);
    if (!def || now === 0) return [];
    const before = history
      .filter((w) => w.id !== workout.id && new Date(w.date) < new Date(workout.date))
      .flatMap((w) => w.exercises.filter((e) => matches(def, e.name)).map((e) => best(e.sets)));
    const previous = Math.max(0, ...before);
    return before.length && now > previous ? [{ name: def.name, weight: now, previous }] : [];
  });
}

/** Reference weight of each past session, oldest first. Ignores bodyweight sessions. */
export function weightHistory(def: ExerciseDef, workouts: Workout[]): { date: string; weight: number }[] {
  return exerciseHistory(def, workouts)
    .map((h) => ({ date: h.date, weight: referenceWeight(workingSets(h.sets)) }))
    .filter((h) => h.weight > 0)
    .reverse();
}
