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
  /** A machine loaded with plates on each side, like a Hammer Strength press. */
  plateLoaded?: boolean;
}

const ex = (
  name: string,
  equipment: Equipment,
  category: ExerciseCategory,
  muscleGroups: MuscleGroup[],
  aliases?: string[],
): ExerciseDef => ({ name, equipment, category, muscleGroups, aliases });

const withPlates = (def: ExerciseDef): ExerciseDef => ({ ...def, plateLoaded: true });

export const EXERCISES = {
  // Pectoraux
  bench: ex('Développé couché', 'barbell', 'compound', ['chest', 'shoulders', 'triceps'], ['Développé couché barre']),
  dbbench: ex('Développé couché haltères', 'dumbbell', 'compound', ['chest', 'shoulders', 'triceps']),
  smithbench: ex('Développé couché Smith', 'machine', 'compound', ['chest', 'shoulders', 'triceps'], ['Smith bench']),
  inclinebar: ex('Développé incliné barre', 'barbell', 'compound', ['chest', 'shoulders', 'triceps']),
  incline: ex('Développé incliné haltères', 'dumbbell', 'compound', ['chest', 'shoulders']),
  inclinesmith: ex('Développé incliné Smith', 'machine', 'compound', ['chest', 'shoulders']),
  decline: ex('Développé décliné', 'barbell', 'compound', ['chest', 'triceps']),
  convergent: withPlates(
    ex(
      'Développé convergent machine',
      'machine',
      'compound',
      ['chest', 'shoulders', 'triceps'],
      ['Bench press convergent', 'Chest press convergente'],
    ),
  ),
  chestpress: withPlates(ex('Chest press', 'machine', 'compound', ['chest', 'triceps'], ['Développé assis machine'])),
  inclinemachine: withPlates(ex('Développé incliné machine', 'machine', 'compound', ['chest', 'shoulders'])),
  dips: ex('Dips', 'bodyweight', 'compound', ['chest', 'triceps'], ['Dips triceps', 'Dips poitrine']),
  pushup: ex('Pompes', 'bodyweight', 'compound', ['chest', 'triceps']),
  fly: ex('Écarté poulie', 'machine', 'isolation', ['chest'], ['Crossover poulie']),
  lowfly: ex('Écarté poulie basse', 'machine', 'isolation', ['chest']),
  pecdeck: ex('Pec deck', 'machine', 'isolation', ['chest'], ['Butterfly']),
  dbfly: ex('Écarté haltères', 'dumbbell', 'isolation', ['chest']),

  // Dos
  pullup: ex('Tractions', 'bodyweight', 'compound', ['back', 'biceps'], ['Tractions pronation']),
  chinup: ex('Tractions supination', 'bodyweight', 'compound', ['back', 'biceps'], ['Chin-up']),
  assisted: ex('Tractions assistées', 'machine', 'compound', ['back', 'biceps']),
  pulldown: ex(
    'Tirage vertical',
    'machine',
    'compound',
    ['back', 'biceps'],
    ['Tirage vertical poulie', 'Lat pulldown'],
  ),
  closepulldown: ex('Tirage vertical prise serrée', 'machine', 'compound', ['back', 'biceps']),
  row: ex('Rowing barre', 'barbell', 'compound', ['back', 'biceps']),
  pendlay: ex('Rowing Pendlay', 'barbell', 'compound', ['back', 'biceps']),
  dbrow: ex('Rowing haltère', 'dumbbell', 'compound', ['back', 'biceps']),
  seatedrow: ex('Rowing assis poulie', 'machine', 'compound', ['back', 'biceps'], ['Tirage horizontal']),
  machinerow: withPlates(
    ex('Rowing machine', 'machine', 'compound', ['back', 'biceps'], ['Low row', 'Rowing convergent']),
  ),
  tbar: withPlates(ex('Rowing T-bar', 'machine', 'compound', ['back', 'biceps'])),
  deadlift: ex('Soulevé de terre', 'barbell', 'compound', ['back', 'legs', 'glutes']),
  pullover: ex('Pull-over poulie', 'machine', 'isolation', ['back']),
  shrug: ex('Shrugs haltères', 'dumbbell', 'isolation', ['back'], ['Shrugs']),
  backext: ex('Extensions lombaires', 'bodyweight', 'isolation', ['back', 'glutes']),

  // Épaules
  ohp: ex('Développé militaire', 'barbell', 'compound', ['shoulders', 'triceps'], ['Développé militaire barre']),
  dbpress: ex(
    'Développé épaules haltères',
    'dumbbell',
    'compound',
    ['shoulders', 'triceps'],
    ['Développé haltères assis'],
  ),
  shoulderpress: withPlates(ex('Shoulder press machine', 'machine', 'compound', ['shoulders', 'triceps'])),
  arnold: ex('Développé Arnold', 'dumbbell', 'compound', ['shoulders', 'triceps']),
  lateral: ex('Élévations latérales', 'dumbbell', 'isolation', ['shoulders'], ['Élévations latérales haltères']),
  cablelateral: ex('Élévations latérales poulie', 'machine', 'isolation', ['shoulders']),
  machinelateral: ex('Élévations latérales machine', 'machine', 'isolation', ['shoulders']),
  frontraise: ex('Élévations frontales', 'dumbbell', 'isolation', ['shoulders']),
  reardelt: ex('Oiseau haltères', 'dumbbell', 'isolation', ['shoulders'], ['Élévations postérieures']),
  reversepec: ex('Reverse pec deck', 'machine', 'isolation', ['shoulders', 'back']),
  facepull: ex('Face pull', 'machine', 'isolation', ['shoulders', 'back'], ['Face pulls']),
  uprightrow: ex('Rowing menton', 'barbell', 'compound', ['shoulders', 'back']),

  // Biceps
  curl: ex('Curl haltères', 'dumbbell', 'isolation', ['biceps'], ['Curl haltères alternés']),
  barcurl: ex('Curl barre', 'barbell', 'isolation', ['biceps']),
  ezcurl: ex('Curl barre EZ', 'barbell', 'isolation', ['biceps']),
  hammer: ex('Curl marteau', 'dumbbell', 'isolation', ['biceps']),
  inclinecurl: ex('Curl incliné haltères', 'dumbbell', 'isolation', ['biceps']),
  preacher: ex('Curl pupitre', 'machine', 'isolation', ['biceps'], ['Larry Scott']),
  cablecurl: ex('Curl poulie', 'machine', 'isolation', ['biceps']),

  // Triceps
  pushdown: ex('Extension triceps poulie', 'machine', 'isolation', ['triceps'], ['Pushdown']),
  overhead: ex('Extension triceps nuque poulie', 'machine', 'isolation', ['triceps']),
  dbext: ex('Extension triceps haltère', 'dumbbell', 'isolation', ['triceps']),
  skull: ex('Barre au front', 'barbell', 'isolation', ['triceps'], ['Skull crusher']),
  closegrip: ex('Développé couché prise serrée', 'barbell', 'compound', ['triceps', 'chest']),
  dipsmachine: ex('Dips machine', 'machine', 'compound', ['triceps', 'chest']),
  kickback: ex('Kickback triceps', 'dumbbell', 'isolation', ['triceps']),

  // Jambes
  squat: ex('Squat', 'barbell', 'compound', ['legs', 'glutes'], ['Squat barre']),
  frontsquat: ex('Squat avant', 'barbell', 'compound', ['legs', 'glutes'], ['Front squat']),
  smithsquat: ex('Squat Smith', 'machine', 'compound', ['legs', 'glutes']),
  hacksquat: withPlates(ex('Hack squat', 'machine', 'compound', ['legs', 'glutes'])),
  pendulum: withPlates(ex('Pendulum squat', 'machine', 'compound', ['legs', 'glutes'])),
  goblet: ex('Goblet squat', 'dumbbell', 'compound', ['legs', 'glutes']),
  legpress: withPlates(ex('Presse à cuisses', 'machine', 'compound', ['legs', 'glutes'], ['Leg press'])),
  lunge: ex('Fentes haltères', 'dumbbell', 'compound', ['legs', 'glutes']),
  bulgarian: ex('Fentes bulgares', 'dumbbell', 'compound', ['legs', 'glutes']),
  rdl: ex('Soulevé de terre roumain', 'barbell', 'compound', ['legs', 'glutes', 'back']),
  dbrdl: ex('Soulevé de terre roumain haltères', 'dumbbell', 'compound', ['legs', 'glutes', 'back']),
  sumo: ex('Soulevé de terre sumo', 'barbell', 'compound', ['legs', 'glutes', 'back']),
  legext: ex('Leg extension', 'machine', 'isolation', ['legs']),
  legcurl: ex('Leg curl', 'machine', 'isolation', ['legs'], ['Leg curl couché']),
  seatedlegcurl: ex('Leg curl assis', 'machine', 'isolation', ['legs']),
  adductor: ex('Adducteurs machine', 'machine', 'isolation', ['legs']),

  // Fessiers
  hipthrust: ex('Hip thrust', 'barbell', 'compound', ['glutes', 'legs']),
  hipthrustmachine: withPlates(ex('Hip thrust machine', 'machine', 'compound', ['glutes', 'legs'])),
  abductor: ex('Abducteurs machine', 'machine', 'isolation', ['glutes']),
  glutekick: ex('Kickback fessier poulie', 'machine', 'isolation', ['glutes']),

  // Mollets
  calves: ex('Mollets debout', 'machine', 'isolation', ['calves'], ['Mollets debout machine']),
  seatedcalves: ex('Mollets assis', 'machine', 'isolation', ['calves']),
  presscalves: ex('Mollets à la presse', 'machine', 'isolation', ['calves']),

  // Abdos
  cablecrunch: ex('Crunch poulie', 'machine', 'isolation', ['core']),
  crunch: ex('Crunch', 'bodyweight', 'isolation', ['core']),
  legraise: ex('Relevés de jambes', 'bodyweight', 'isolation', ['core']),
  abwheel: ex('Roue abdominale', 'bodyweight', 'isolation', ['core']),
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
  biceps: 'Biceps',
  triceps: 'Triceps',
  arms: 'Bras',
  legs: 'Jambes',
  glutes: 'Fessiers',
  calves: 'Mollets',
  core: 'Abdos',
};

