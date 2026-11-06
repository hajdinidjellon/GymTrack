/**
 * SÉANCE DU JOUR — choisit la séance suivante du programme et calcule
 * chaque cible avec le moteur de progression. Logique pure.
 */

import {
  COMEBACK_STEPS,
  nextTargets,
  referenceWeight,
  startWeightFromOneRepMax,
  workingSets,
  mainSets,
  type ExerciseSession,
  type ProgressionDecision,
} from '@/domain/progression';
import { loadableIncrement, loadableWeight, loadingOf } from '@/domain/loading';
import { DEFAULT_BAR, emptyBar, formatKg } from '@/domain/plates';
import { planRest, type RestSource } from '@/domain/rest';
import { trainedOn, validSchedule, weekdayIndex, type Schedule } from '@/domain/schedule';
import {
  dayKey,
  defaultIncrementFor,
  easierVariant,
  isPlateLoaded,
  findExerciseDef,
  getSplit,
  hasExercises,
  programDays,
  ruleFor,
  withOverride,
  type ExerciseDef,
  type ProgramDay,
} from '@/domain/programs';
import { exerciseName, t } from '@/i18n';
import type {
  ActiveExercise,
  AppSettings,
  CustomExercise,
  PersonalRecord,
  ProgressionRule,
  SetTarget,
  SplitId,
  UserProfile,
  Workout,
  WorkoutSet,
} from '@/types';

