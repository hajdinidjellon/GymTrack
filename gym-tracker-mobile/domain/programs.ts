/**
 * PROGRAMMES — les séances prêtes à l'emploi et les règles par objectif.
 */

import { exerciseName, t } from '@/i18n';
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
  /**
   * Other names of the very same exercise (old names, English names). Never a
   * variant: an alias blocks creating an exercise of that name.
   */
  aliases?: string[];
  /** Created by the user. */
  custom?: boolean;
  /** A machine loaded with plates on each side, like a Hammer Strength press. */
  plateLoaded?: boolean;
  /** A cable station or a Smith machine: the usual weights differ from a stack machine's. */
  gear?: 'cable' | 'smith';
  /** A counterweight helps (assisted pull-ups): less weight is harder, progress takes help away. */
  assisted?: boolean;
}

const ex = (
  name: string,
  equipment: Equipment,
  category: ExerciseCategory,
  muscleGroups: MuscleGroup[],
  aliases?: string[],
): ExerciseDef => ({ name, equipment, category, muscleGroups, aliases });

const withPlates = (def: ExerciseDef): ExerciseDef => ({ ...def, plateLoaded: true });
const onCable = (def: ExerciseDef): ExerciseDef => ({ ...def, gear: 'cable' });
const onSmith = (def: ExerciseDef): ExerciseDef => ({ ...def, gear: 'smith' });
const held = (def: ExerciseDef): ExerciseDef => ({ ...def, timed: true });
const helped = (def: ExerciseDef): ExerciseDef => ({ ...def, assisted: true });

