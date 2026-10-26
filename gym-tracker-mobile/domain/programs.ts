/**
 * PROGRAMMES — les séances prêtes à l'emploi et les règles par objectif.
 */

import type { Equipment, ExerciseCategory, Goal, MuscleGroup, ProgressionRule, SplitId } from '@/types';

export interface ExerciseDef {
  name: string;
  equipment: Equipment;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  /** Older names in the history that refer to the same exercise. */
  aliases?: string[];
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

/** The whole catalog grouped by main muscle, in the order of MUSCLE_LABELS. */
export function catalogByMuscle(): { muscle: MuscleGroup; exercises: ExerciseDef[] }[] {
  const all: ExerciseDef[] = Object.values(EXERCISES);
  return (Object.keys(MUSCLE_LABELS) as MuscleGroup[])
    .map((muscle) => ({ muscle, exercises: all.filter((e) => e.muscleGroups[0] === muscle) }))
    .filter((g) => g.exercises.length > 0);
}

export function findExerciseDef(name: string): ExerciseDef | undefined {
  const lower = name.toLowerCase();
  return Object.values(EXERCISES).find(
    (e) => e.name.toLowerCase() === lower || e.aliases?.some((a) => a.toLowerCase() === lower),
  );
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

/** Rest between sets: heavy sets need longer. */
export function restFor(rule: ProgressionRule, defaultRest: number): number {
  return rule.repMax <= 5 ? Math.max(defaultRest, 180) : defaultRest;
}
