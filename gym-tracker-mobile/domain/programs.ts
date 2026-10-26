/**
 * PROGRAMMES — les séances prêtes à l'emploi et les règles par objectif.
 */

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

export interface ExerciseDef extends CustomExercise {
  /** Older names in the history that refer to the same exercise. */
  aliases?: string[];
  /** Created by the user. */
  custom?: boolean;
}

const ex = (
  name: string,
  equipment: Equipment,
  category: ExerciseCategory,
  muscleGroups: MuscleGroup[],
  aliases?: string[],
): ExerciseDef => ({ name, equipment, category, muscleGroups, aliases });

export const EXERCISES = {
  bench: ex('Développé couché', 'barbell', 'compound', ['chest', 'shoulders', 'arms'], ['Développé couché barre']),
  ohp: ex('Développé militaire', 'barbell', 'compound', ['shoulders', 'arms'], ['Développé militaire barre']),
  incline: ex('Développé incliné haltères', 'dumbbell', 'compound', ['chest', 'shoulders']),
  lateral: ex('Élévations latérales', 'dumbbell', 'isolation', ['shoulders'], ['Élévations latérales haltères']),
  dips: ex('Dips', 'bodyweight', 'compound', ['chest', 'arms'], ['Dips triceps', 'Dips poitrine']),
  pullup: ex('Tractions', 'bodyweight', 'compound', ['back', 'arms'], ['Tractions pronation']),
  row: ex('Rowing barre', 'barbell', 'compound', ['back', 'arms']),
  pulldown: ex('Tirage vertical', 'machine', 'compound', ['back', 'arms'], ['Tirage vertical poulie']),
  facepull: ex('Face pull', 'machine', 'isolation', ['shoulders', 'back'], ['Face pulls']),
  curl: ex('Curl haltères', 'dumbbell', 'isolation', ['arms'], ['Curl haltères alternés']),
  squat: ex('Squat', 'barbell', 'compound', ['legs', 'glutes'], ['Squat barre']),
  rdl: ex('Soulevé de terre roumain', 'barbell', 'compound', ['legs', 'glutes', 'back']),
  deadlift: ex('Soulevé de terre', 'barbell', 'compound', ['back', 'legs', 'glutes']),
  legpress: ex('Presse à cuisses', 'machine', 'compound', ['legs', 'glutes'], ['Leg press']),
  legcurl: ex('Leg curl', 'machine', 'isolation', ['legs'], ['Leg curl couché']),
  lunge: ex('Fentes haltères', 'dumbbell', 'compound', ['legs', 'glutes'], ['Fentes bulgares']),
  calves: ex('Mollets debout', 'machine', 'isolation', ['calves'], ['Mollets debout machine']),
  fly: ex('Écarté poulie', 'machine', 'isolation', ['chest']),
  dbrow: ex('Rowing haltère', 'dumbbell', 'compound', ['back', 'arms']),
  pushdown: ex('Extension triceps poulie', 'machine', 'isolation', ['arms']),
  hammer: ex('Curl marteau', 'dumbbell', 'isolation', ['arms']),
  legext: ex('Leg extension', 'machine', 'isolation', ['legs']),
  hipthrust: ex('Hip thrust', 'barbell', 'compound', ['glutes', 'legs']),
} satisfies Record<string, ExerciseDef>;

export interface ProgramDay {
  name: string;
  exercises: ExerciseDef[];
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
    title: 'Push · Pull · Legs',
    meta: '3–6 j',
    days: [
      { name: 'Push', exercises: [E.bench, E.ohp, E.incline, E.lateral, E.dips] },
      { name: 'Pull', exercises: [E.pullup, E.row, E.pulldown, E.facepull, E.curl] },
      { name: 'Legs', exercises: [E.squat, E.rdl, E.legpress, E.legcurl, E.calves] },
    ],
  },
  {
    id: 'ul',
    title: 'Haut · Bas',
    meta: '4 j',
    days: [
      { name: 'Haut', exercises: [E.bench, E.row, E.ohp, E.pulldown, E.curl] },
      { name: 'Bas', exercises: [E.squat, E.rdl, E.legpress, E.legcurl, E.calves] },
    ],
  },
  {
    id: 'fb',
    title: 'Full body',
    meta: '2–3 j',
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

/**
 * The days of the program with the user's own exercises when they chose
 * some. Names no longer in the catalog are skipped.
 */
export function programDays(
  split: SplitId,
  customDays: Record<string, string[]> = {},
  own: CustomExercise[] = [],
): ProgramDay[] {
  return getSplit(split).days.map((day) => {
    const names = customDays[dayKey(split, day.name)];
    if (!names) return day;
    const exercises = names.map((n) => findExerciseDef(n, own)).filter((e): e is ExerciseDef => !!e);
    return { name: day.name, exercises };
  });
}

/** A day of the program by name, if it exists. */
export function findDay(split: Split, name: string): ProgramDay | undefined {
  return split.days.find((d) => d.name === name);
}

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  arms: 'Bras',
  legs: 'Jambes',
  glutes: 'Fessiers',
  calves: 'Mollets',
  core: 'Abdos',
};