export interface BuildContext {
  profile: Pick<UserProfile, 'goal' | 'program' | 'prs'> & Partial<Pick<UserProfile, 'sessionMinutes'>>;
  settings: Pick<AppSettings, 'units' | 'defaultRestTime' | 'increments'> &
    Partial<
      Pick<
        AppSettings,
        | 'customDays'
        | 'ruleOverrides'
        | 'restOverrides'
        | 'customExercises'
        | 'plateLoaded'
        | 'supersets'
        | 'ownDays'
        | 'barWeight'
        | 'plates'
        | 'collarWeight'
        | 'manualProgression'
        | 'stackStep'
        | 'cableStep'
      >
    >;
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
  /** Exercises chained with the one after them (superset). */
  links?: string[];
  /** Exercises of the program day left out to fit the user's usual session time. */
  dropped?: number;
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

function programDaysOf(ctx: BuildContext): ProgramDay[] {
  return programDays(
    ctx.profile.program.split,
    ctx.settings.customDays,
    ctx.settings.customExercises,
    ctx.settings.ownDays,
  );
}

/**
 * The user's fixed week, if it fits the program: its days and the days the
 * user added to it. `canDo` tells the days that can be done today: an own day
 * left empty cannot, the program days then follow each other on it.
 */
export function weekOf(ctx: BuildContext): { schedule: Schedule; canDo: (name: string) => boolean } | null {
  const days = programDaysOf(ctx);
  const schedule = validSchedule(
    ctx.profile.program.schedule,
    days.map((d) => d.name),
  );
  if (!schedule) return null;
  return { schedule, canDo: (name) => days.some((d) => d.name === name && (!d.own || hasExercises(d))) };
}

export function todayStatus(ctx: BuildContext): TodayStatus {
  const week = weekOf(ctx);
  const now = ctx.now ?? new Date();
  // Already trained today, fixed week or not: no other session "du jour"
  if (trainedOn(ctx.workouts, now)) return { kind: 'done' };
  if (!week) return { kind: 'free' };
  const name = week.schedule[weekdayIndex(now)];
  if (!name) return { kind: 'rest' };
  return week.canDo(name) ? { kind: 'train', name } : { kind: 'free' };
}

/** Today's session from the week, else the day after the last one done, in program order. */
export function nextDay(ctx: BuildContext): ProgramDay {
  const all = programDaysOf(ctx);
  // An empty day (just created) is never the next session
  const filled = all.filter(hasExercises);
  const days = filled.length ? filled : all;
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
  const loading = loadingOf({ equipment: def.equipment, plateLoaded });
  const { barWeight, plates, collarWeight } = ctx.settings;
  const gym = barWeight != null && plates ? { barWeight, plates, collarWeight } : null;
  const wanted =
    ctx.settings.increments[def.name] ??
    lastRule?.increment ??
    defaultIncrementFor(def, ctx.settings.units, plateLoaded, ctx.settings);
  // Never a step the plates cannot make: 1,25 kg plates make 2,5 on the bar, not 1
  const increment = gym ? loadableIncrement(loading, wanted, gym.plates) : wanted;
  const rule = withOverride(ruleFor(ctx.profile.goal, def, increment), ctx.settings.ruleOverrides?.[def.name]);

  let startWeight: number | undefined;
  if (def.equipment === 'bodyweight') startWeight = 0;
  else if (!def.assisted) {
    const pr = prFor(def, ctx.profile.prs);
    if (pr) startWeight = startWeightFromOneRepMax(pr.oneRepMax, increment);
  }

  const manual = !!ctx.settings.manualProgression?.[def.name];
  const result = nextTargets(history, rule, {
    startWeight,
    now: ctx.now,
    manual,
    // Never under the empty bar (collars included) on a barbell lift
    minWeight:
      def.equipment === 'barbell'
        ? emptyBar({ barWeight: ctx.settings.barWeight ?? DEFAULT_BAR, collarWeight: ctx.settings.collarWeight })
        : undefined,
    assisted: def.assisted,
  });
  const { decision, daysOff } = result;
  // Never a load the plates cannot make (101,25 kg left by an old 1,25 kg step): the one just under.
  // In manual mode the user's own loads stay as they are.
  const targets =
    gym && decision !== 'manual'
      ? result.targets.map((tg) => ({ ...tg, weight: loadableWeight(loading, tg.weight, gym) }))
      : result.targets;
  const lastSession = history.find((h) => mainSets(h.sets).length > 0);
  const last = lastSession ? mainSets(lastSession.sets).map((set) => ({ weight: set.weight, reps: set.reps })) : [];
  const rest = planRest(
    def,
    rule,
    ctx.settings.defaultRestTime,
    history,
    ctx.settings.restOverrides?.[def.name],
    ctx.profile.goal,
  );
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

/** ~40 s per set plus its rest. */
const liftSeconds = (l: PlannedLift) => l.targets.length * (40 + l.restTime);

/** Never fewer exercises than this to fit the time: a session of two exercises is not one. */
export const MIN_LIFTS_TO_FIT = 3;

/**
 * The lifts that fit in the user's usual session time: the last ones of a
 * program day go first. A day the user set up themselves stays whole.
 */
export function fitToTime(lifts: PlannedLift[], minutes: number | undefined): PlannedLift[] {
  if (!minutes) return lifts;
  const kept = [...lifts];
  const total = () => kept.reduce((sum, l) => sum + liftSeconds(l), 0);
  while (kept.length > MIN_LIFTS_TO_FIT && total() > minutes * 60) kept.pop();
  return kept;
}

/** The program's own list for the day, untouched by the user. */
function isProgramDay(day: ProgramDay & { split?: SplitId }, ctx: BuildContext): boolean {
  const split = day.split ?? ctx.profile.program.split;
  if (ctx.settings.customDays?.[dayKey(split, day.name)]) return false;
  const builtIn = getSplit(split).days.find((d) => d.name === day.name);
  return !!builtIn && builtIn.exercises.length === day.exercises.length;
}

export function planDay(day: ProgramDay & { split?: SplitId }, ctx: BuildContext): PlannedDay {
  const all = day.exercises.map((def) => planLift(def, ctx));
  const lifts = isProgramDay(day, ctx) ? fitToTime(all, ctx.profile.sessionMinutes) : all;
  const seconds = lifts.reduce((sum, l) => sum + liftSeconds(l), 0);
  const links = ctx.settings.supersets?.[dayKey(day.split ?? ctx.profile.program.split, day.name)];
  const dropped = all.length - lifts.length;
  return {
    name: day.name,
    lifts,
    minutes: Math.round(seconds / 300) * 5,
    ...(links?.length ? { links } : {}),
    ...(dropped ? { dropped } : {}),
  };
}

/**
 * The superset group of each lift: a lift chained with the next one shares
 * its group. A chain of three makes a tri-set. Alone: no group.
 */
export function supersetGroups(names: string[], links: string[] = []): (string | undefined)[] {
  const groups: (string | undefined)[] = names.map(() => undefined);
  for (let i = 0; i < names.length - 1; i++) {
    if (!links.includes(names[i]!)) continue;
    const group = groups[i] ?? names[i]!;
    groups[i] = group;
    groups[i + 1] = group;
  }
  return groups;
}

export function toActiveExercises(day: PlannedDay): ActiveExercise[] {
  const groups = supersetGroups(
    day.lifts.map((l) => l.def.name),
    day.links,
  );
  return day.lifts.map((lift, i) => {
    const exercise = toActiveExercise(lift, i);
    const group = groups[i];
    return group ? { ...exercise, superset: group } : exercise;
  });
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
    assisted: lift.def.assisted || undefined,
    needsWeight,
    lastTime: lift.last.length ? lastTimeLabel(lift.last, lift.def.timed, lift.def.assisted) : undefined,
    reason: reasonLabel(lift),
    restNote: lift.restNote || undefined,
    sets: lift.targets.map((t) => ({
      weight: t.weight,
      reps: t.reps,
      setType: t.top ? ('top' as const) : ('normal' as const),
      restTime: lift.restTime,
      completed: false,
      target: { weight: t.weight, reps: t.reps },
    })),
  };
}

/** What changed since last time, in a few words. */
export function deltaLabel(
  lift: Pick<PlannedLift, 'decision' | 'rule'> & { def?: Pick<ExerciseDef, 'assisted'> },
): string {
  const seconds = lift.rule.repStep;
  const assisted = !!lift.def?.assisted;
  switch (lift.decision) {
    case 'add_reps':
      return seconds ? t('domain.plan.deltaSeconds', { s: seconds }) : t('domain.plan.deltaOneRep');
    case 'add_two_reps':
      return seconds ? t('domain.plan.deltaSeconds', { s: seconds * 2 }) : t('domain.plan.deltaTwoReps');
    case 'add_weight':
      return t(assisted ? 'domain.plan.deltaLessHelp' : 'domain.plan.deltaWeight', {
        kg: formatKg(lift.rule.increment),
      });
    case 'hold':
    case 'repeat':
    case 'manual':
      return t('domain.plan.deltaSame');
    case 'deload':
      return t(assisted ? 'domain.plan.deltaMoreHelp' : 'domain.plan.deltaDeload');
    case 'ease':
      return t('domain.plan.deltaEase');
    case 'comeback':
      return t('domain.plan.deltaComeback');
    case 'start':
      return t('domain.plan.deltaStart');
    case 'calibrate':
      return t('domain.plan.deltaCalibrate');
  }
}

/**
 * "62,5 kg × 10", "Poids du corps × 12", "45 s", "10 kg × 45 s" or
 * "Aide : 30 kg × 8" on an assisted machine: one load as it is read in the gym.
 */
export function loadLabel(weight: number, reps: number | string, timed = false, assisted = false): string {
  const kg = formatKg(weight);
  if (assisted && weight > 0)
    return t(timed ? 'domain.load.assistTimesSeconds' : 'domain.load.assistTimes', { kg, reps });
  if (weight > 0) return t(timed ? 'domain.load.kgTimesSeconds' : 'domain.load.kgTimes', { kg, reps });
  return t(timed ? 'domain.load.seconds' : 'domain.load.reps', { reps });
}

/** "60 kg × 10 · 10 · 9", "Poids du corps × 12 · 11 · 10", "45 · 45 · 40 s" held. */
export function lastTimeLabel(sets: SetTarget[], timed = false, assisted = false): string {
  const reps = sets.map((s) => s.reps).join(' · ');
  const weight = referenceWeight(sets.map((s) => ({ ...s, setType: 'normal' as const })));
  return loadLabel(weight, reps, timed, assisted);
}

/** The targets of the working sets: the kept top sets left out. */
function workTargets(targets: SetTarget[]): SetTarget[] {
  const work = targets.filter((x) => !x.top);
  return work.length ? work : targets;
}

type ReasonInput = Pick<PlannedLift, 'decision' | 'rule' | 'targets' | 'daysOff'> & {
  def?: Pick<ExerciseDef, 'name' | 'assisted'>;
};

/** Why today's target is what it is, in one sentence; one more when a top set is kept or an easier variant helps. */
export function reasonLabel(lift: ReasonInput): string {
  const lines = [mainReason(lift)];
  if (lift.targets.some((x) => x.top)) lines.push(t('domain.plan.reasonTopKept'));
  const easier = lift.decision === 'ease' && lift.def ? easierVariant(lift.def) : undefined;
  if (easier) lines.push(t('domain.plan.reasonEasierVariant', { name: exerciseName(easier.name) }));
  return lines.join(' ');
}

function mainReason(lift: ReasonInput): string {
  const { rule } = lift;
  const bodyweight = (workTargets(lift.targets)[0]?.weight ?? 0) === 0;
  const assisted = !!lift.def?.assisted;
  const seconds = rule.repStep;
  switch (lift.decision) {
    case 'add_weight':
      if (assisted) return t('domain.plan.reasonLessHelp', { reps: rule.repMax, kg: formatKg(rule.increment) });
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
      if (assisted) return t('domain.plan.reasonMoreHelp', { reps: rule.repMin });
      return t(seconds ? 'domain.plan.reasonDeloadSeconds' : 'domain.plan.reasonDeload', { reps: rule.repMin });
    case 'ease':
      return t(seconds ? 'domain.plan.reasonEaseSeconds' : 'domain.plan.reasonEase', { reps: rule.repMin });
    case 'comeback':
      return t('domain.plan.reasonComeback', { break: breakLabel(lift.daysOff ?? 14) });
    case 'start':
      return bodyweight ? t('domain.plan.reasonStartBodyweight') : t('domain.plan.reasonStart');
    case 'calibrate':
      return t('domain.plan.reasonCalibrate');
    case 'manual':
      return t('domain.plan.reasonManual');
  }
}

/**
 * The break the home talks about: the days since the user's last session,
 * whatever it was, once some lift of today comes back lighter and the break
 * is long enough for a comeback. 0 otherwise. Each lift keeps its own decision.
 */
export function breakDays(
  lifts: Pick<PlannedLift, 'decision'>[],
  workouts: Pick<Workout, 'date'>[],
  now: Date,
): number {
  if (!lifts.some((l) => l.decision === 'comeback') || workouts.length === 0) return 0;
  const latest = Math.max(...workouts.map((w) => new Date(w.date).getTime()));
  const days = Math.floor((now.getTime() - latest) / (24 * 60 * 60 * 1000));
  return days >= COMEBACK_STEPS[COMEBACK_STEPS.length - 1]!.days ? days : 0;
}

/** "2 semaines", "1 mois", "3 mois". */
export function breakLabel(days: number): string {
  if (days < 30) return t('domain.plan.weeks', { count: Math.max(1, Math.floor(days / 7)) });
  return t('domain.plan.months', { count: Math.floor(days / 30) });
}

/**
 * "3 × 10 · 62,5 kg", "3 × 13 · Poids du corps", "3 × 45 s" held, "3 × 8 · Aide : 30 kg".
 * Uneven reps show the lowest. A kept top set is left out: the working sets are the plan.
 */
export function targetLabel(targets: SetTarget[], timed = false, assisted = false): string {
  const work = workTargets(targets);
  const first = work[0];
  if (!first) return '';
  const reps = Math.min(...work.map((x) => x.reps));
  const base = `${work.length} × ${reps}${timed ? ' s' : ''}`;
  if (first.weight <= 0) return timed ? base : `${base} · ${t('domain.load.bodyweight')}`;
  const load = assisted ? t('domain.load.assist', { kg: formatKg(first.weight) }) : `${formatKg(first.weight)} kg`;
  return `${base} · ${load}`;
}

/** Today's target as it is read in the gym: "62,5 kg × 10", "Poids du corps × 12" or "45 s" without weight. */
export function targetLoad(targets: SetTarget[], timed = false, assisted = false): string {
  const work = workTargets(targets);
  const first = work[0];
  if (!first) return '';
  return loadLabel(first.weight, Math.min(...work.map((x) => x.reps)), timed, assisted);
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
    // More help on an assisted machine is never a record
    if (!def || now === 0 || def.assisted) return [];
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
    .map((h) => ({ date: h.date, weight: referenceWeight(mainSets(h.sets)) }))
    .filter((h) => h.weight > 0)
    .reverse();
}
