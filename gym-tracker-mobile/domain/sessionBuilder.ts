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
import { planRest, type RestSource } from '@/domain/rest';
import { trainedOn, validSchedule, weekdayIndex } from '@/domain/schedule';
import {
  defaultIncrementFor,
  isPlateLoaded,
  findExerciseDef,
  getSplit,
  programDays,
  ruleFor,
  withOverride,
  type ExerciseDef,
  type ProgramDay,
} from '@/domain/programs';
import { t } from '@/i18n';
import type {
  ActiveExercise,
  AppSettings,
  CustomExercise,
  PersonalRecord,
  ProgressionRule,
  SetTarget,
  UserProfile,
  Workout,
  WorkoutSet,
} from '@/types';

export interface BuildContext {
  profile: Pick<UserProfile, 'goal' | 'program' | 'prs'>;
  settings: Pick<AppSettings, 'units' | 'defaultRestTime' | 'increments'> &
    Partial<Pick<AppSettings, 'customDays' | 'ruleOverrides' | 'restOverrides' | 'customExercises' | 'plateLoaded'>>;
  workouts: Workout[];
  /** Today. Without it, breaks are not looked at. */
  now?: Date;
}

export interface PlannedLift {
  def: ExerciseDef;
  rule: ProgressionRule;
  decision: ProgressionDecision;
  targets: SetTarget[];
  /** Plate-loaded machine in the user's gym: the weight is per side. */
  plateLoaded: boolean;
  restTime: number;
  restSource: RestSource;
  /** Why the rest lasts what it lasts. */
  restNote: string;
  /** Working sets of the last session, if any. */
  last: SetTarget[];
  /** Comeback only: days since the last session of the exercise. */
  daysOff?: number;
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

/**
 * What the week says about today: a session, rest, already trained, or no week set
 * (then the program days simply follow each other).
 */
export type TodayStatus = { kind: 'free' } | { kind: 'train'; name: string } | { kind: 'rest' } | { kind: 'done' };

export function todayStatus(ctx: BuildContext): TodayStatus {
  const names = getSplit(ctx.profile.program.split).days.map((d) => d.name);
  const schedule = validSchedule(ctx.profile.program.schedule, names);
  if (!schedule) return { kind: 'free' };
  const now = ctx.now ?? new Date();
  if (trainedOn(ctx.workouts, now)) return { kind: 'done' };
  const name = schedule[weekdayIndex(now)];
  return name ? { kind: 'train', name } : { kind: 'rest' };
}

/** Today's session from the week, else the day after the last one done, in program order. */
export function nextDay(ctx: BuildContext): ProgramDay {
  const days = programDays(ctx.profile.program.split, ctx.settings.customDays, ctx.settings.customExercises);
  const status = todayStatus(ctx);
  const planned = status.kind === 'train' ? days.find((d) => d.name === status.name) : undefined;
  if (planned) return planned;
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
  const plateLoaded = isPlateLoaded(def, ctx.settings.plateLoaded);
  const increment =
    ctx.settings.increments[def.name] ??
    lastRule?.increment ??
    defaultIncrementFor(def.equipment, ctx.settings.units, plateLoaded);
  const rule = withOverride(ruleFor(ctx.profile.goal, def, increment), ctx.settings.ruleOverrides?.[def.name]);

  let startWeight: number | undefined;
  if (def.equipment === 'bodyweight') startWeight = 0;
  else {
    const pr = prFor(def, ctx.profile.prs);
    if (pr) startWeight = startWeightFromOneRepMax(pr.oneRepMax, increment);
  }

  const { decision, targets, daysOff } = nextTargets(history, rule, { startWeight, now: ctx.now });
  const lastSession = history.find((h) => workingSets(h.sets).length > 0);
  const last = lastSession ? workingSets(lastSession.sets).map((set) => ({ weight: set.weight, reps: set.reps })) : [];
  const rest = planRest(def, rule, ctx.settings.defaultRestTime, history, ctx.settings.restOverrides?.[def.name]);
  return {
    def,
    rule,
    decision,
    targets,
    plateLoaded,
    restTime: rest.seconds,
    restSource: rest.source,
    restNote: rest.note,
    last,
    daysOff,
  };
}

export function planDay(day: ProgramDay, ctx: BuildContext): PlannedDay {
  const lifts = day.exercises.map((def) => planLift(def, ctx));
  // ~40 s par série plus le repos
  const seconds = lifts.reduce((sum, l) => sum + l.targets.length * (40 + l.restTime), 0);
  return { name: day.name, lifts, minutes: Math.round(seconds / 300) * 5 };
}

export function toActiveExercises(day: PlannedDay): ActiveExercise[] {
  return day.lifts.map(toActiveExercise);
}

export function toActiveExercise(lift: PlannedLift, i = 0): ActiveExercise {
  const needsWeight = lift.decision === 'calibrate';
  return {
    id: `${lift.def.name}-${Date.now()}-${i}`,
    name: lift.def.name,
    category: lift.def.category,
    muscleGroups: lift.def.muscleGroups,
    equipment: lift.def.equipment,
    plateLoaded: lift.plateLoaded || undefined,
    rule: lift.rule,
    calibration: needsWeight || undefined,
    timed: lift.def.timed || undefined,
    needsWeight,
    lastTime: lift.last.length ? lastTimeLabel(lift.last, lift.def.timed) : undefined,
    reason: reasonLabel(lift),
    restNote: lift.restNote || undefined,
    sets: lift.targets.map((t) => ({
      weight: t.weight,
      reps: t.reps,
      setType: 'normal' as const,
      restTime: lift.restTime,
      completed: false,
      target: t,
    })),
  };
}

/** What changed since last time, in a few words. */
export function deltaLabel(lift: Pick<PlannedLift, 'decision' | 'rule'>): string {
  const seconds = lift.rule.repStep;
  switch (lift.decision) {
    case 'add_reps':
      return seconds ? t('domain.plan.deltaSeconds', { s: seconds }) : t('domain.plan.deltaOneRep');
    case 'add_two_reps':
      return seconds ? t('domain.plan.deltaSeconds', { s: seconds * 2 }) : t('domain.plan.deltaTwoReps');
    case 'add_weight':
      return t('domain.plan.deltaWeight', { kg: formatKg(lift.rule.increment) });
    case 'hold':
    case 'repeat':
      return t('domain.plan.deltaSame');
    case 'deload':
      return t('domain.plan.deltaDeload');
    case 'comeback':
      return t('domain.plan.deltaComeback');
    case 'start':
      return t('domain.plan.deltaStart');
    case 'calibrate':
      return t('domain.plan.deltaCalibrate');
  }
}

/** "62,5 kg × 10", "12 reps", "45 s" or "10 kg × 45 s": one load as it is read in the gym. */
export function loadLabel(weight: number, reps: number | string, timed = false): string {
  if (weight > 0)
    return t(timed ? 'domain.load.kgTimesSeconds' : 'domain.load.kgTimes', { kg: formatKg(weight), reps });
  return t(timed ? 'domain.load.seconds' : 'domain.load.reps', { reps });
}

/** "60 kg × 10 · 10 · 9", "12 · 11 · 10 reps" at bodyweight, "45 · 45 · 40 s" held. */
export function lastTimeLabel(sets: SetTarget[], timed = false): string {
  const reps = sets.map((s) => s.reps).join(' · ');
  const weight = referenceWeight(sets.map((s) => ({ ...s, setType: 'normal' as const })));
  return loadLabel(weight, reps, timed);
}

/** Why today's target is what it is, in one sentence. */
export function reasonLabel(lift: Pick<PlannedLift, 'decision' | 'rule' | 'targets' | 'daysOff'>): string {
  const { rule } = lift;
  const bodyweight = (lift.targets[0]?.weight ?? 0) === 0;
  const seconds = rule.repStep;
  switch (lift.decision) {
    case 'add_weight':
      return t(seconds ? 'domain.plan.reasonAddWeightSeconds' : 'domain.plan.reasonAddWeight', {
        reps: rule.repMax,
        kg: formatKg(rule.increment),
      });
    case 'add_reps':
      if (seconds) return t('domain.plan.reasonAddSeconds', { s: seconds });
      return bodyweight
        ? t('domain.plan.reasonAddRepsBodyweight')
        : t('domain.plan.reasonAddReps', { reps: rule.repMax });
    case 'add_two_reps':
      return seconds ? t('domain.plan.reasonAddTwoSeconds', { s: seconds * 2 }) : t('domain.plan.reasonAddTwoReps');
    case 'hold':
      return t('domain.plan.reasonHold');
    case 'repeat':
      return t(seconds ? 'domain.plan.reasonRepeatSeconds' : 'domain.plan.reasonRepeat', { reps: rule.repMin });
    case 'deload':
      return t('domain.plan.reasonDeload');
    case 'comeback':
      return t('domain.plan.reasonComeback', { break: breakLabel(lift.daysOff ?? 14) });
    case 'start':
      return bodyweight ? t('domain.plan.reasonStartBodyweight') : t('domain.plan.reasonStart');
    case 'calibrate':
      return t('domain.plan.reasonCalibrate');
  }
}

/** "2 semaines", "1 mois", "3 mois". */
export function breakLabel(days: number): string {
  if (days < 30) return t('domain.plan.weeks', { count: Math.max(1, Math.floor(days / 7)) });
  return t('domain.plan.months', { count: Math.floor(days / 30) });
}

/** "3 × 10 · 62,5 kg", "3 × 13" at bodyweight, "3 × 45 s" held. Uneven reps show the lowest. */
export function targetLabel(targets: SetTarget[], timed = false): string {
  const first = targets[0];
  if (!first) return '';
  const reps = Math.min(...targets.map((t) => t.reps));
  const base = `${targets.length} × ${reps}${timed ? ' s' : ''}`;
  return first.weight > 0 ? `${base} · ${formatKg(first.weight)} kg` : base;
}

/** Today's target as it is read in the gym: "62,5 kg × 10", "12 reps" or "45 s" without weight. */
export function targetLoad(targets: SetTarget[], timed = false): string {
  const first = targets[0];
  if (!first) return '';
  return loadLabel(first.weight, Math.min(...targets.map((t) => t.reps)), timed);
}

/** How many times the logged weight counts in the total: 2 for both sides or both dumbbells. */
export type LoadFactor = (exerciseName: string) => number;

/** Weight lifted on validated working sets. */
export function tonnage(workout: Workout, factor: LoadFactor = () => 1): number {
  return workout.exercises.reduce(
    (sum, e) => sum + factor(e.name) * workingSets(e.sets).reduce((s, set) => s + set.weight * set.reps, 0),
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
export function newRecords(workout: Workout, history: Workout[], own: CustomExercise[] = []): NewRecord[] {
  const best = (sets: WorkoutSet[]) => Math.max(0, ...workingSets(sets).map((s) => s.weight));
  return workout.exercises.flatMap((exercise) => {
    const def = findExerciseDef(exercise.name, own);
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