/** The catalog, then the user's own exercises. */
export function allExercises(own: CustomExercise[] = []): ExerciseDef[] {
  return [...Object.values(EXERCISES), ...own.map((e) => ({ ...e, custom: true }))];
}

/** The whole catalog grouped by main muscle, in the order of MUSCLE_LABELS. */
export function catalogByMuscle(own: CustomExercise[] = []): { muscle: MuscleGroup; exercises: ExerciseDef[] }[] {
  const all = allExercises(own);
  return (Object.keys(MUSCLE_LABELS) as MuscleGroup[])
    .map((muscle) => ({ muscle, exercises: all.filter((e) => e.muscleGroups[0] === muscle) }))
    .filter((g) => g.exercises.length > 0);
}

export function findExerciseDef(name: string, own: CustomExercise[] = []): ExerciseDef | undefined {
  const lower = name.trim().toLowerCase();
  return allExercises(own).find(
    (e) => e.name.toLowerCase() === lower || e.aliases?.some((a) => a.toLowerCase() === lower),
  );
}

/** Other exercises for the same main muscle, to swap when the machine is taken. */
export function alternativesFor(def: ExerciseDef, own: CustomExercise[] = []): ExerciseDef[] {
  const main = def.muscleGroups[0];
  return allExercises(own).filter((e) => e.name !== def.name && e.muscleGroups[0] === main);
}

export const NAME_MAX = 40;

/**
 * A new exercise from the form. Refused when the name is empty or already
 * taken by the catalog, an old name, or another own exercise.
 */
export function makeCustomExercise(
  input: { name: string; equipment: Equipment; category: ExerciseCategory; muscle: MuscleGroup },
  own: CustomExercise[] = [],
): CustomExercise | { error: string } {
  const name = input.name.trim().replace(/\s+/g, ' ').slice(0, NAME_MAX);
  if (!name) return { error: 'Donne un nom à ton exercice.' };
  if (findExerciseDef(name, own)) return { error: 'Cet exercice existe déjà.' };
  return { name, equipment: input.equipment, category: input.category, muscleGroups: [input.muscle] };
}

export interface GoalDef {
  id: Goal;
  title: string;
  sub: string;
  /** Plates per side drawn on the goal card. */
  plates: number[];
}

export const GOALS: GoalDef[] = [
  { id: 'muscle', title: 'Prendre du muscle', sub: '3 × 8–12 reps', plates: [10, 5] },
  { id: 'force', title: 'Devenir plus fort', sub: '5 × 3–5 reps, lourd', plates: [20, 20] },
  { id: 'forme', title: 'Rester en forme', sub: '3 × 10–15 reps, court', plates: [5] },
];

/** Default weight step per equipment. Machines usually move by a full stack plate. */
export function defaultIncrementFor(equipment: Equipment, units: 'kg' | 'lbs'): number {
  if (units === 'lbs') return 5;
  if (equipment === 'dumbbell') return 2;
  if (equipment === 'machine') return 5;
  return 2.5;
}

/** Heavy low reps only make sense on the big barbell lifts. */
export function ruleFor(goal: Goal, def: ExerciseDef, increment: number): ProgressionRule {
  if (goal === 'force' && def.equipment === 'barbell') {
    return { kind: 'double', sets: 5, repMin: 3, repMax: 5, increment };
  }
  if (goal === 'forme') return { kind: 'double', sets: 3, repMin: 10, repMax: 15, increment };
  return { kind: 'double', sets: 3, repMin: 8, repMax: 12, increment };
}

export const RULE_LIMITS = { sets: [1, 10], reps: [1, 50] } as const;

/** Keeps a rule the user is editing valid: at least one set, min reps never above max. */
export function clampRule(rule: RuleOverride): RuleOverride {
  const clamp = (n: number, [lo, hi]: readonly [number, number]) => Math.max(lo, Math.min(hi, Math.round(n)));
  const sets = clamp(rule.sets, RULE_LIMITS.sets);
  const repMin = clamp(rule.repMin, RULE_LIMITS.reps);
  const repMax = Math.max(repMin, clamp(rule.repMax, RULE_LIMITS.reps));
  return { sets, repMin, repMax };
}

/** The goal's rule, with the user's own sets and reps on top. */
export function withOverride(rule: ProgressionRule, override: RuleOverride | undefined): ProgressionRule {
  return override ? { ...rule, ...clampRule(override) } : rule;
}

/**
 * Rest between sets from the kind of exercise: heavy sets and big barbell
 * lifts need longer, a small single-muscle exercise less.
 */
export function restFor(rule: ProgressionRule, defaultRest: number, def?: ExerciseDef): number {
  if (rule.repMax <= 5) return Math.max(defaultRest, 180);
  if (!def) return defaultRest;
  if (def.category === 'compound' && def.equipment === 'barbell') return defaultRest + 30;
  if (def.category === 'isolation') return Math.max(45, defaultRest - 15);
  return defaultRest;
}