export const EXERCISES = {
  // Pectoraux
  bench: ex('Développé couché', 'barbell', 'compound', ['chest', 'shoulders', 'triceps'], ['Développé couché barre']),
  dbbench: ex('Développé couché haltères', 'dumbbell', 'compound', ['chest', 'shoulders', 'triceps']),
  smithbench: onSmith(
    ex('Développé couché Smith', 'machine', 'compound', ['chest', 'shoulders', 'triceps'], ['Smith bench']),
  ),
  inclinebar: ex('Développé incliné barre', 'barbell', 'compound', ['chest', 'shoulders', 'triceps']),
  incline: ex('Développé incliné haltères', 'dumbbell', 'compound', ['chest', 'shoulders']),
  inclinesmith: onSmith(ex('Développé incliné Smith', 'machine', 'compound', ['chest', 'shoulders'])),
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
  dips: ex('Dips', 'bodyweight', 'compound', ['chest', 'triceps']),
  pushup: ex('Pompes', 'bodyweight', 'compound', ['chest', 'triceps']),
  fly: onCable(ex('Écarté poulie', 'machine', 'isolation', ['chest'], ['Crossover poulie'])),
  lowfly: onCable(ex('Écarté poulie basse', 'machine', 'isolation', ['chest'])),
  pecdeck: ex('Pec deck', 'machine', 'isolation', ['chest'], ['Butterfly']),
  dbfly: ex('Écarté haltères', 'dumbbell', 'isolation', ['chest']),

  // Dos
  pullup: ex('Tractions', 'bodyweight', 'compound', ['back', 'biceps'], ['Tractions pronation']),
  chinup: ex('Tractions supination', 'bodyweight', 'compound', ['back', 'biceps'], ['Chin-up']),
  assisted: helped(ex('Tractions assistées', 'machine', 'compound', ['back', 'biceps'])),
  pulldown: onCable(
    ex('Tirage vertical', 'machine', 'compound', ['back', 'biceps'], ['Tirage vertical poulie', 'Lat pulldown']),
  ),
  closepulldown: onCable(ex('Tirage vertical prise serrée', 'machine', 'compound', ['back', 'biceps'])),
  row: ex('Rowing barre', 'barbell', 'compound', ['back', 'biceps']),
  pendlay: ex('Rowing Pendlay', 'barbell', 'compound', ['back', 'biceps']),
  dbrow: ex('Rowing haltère', 'dumbbell', 'compound', ['back', 'biceps']),
  seatedrow: onCable(ex('Rowing assis poulie', 'machine', 'compound', ['back', 'biceps'])),
  machinerow: withPlates(ex('Rowing machine', 'machine', 'compound', ['back', 'biceps'], ['Low row'])),
  tbar: withPlates(ex('Rowing T-bar', 'machine', 'compound', ['back', 'biceps'])),
  deadlift: ex('Soulevé de terre', 'barbell', 'compound', ['back', 'legs', 'glutes']),
  pullover: onCable(ex('Pull-over poulie', 'machine', 'isolation', ['back'])),
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
  cablelateral: onCable(ex('Élévations latérales poulie', 'machine', 'isolation', ['shoulders'])),
  machinelateral: ex('Élévations latérales machine', 'machine', 'isolation', ['shoulders']),
  frontraise: ex('Élévations frontales', 'dumbbell', 'isolation', ['shoulders']),
  reardelt: ex('Oiseau haltères', 'dumbbell', 'isolation', ['shoulders']),
  reversepec: ex('Reverse pec deck', 'machine', 'isolation', ['shoulders', 'back']),
  facepull: onCable(ex('Face pull', 'machine', 'isolation', ['shoulders', 'back'], ['Face pulls'])),
  uprightrow: ex('Rowing menton', 'barbell', 'compound', ['shoulders', 'back']),

  // Biceps
  curl: ex('Curl haltères', 'dumbbell', 'isolation', ['biceps']),
  barcurl: ex('Curl barre', 'barbell', 'isolation', ['biceps']),
  ezcurl: ex('Curl barre EZ', 'barbell', 'isolation', ['biceps']),
  hammer: ex('Curl marteau', 'dumbbell', 'isolation', ['biceps']),
  inclinecurl: ex('Curl incliné haltères', 'dumbbell', 'isolation', ['biceps']),
  preacher: ex('Curl pupitre', 'machine', 'isolation', ['biceps'], ['Larry Scott']),
  cablecurl: onCable(ex('Curl poulie', 'machine', 'isolation', ['biceps'])),

  // Triceps
  pushdown: onCable(ex('Extension triceps poulie', 'machine', 'isolation', ['triceps'], ['Pushdown'])),
  overhead: onCable(ex('Extension triceps nuque poulie', 'machine', 'isolation', ['triceps'])),
  dbext: ex('Extension triceps haltère', 'dumbbell', 'isolation', ['triceps']),
  skull: ex('Barre au front', 'barbell', 'isolation', ['triceps'], ['Skull crusher']),
  closegrip: ex('Développé couché prise serrée', 'barbell', 'compound', ['triceps', 'chest']),
  dipsmachine: ex('Dips machine', 'machine', 'compound', ['triceps', 'chest']),
  kickback: ex('Kickback triceps', 'dumbbell', 'isolation', ['triceps']),

  // Jambes
  squat: ex('Squat', 'barbell', 'compound', ['legs', 'glutes'], ['Squat barre']),
  frontsquat: ex('Squat avant', 'barbell', 'compound', ['legs', 'glutes'], ['Front squat']),
  smithsquat: onSmith(ex('Squat Smith', 'machine', 'compound', ['legs', 'glutes'])),
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
  glutekick: onCable(ex('Kickback fessier poulie', 'machine', 'isolation', ['glutes'])),

  // Mollets
  calves: ex('Mollets debout', 'machine', 'isolation', ['calves'], ['Mollets debout machine']),
  seatedcalves: ex('Mollets assis', 'machine', 'isolation', ['calves']),
  presscalves: ex('Mollets à la presse', 'machine', 'isolation', ['calves']),

  // Abdos
  cablecrunch: onCable(ex('Crunch poulie', 'machine', 'isolation', ['core'])),
  crunch: ex('Crunch', 'bodyweight', 'isolation', ['core']),
  legraise: ex('Relevés de jambes', 'bodyweight', 'isolation', ['core']),
  abwheel: ex('Roue abdominale', 'bodyweight', 'isolation', ['core']),
  plank: held(ex('Gainage', 'bodyweight', 'isolation', ['core'], ['Planche'])),
  sideplank: held(ex('Gainage latéral', 'bodyweight', 'isolation', ['core'], ['Planche latérale'])),
  wallsit: held(ex('Chaise', 'bodyweight', 'isolation', ['legs'], ['Chaise contre le mur'])),
  deadhang: held(ex('Suspension barre', 'bodyweight', 'isolation', ['back'])),
} satisfies Record<string, ExerciseDef>;

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
  const exercisesOf = (name: string) =>
    customDays?.[dayKey(split, name)]?.map((n) => findExerciseDef(n, own)).filter((e): e is ExerciseDef => !!e);
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