/** Where an exercise can be filed. "Bras" stays for old data, biceps and triceps replace it. */
export const MUSCLE_CHOICES = (Object.keys(MUSCLE_LABELS) as MuscleGroup[]).filter((m) => m !== 'arms');

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

/** Lower case, without accents: "écarté" matches "ecarte". */
export function searchKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Exercises whose name (or old name) contains every typed word. */
export function searchExercises(query: string, own: CustomExercise[] = []): ExerciseDef[] {
  const words = searchKey(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return allExercises(own).filter((e) => {
    const names = [e.name, ...(e.aliases ?? [])].map(searchKey).join(' ');
    return words.every((w) => names.includes(w));
  });
}

/** Other exercises for the same main muscle, to swap when the machine is taken. */
export function alternativesFor(def: ExerciseDef, own: CustomExercise[] = []): ExerciseDef[] {
  const main = def.muscleGroups[0];
  return allExercises(own).filter((e) => e.name !== def.name && e.muscleGroups[0] === main);
}

/** Close enough to share sets and reps: same main muscle, same kind of movement, both loaded or both bodyweight. */
export function similarExercises(def: ExerciseDef, own: CustomExercise[] = []): ExerciseDef[] {
  const bodyweight = def.equipment === 'bodyweight';
  return alternativesFor(def, own).filter(
    (e) => e.category === def.category && (e.equipment === 'bodyweight') === bodyweight,
  );
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

/**
 * Default weight step per equipment. Stack machines move by a full stack plate,
 * plate-loaded ones by a small plate on each side.
 */
export function defaultIncrementFor(equipment: Equipment, units: 'kg' | 'lbs', plateLoaded = false): number {
  if (units === 'lbs') return 5;
  if (equipment === 'dumbbell') return 2;
  if (equipment === 'machine' && !plateLoaded) return 5;
  return 2.5;
}

/** Loaded with plates on each side: the user's choice, else the catalog's. Machines only. */
export function isPlateLoaded(def: ExerciseDef, own: Record<string, boolean> = {}): boolean {
  return def.equipment === 'machine' && (own[def.name] ?? !!def.plateLoaded);
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

/** Minimum rest per kind of set, in seconds. */
export const REST_BY_KIND = { heavy: 240, compound: 180, isolation: 120 } as const;

/**
 * Rest between sets from the kind of exercise: 4 min for very heavy sets
 * (5 reps or less), 3 min for big movements, 2 min for a single muscle
 * (biceps, triceps, shoulders…). Abs and calves keep the default rest,
 * and the default is never cut.
 */
export function restFor(rule: ProgressionRule, defaultRest: number, def?: ExerciseDef): number {
  if (rule.repMax <= 5) return Math.max(defaultRest, REST_BY_KIND.heavy);
  if (!def) return defaultRest;
  if (def.category === 'compound') return Math.max(defaultRest, REST_BY_KIND.compound);
  const main = def.muscleGroups[0];
  if (main === 'core' || main === 'calves') return defaultRest;
  return Math.max(defaultRest, REST_BY_KIND.isolation);
}
