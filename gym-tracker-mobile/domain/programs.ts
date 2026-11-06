/**
 * PROGRAMMES — les séances prêtes à l'emploi et les règles par objectif.
 */

import { EXERCISES, POPULARITY, type ExerciseDef } from '@/domain/catalog';
import { exerciseName, t } from '@/i18n';
import { EXERCISE_NAMES_EN } from '@/i18n/exerciseNames';
import type {
  CustomExercise,
  Equipment,
  ExerciseCategory,
  Goal,
  MuscleGroup,
  ProgressionRule,
  RuleOverride,
  SplitId,
} from '@/types';

export { EXERCISES, POPULARITY, type ExerciseDef, type ExerciseKey } from '@/domain/catalog';

export interface ProgramDay {
  name: string;
  exercises: ExerciseDef[];
  /** Added by the user: it can be renamed or removed. */
  own?: boolean;
}

export interface Split {
  id: SplitId;
  title: string;
  meta: string;
  days: ProgramDay[];
}

const E = EXERCISES;

export const SPLITS: Split[] = [
  {
    id: 'ppl',
    get title() {
      return t('domain.programs.splitPpl');
    },
    get meta() {
      return t('domain.programs.metaPpl');
    },
    days: [
      { name: 'Push', exercises: [E.bench, E.ohp, E.incline, E.lateral, E.dips] },
      { name: 'Pull', exercises: [E.pullup, E.row, E.pulldown, E.facepull, E.curl] },
      { name: 'Legs', exercises: [E.squat, E.rdl, E.legpress, E.legcurl, E.calves] },
    ],
  },
  {
    id: 'ul',
    get title() {
      return t('domain.programs.splitUl');
    },
    get meta() {
      return t('domain.programs.metaUl');
    },
    days: [
      { name: 'Haut', exercises: [E.bench, E.row, E.ohp, E.pulldown, E.curl] },
      { name: 'Bas', exercises: [E.squat, E.rdl, E.legpress, E.legcurl, E.calves] },
    ],
  },
  {
    id: 'fb',
    get title() {
      return t('domain.programs.splitFb');
    },
    get meta() {
      return t('domain.programs.metaFb');
    },
    days: [
      { name: 'Full body A', exercises: [E.squat, E.bench, E.row, E.ohp, E.curl] },
      { name: 'Full body B', exercises: [E.deadlift, E.incline, E.pullup, E.lunge, E.dips] },
    ],
  },
];

export function getSplit(id: SplitId): Split {
  return SPLITS.find((s) => s.id === id) ?? SPLITS[0]!;
}

/** Where a day's own exercise list is saved: "ppl/Legs". */
export function dayKey(split: SplitId, day: string): string {
  return `${split}/${day}`;
}

/** The exercises the user saved for a day, if any. Names no longer in the catalog are skipped. */
function savedExercises(
  split: SplitId,
  name: string,
  customDays: Record<string, string[]> | undefined,
  own: CustomExercise[] | undefined,
): ExerciseDef[] | undefined {
  return customDays?.[dayKey(split, name)]?.map((n) => findExerciseDef(n, own)).filter((e): e is ExerciseDef => !!e);
}

/**
 * The days of the program with the user's own exercises when they chose
 * some. Names no longer in the catalog are skipped.
 */
// Both lists are required, even when undefined: without the own exercises, they vanish from their days
export function programDays(
  split: SplitId,
  customDays: Record<string, string[]> | undefined,
  own: CustomExercise[] | undefined,
  ownDays?: Record<string, string[]>,
): ProgramDay[] {
  const exercisesOf = (name: string) => savedExercises(split, name, customDays, own);
  const days = getSplit(split).days.map((day) => {
    const exercises = exercisesOf(day.name);
    return exercises ? { name: day.name, exercises } : day;
  });
  // The days the user added, after the program's, with what they put in them
  const added = (ownDays?.[split] ?? []).map((name) => ({ name, exercises: exercisesOf(name) ?? [], own: true }));
  return [...days, ...added];
}