/** A day the user can pick: from their program, or from another one for a one-off session. */
export interface ChoosableDay extends ProgramDay {
  split: SplitId;
  /** Not in the user's program: done once, it does not move the program along. */
  extra: boolean;
}

/**
 * The user's program days, then the days of the other programs (Haut, Bas,
 * Full body…) for the day the plan does not fit. Each keeps the exercises the
 * user chose for it, saved under its own program ("ul/Haut").
 */
export function choosableDays(
  split: SplitId,
  customDays: Record<string, string[]> | undefined,
  own: CustomExercise[] | undefined,
  ownDays?: Record<string, string[]>,
): ChoosableDay[] {
  const out: ChoosableDay[] = programDays(split, customDays, own, ownDays).map((d) => ({ ...d, split, extra: false }));
  for (const other of SPLITS) {
    if (other.id === split) continue;
    for (const day of programDays(other.id, customDays, own, ownDays)) {
      if (!out.some((d) => d.name === day.name)) out.push({ ...day, split: other.id, extra: true });
    }
  }
  return out;
}

/** The program a day belongs to, the user's own first. */
export function splitOfDay(name: string, current: SplitId): SplitId | undefined {
  if (getSplit(current).days.some((d) => d.name === name)) return current;
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

/**
 * Exercises whose name (or old name) contains every typed word. In English,
 * the English name counts too: the French one stays findable.
 */
export function searchExercises(query: string, own: CustomExercise[] = []): ExerciseDef[] {
  const words = searchKey(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return allExercises(own).filter((e) => {
    const names = [exerciseName(e.name), e.name, ...(e.aliases ?? [])].map(searchKey).join(' ');
    return words.every((w) => names.includes(w));
  });
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
  const others = shown === def.name ? (def.aliases ?? []) : [def.name, ...(def.aliases ?? [])];
  return others.find((a) => hasWords(a, words));
}

/** Other exercises for the same main muscle, to swap when the machine is taken. */
export function alternativesFor(def: ExerciseDef, own: CustomExercise[] = []): ExerciseDef[] {
  const main = def.muscleGroups[0];
  return allExercises(own).filter((e) => e.name !== def.name && e.muscleGroups[0] === main);
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
  // The name shown in the current language counts too: "Bench press" is taken in English
  const existing =
    findExerciseDef(name, own) ?? allExercises(own).find((e) => exerciseName(e.name).toLowerCase() === lower);
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
 */
export function defaultIncrementFor(
  def: Pick<ExerciseDef, 'equipment' | 'category' | 'gear'>,
  units: 'kg' | 'lbs',
  plateLoaded = false,
): number {
  if (units === 'lbs') return 5;
  if (def.equipment === 'dumbbell') return 2;
  if (def.equipment === 'machine' && !plateLoaded && def.gear !== 'cable' && def.category === 'compound') return 5;
  return 2.5;
}

/**
 * An easier exercise for the same movement, for a beginner who cannot reach
 * the bottom of the range yet: pull-ups → assisted pull-ups, dips → push-ups.
 */
export function easierVariant(def: Pick<ExerciseDef, 'name'>): ExerciseDef | undefined {
  const E = EXERCISES;
  const easier: Record<string, ExerciseDef> = {
    [E.pullup.name]: E.assisted,
    [E.chinup.name]: E.assisted,
    [E.dips.name]: E.pushup,
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
