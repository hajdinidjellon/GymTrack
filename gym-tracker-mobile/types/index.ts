// ============================================================
// TYPES PRINCIPAUX — GymTrack Mobile
// ============================================================

export type SetType = 'warmup' | 'normal' | 'top' | 'backoff' | 'amrap' | 'drop' | 'failure';

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'glutes' | 'calves';

export type WorkoutType =
  'strength' | 'hypertrophy' | 'power' | 'endurance' | 'cardio' | 'mobility' | 'ppl' | 'fullbody';

export type ExerciseCategory = 'compound' | 'isolation' | 'accessory';

// ============================================================
// MODÈLES CORE
// ============================================================

export interface WorkoutSet {
  reps: number;
  weight: number;
  setType: SetType;
  rpe?: number;
  notes?: string;
  completed?: boolean;
  restTime?: number;
  /** Seconds really rested before this set, measured from the validations. */
  restTaken?: number;
  /** When the set was validated (epoch ms). Running session only, not saved in the history. */
  doneAt?: number;
  /** What the progression engine asked for when this set was logged. */
  target?: SetTarget;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  sets: WorkoutSet[];
  notes?: string;
  tempo?: string;
  /** Rule in effect for this session; the next session reuses it. */
  rule?: ProgressionRule;
  /** First session with no history: the starting weight was picked by hand. */
  calibration?: boolean;
}

// ============================================================
// PROGRESSION (pilote automatique)
// ============================================================

/** Double progression: e.g. 3 sets of 8-12, add weight once every set hits 12. */
export interface ProgressionRule {
  kind: 'double';
  sets: number;
  repMin: number;
  repMax: number;
  /** Weight step in the user's unit (2.5 kg, 5 lbs, 1-2 for dumbbells...). */
  increment: number;
}

export interface SetTarget {
  weight: number;
  reps: number;
}

export interface Workout {
  id: string;
  date: string;
  name: string;
  type: WorkoutType;
  exercises: Exercise[];
  duration?: number;
  notes?: string;
  feeling: 1 | 2 | 3 | 4 | 5;
  completed: boolean;
}

export interface PersonalRecord {
  exercise: string;
  weight: number;
  reps: number;
  oneRepMax: number;
  date: string;
  videoUrl?: string;
}

export interface BodyStats {
  date: string;
  weight: number;
  bodyFat?: number;
  measurements?: {
    chest?: number;
    arms?: number;
    waist?: number;
    thighs?: number;
    calves?: number;
  };
}

export type Goal = 'muscle' | 'force' | 'forme';
export type SplitId = 'ppl' | 'ul' | 'fb';
/** How long the user has been lifting: sets the first weights to try. */
export type Experience = 'new' | 'months' | 'years';

export interface Program {
  split: SplitId;
  perWeek: number;
}

export interface UserProfile {
  name?: string;
  goal: Goal;
  program: Program;
  experience?: Experience;
  prs: PersonalRecord[];
  bodyStats: BodyStats[];
}

/** An exercise the user created, next to the catalog. */
export interface CustomExercise {
  name: string;
  equipment: Equipment;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
}

export interface RuleOverride {
  sets: number;
  repMin: number;
  repMax: number;
}

export interface AppSettings {
  units: 'kg' | 'lbs';
  defaultRestTime: number;
  restTimerEnabled: boolean;
  notifications: boolean;
  /** Spoken cues during the session (next set, plates to load). */
  voice: boolean;
  barWeight: number;
  /** Plates the user's gym has, heaviest first. */
  plates: number[];
  /** Per-exercise weight step chosen by the user, keyed by exercise name. */
  increments: Record<string, number>;
  /** The user's own exercise list per program day, keyed "ppl/Legs". Missing: the program's. */
  customDays: Record<string, string[]>;
  /** Sets and rep range chosen by the user, per exercise name. Missing: the goal's rule. */
  ruleOverrides: Record<string, RuleOverride>;
  /** Rest between sets chosen by the user, in seconds, per exercise name. Missing: computed. */
  restOverrides: Record<string, number>;
  /** Exercises the user created. */
  customExercises: CustomExercise[];
  /** Logged out: the app opens on the welcome screen, local data is kept. */
  signedOut: boolean;
}

// ============================================================
// SESSION EN COURS (état local uniquement)
// ============================================================

/** How the exercise is loaded: decides plates, increments and calibration. */
export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'bodyweight';

export interface ActiveExercise extends Exercise {
  equipment: Equipment;
  /** First time on this exercise: the user picks the weight before the first set. */
  needsWeight: boolean;
  /** "60 kg × 10 · 10 · 9": the last session, shown while logging. */
  lastTime?: string;
  /** Why today's target is what it is. */
  reason?: string;
  /** Why the rest lasts what it lasts, when it is not the default. */
  restNote?: string;
}

export interface ActiveSession {
  workoutId: string;
  name: string;
  startedAt: string;
  exercises: ActiveExercise[];
  /** Absolute timestamps so the timers survive re-renders and app restarts. */
  restEndsAt: number | null;
  restDuration: number | null;
  lastCompleted: { exerciseId: string; setIndex: number } | null;
}