/** The muscle most of the day works: where the list opens. */
export function mainMuscle(exercises: ExerciseDef[]): MuscleGroup | undefined {
  const counts = new Map<MuscleGroup, number>();
  for (const e of exercises) {
    const m = e.muscleGroups[0];
    if (m) counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/** A day with exercises: the only kind offered as a session. */
export const hasExercises = (day: ProgramDay): boolean => day.exercises.length > 0;

/** Off program, one full body: Full body A and B only make sense as a pair, in the program itself. */
export const EXTRA_FULL_BODY = 'Full body';

/** Off program, the session the user puts together themselves. It starts empty. */
export const OWN_SESSION = 'Ma séance';

/** A day the user can pick: from their program, or from another one for a one-off session. */
export interface ChoosableDay extends ProgramDay {
  split: SplitId;
  /** Not in the user's program: done once, it does not move the program along. */
  extra: boolean;
  /** The session the user puts together: offered even before it has exercises. */
  ownSession?: boolean;
}

/** What another program offers for a one-off: its days, a single full body instead of A and B. */
function extraDaysOf(
  other: SplitId,
  customDays: Record<string, string[]> | undefined,
  own: CustomExercise[] | undefined,
  ownDays?: Record<string, string[]>,
): ProgramDay[] {
  const days = programDays(other, customDays, own, ownDays);
  if (other !== 'fb') return days;
  const fullBody: ProgramDay = {
    name: EXTRA_FULL_BODY,
    exercises: savedExercises(other, EXTRA_FULL_BODY, customDays, own) ?? getSplit('fb').days[0]!.exercises,
  };
  return [fullBody, ...days.filter((d) => d.own)];
}

/**
 * The user's program days, then the days of the other programs (Haut, Bas,
 * Full body…) for the day the plan does not fit, then the user's own session.
 * Each keeps the exercises the user chose for it, saved under its own program
 * ("ul/Haut"); the own session under the user's program.
 */
export function choosableDays(
  split: SplitId,
  customDays: Record<string, string[]> | undefined,
  own: CustomExercise[] | undefined,
  ownDays?: Record<string, string[]>,
): ChoosableDay[] {
  const out: ChoosableDay[] = programDays(split, customDays, own, ownDays).map((d) => ({ ...d, split, extra: false }));
  const add = (day: ChoosableDay) => {
    if (!out.some((d) => d.name === day.name)) out.push(day);
  };
  for (const other of SPLITS) {
    if (other.id === split) continue;
    for (const day of extraDaysOf(other.id, customDays, own, ownDays)) add({ ...day, split: other.id, extra: true });
  }
  const exercises = savedExercises(split, OWN_SESSION, customDays, own) ?? [];
  add({ name: OWN_SESSION, exercises, split, extra: true, ownSession: true });
  return out;
}

/** A day offered as a session: one with exercises, or the own session, to fill in. */
export const isOffered = (day: ChoosableDay): boolean => hasExercises(day) || !!day.ownSession;

/** The program a day belongs to, the user's own first. */
export function splitOfDay(name: string, current: SplitId): SplitId | undefined {
  if (getSplit(current).days.some((d) => d.name === name)) return current;
  if (name === EXTRA_FULL_BODY) return 'fb';
  return SPLITS.find((s) => s.days.some((d) => d.name === name))?.id;
}

/** A day of the program by name, if it exists. */
export function findDay(split: Split, name: string): ProgramDay | undefined {
  return split.days.find((d) => d.name === name);
}

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  get chest() {
    return t('domain.programs.muscles.chest');
  },
  get back() {
    return t('domain.programs.muscles.back');
  },
  get shoulders() {
    return t('domain.programs.muscles.shoulders');
  },
  get biceps() {
    return t('domain.programs.muscles.biceps');
  },
  get triceps() {
    return t('domain.programs.muscles.triceps');
  },
  get arms() {
    return t('domain.programs.muscles.arms');
  },
  get legs() {
    return t('domain.programs.muscles.legs');
  },
  get glutes() {
    return t('domain.programs.muscles.glutes');
  },
  get calves() {
    return t('domain.programs.muscles.calves');
  },
  get core() {
    return t('domain.programs.muscles.core');
  },
};

/** Where an exercise can be filed. "Bras" stays for old data, biceps and triceps replace it. */
export const MUSCLE_CHOICES = (Object.keys(MUSCLE_LABELS) as MuscleGroup[]).filter((m) => m !== 'arms');

/** The catalog, then the user's own exercises. */
export function allExercises(own: CustomExercise[] = []): ExerciseDef[] {
  return [...Object.values(EXERCISES), ...own.map((e) => ({ ...e, custom: true }))];
}

const RANK = new Map<string, number>(POPULARITY.map((key, i) => [EXERCISES[key].name, i]));

/**
 * From the most known to the least known (`POPULARITY`). The user's own
 * exercises come first: they made them, they know them. Stable otherwise.
 */
export function byPopularity(list: ExerciseDef[]): ExerciseDef[] {
  const rank = (e: ExerciseDef) => (e.custom ? -1 : (RANK.get(e.name) ?? POPULARITY.length));
  return [...list].sort((a, b) => rank(a) - rank(b));
}

/** The whole catalog and the user's own, most known first: the list the pickers offer. */
export function exercisesByPopularity(own: CustomExercise[] = []): ExerciseDef[] {
  return byPopularity(allExercises(own));
}

export function findExerciseDef(name: string, own: CustomExercise[] = []): ExerciseDef | undefined {
  const lower = name.trim().toLowerCase();
  return allExercises(own).find(
    (e) => e.name.toLowerCase() === lower || e.aliases?.some((a) => a.toLowerCase() === lower),
  );
}

/** Lower case, without accents: "écarté" matches "ecarte". */
export function searchKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Exercises whose name, English name or old name contains every typed word,
 * most known first. "Butterfly", "Lat pulldown" or "tirage" all find theirs.
 */
export function searchExercises(query: string, own: CustomExercise[] = []): ExerciseDef[] {
  const words = searchKey(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return exercisesByPopularity(own).filter((e) => {
    const names = [exerciseName(e.name), ...namesOf(e)].map(searchKey).join(' ');
    return words.every((w) => names.includes(w));
  });
}

/** Every name an exercise is known by: French, English, old names. Gym-goers in France say "Leg curl" too. */
export function namesOf(def: ExerciseDef): string[] {
  const english = EXERCISE_NAMES_EN[def.name];
  return [def.name, ...(english && english !== def.name ? [english] : []), ...(def.aliases ?? [])];
}

const hasWords = (text: string, words: string[]) => words.every((w) => searchKey(text).includes(w));

/**
 * The other name the search found the exercise under: "Lat pulldown"
 * finds "Tirage vertical". Nothing when the name shown matches. In English,
 * the French name is one of the other names.
 */
export function aliasMatch(def: ExerciseDef, query: string): string | undefined {
  const words = searchKey(query).split(/\s+/).filter(Boolean);
  const shown = exerciseName(def.name);
  if (words.length === 0 || hasWords(shown, words)) return undefined;
  return namesOf(def)
    .filter((n) => n !== shown)
    .find((a) => hasWords(a, words));
}

/** Other exercises for the same main muscle, most known first: to swap when the machine is taken. */
export function alternativesFor(def: ExerciseDef, own: CustomExercise[] = []): ExerciseDef[] {
  const main = def.muscleGroups[0];
  return exercisesByPopularity(own).filter((e) => e.name !== def.name && e.muscleGroups[0] === main);
}

/** Close enough to share sets and reps: same main muscle, same kind of movement, both loaded or both bodyweight. */
export function similarExercises(def: ExerciseDef, own: CustomExercise[] = []): ExerciseDef[] {
  const bodyweight = def.equipment === 'bodyweight';
  // Seconds and reps never share a rule: a plank does not follow the crunches
  return alternativesFor(def, own).filter(
    (e) => e.category === def.category && (e.equipment === 'bodyweight') === bodyweight && !!e.timed === !!def.timed,
  );
}

export const NAME_MAX = 40;

/**
 * A new exercise from the form. Refused when the name is empty or already
 * taken by the catalog, an old name, or another own exercise.
 */
export function makeCustomExercise(
  input: { name: string; equipment: Equipment; category: ExerciseCategory; muscle: MuscleGroup; timed?: boolean },
  own: CustomExercise[] = [],
): CustomExercise | { error: string } {
  const name = input.name.trim().replace(/\s+/g, ' ').slice(0, NAME_MAX);
  if (!name) return { error: t('domain.programs.nameEmpty') };
  const lower = name.toLowerCase();
  // The English name counts in both languages: "Bench press" is taken
  const existing =
    findExerciseDef(name, own) ??
    allExercises(own).find((e) => [exerciseName(e.name), ...namesOf(e)].some((n) => n.toLowerCase() === lower));
  if (existing) {
    const shown = exerciseName(existing.name);
    return shown.toLowerCase() === lower
      ? { error: t('domain.programs.nameTaken') }
      : { error: t('domain.programs.nameTakenAs', { name: shown }) };
  }
  const made: CustomExercise = {
    name,
    equipment: input.equipment,
    category: input.category,
    muscleGroups: [input.muscle],
  };
  return input.timed ? { ...made, timed: true } : made;
}

export interface GoalDef {
  id: Goal;
  title: string;
  sub: string;
  /** Plates per side drawn on the goal card. */
  plates: number[];
}

const goalDef = (id: Goal, plates: number[]): GoalDef => ({
  id,
  plates,
  get title() {
    return t(`domain.programs.goals.${id}Title`);
  },
  get sub() {
    return t(`domain.programs.goals.${id}Sub`);
  },
});

export const GOALS: GoalDef[] = [goalDef('muscle', [10, 5]), goalDef('force', [20, 20]), goalDef('forme', [5])];

/**
 * Default weight step. Big movements on a stack machine move by a full stack
 * plate (5 kg); cables and single-muscle work on a stack by 2,5 kg, so a
 * lateral raise never jumps by half. Plate-loaded machines move by a small
 * plate on each side.
 * Kettlebells move by 4 kg.
 */
export function defaultIncrementFor(
  def: Pick<ExerciseDef, 'equipment' | 'category' | 'gear'>,
  units: 'kg' | 'lbs',
  plateLoaded = false,
): number {
  if (def.gear === 'kettlebell') return units === 'lbs' ? 10 : 4;
  if (units === 'lbs') return 5;
  if (def.equipment === 'dumbbell') return 2;
  if (def.equipment === 'machine' && !plateLoaded && def.gear !== 'cable' && def.category === 'compound') return 5;
  return 2.5;
}

/** What the exercise is done with, for its label: a kettlebell is not shown as "Haltères". */
export function equipmentShown(def: ExerciseDef): Equipment | 'kettlebell' {
  return def.gear === 'kettlebell' ? 'kettlebell' : def.equipment;
}

/**
 * An easier exercise for the same movement, for a beginner who cannot reach
 * the bottom of the range yet: pull-ups → assisted pull-ups, dips → assisted dips.
 */
export function easierVariant(def: Pick<ExerciseDef, 'name'>): ExerciseDef | undefined {
  const E = EXERCISES;
  const easier: Record<string, ExerciseDef> = {
    [E.pullup.name]: E.assisted,
    [E.chinup.name]: E.assisted,
    [E.widepullup.name]: E.assisted,
    [E.neutralpullup.name]: E.assisted,
    [E.dips.name]: E.assisteddips,
  };
  return easier[def.name];
}

/** Loaded with plates on each side: the user's choice, else the catalog's. Machines only. */
export function isPlateLoaded(def: ExerciseDef, own: Record<string, boolean> = {}): boolean {
  return def.equipment === 'machine' && (own[def.name] ?? !!def.plateLoaded);
}

/** A timed exercise: 3 holds of 30 to 60 s, 5 s more each time. */
export const TIMED_RULE = { sets: 3, repMin: 30, repMax: 60, repStep: 5 } as const;

/** Heavy low reps only make sense on the big barbell lifts. */
export function ruleFor(goal: Goal, def: ExerciseDef, increment: number): ProgressionRule {
  if (def.timed) return { kind: 'double', ...TIMED_RULE, increment };
  if (goal === 'force' && def.equipment === 'barbell') {
    return { kind: 'double', sets: 5, repMin: 3, repMax: 5, increment };
  }
  if (goal === 'forme') return { kind: 'double', sets: 3, repMin: 10, repMax: 15, increment };
  return { kind: 'double', sets: 3, repMin: 8, repMax: 12, increment };
}

export const RULE_LIMITS = { sets: [1, 10], reps: [1, 50], seconds: [5, 600] } as const;

/**
 * Keeps a rule the user is editing valid: at least one set, min reps never
 * above max. Timed: seconds, from 5 s to 10 min.
 */
export function clampRule(rule: RuleOverride, timed = false): RuleOverride {
  const clamp = (n: number, [lo, hi]: readonly [number, number]) => Math.max(lo, Math.min(hi, Math.round(n)));
  const range = timed ? RULE_LIMITS.seconds : RULE_LIMITS.reps;
  const sets = clamp(rule.sets, RULE_LIMITS.sets);
  const repMin = clamp(rule.repMin, range);
  const repMax = Math.max(repMin, clamp(rule.repMax, range));
  return { sets, repMin, repMax };
}

/** The goal's rule, with the user's own sets and reps on top. */
export function withOverride(rule: ProgressionRule, override: RuleOverride | undefined): ProgressionRule {
  return override ? { ...rule, ...clampRule(override, rule.repStep !== undefined) } : rule;
}

/** Minimum rest per goal and kind of set, in seconds. Very heavy sets (5 reps or less) always get 4 min. */
export const REST_BY_GOAL = {
  muscle: { heavy: 240, compound: 180, isolation: 120 },
  force: { heavy: 240, compound: 210, isolation: 150 },
  forme: { heavy: 240, compound: 90, isolation: 60 },
} as const satisfies Record<Goal, Record<'heavy' | 'compound' | 'isolation', number>>;

/** The muscle goal's rests, the reference. */
export const REST_BY_KIND = REST_BY_GOAL.muscle;

/**
 * Rest between sets from the goal and the kind of exercise: 4 min for very
 * heavy sets (5 reps or less); for big movements 3 min (muscle), 3 min 30
 * (force), 1 min 30 (forme); for a single muscle 2 min, 2 min 30, 1 min.
 * Abs and calves keep the default rest, and the default is never cut.
 */
export function restFor(rule: ProgressionRule, defaultRest: number, def?: ExerciseDef, goal: Goal = 'muscle'): number {
  const rests = REST_BY_GOAL[goal];
  if (rule.repMax <= 5) return Math.max(defaultRest, rests.heavy);
  if (!def) return defaultRest;
  if (def.category === 'compound') return Math.max(defaultRest, rests.compound);
  const main = def.muscleGroups[0];
  if (main === 'core' || main === 'calves') return defaultRest;
  return Math.max(defaultRest, rests.isolation);
}
