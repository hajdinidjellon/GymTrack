// ============================================================
// TYPES PRINCIPAUX — Okilo Mobile
// ============================================================

export type SetType = 'warmup' | 'normal' | 'top' | 'backoff' | 'amrap' | 'drop' | 'failure';

export type MuscleGroup =
  'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'arms' | 'legs' | 'core' | 'glutes' | 'calves';

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
  /** Held for a time (plank…): `reps` counts seconds. */
  timed?: boolean;
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
  /** Reps added per progress step: 1, or 5 seconds on a timed exercise. */
  repStep?: number;
}

export interface SetTarget {
  weight: number;
  reps: number;
  /** A top set kept as it was done last time (heavier, fewer reps): it never steers the progression. */
  top?: boolean;
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
  /** The session of each day from Monday, null for rest. Without it, the program days follow each other. */
  schedule?: (string | null)[];
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
  /** Held for a time: counted in seconds, not reps. */
  timed?: boolean;
  /** Its old names, after a rename: the saved sessions still match it. */
  aliases?: string[];
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
  /** Short spoken commands during the session ("fait", "8", "plus tard"). Off by default: it opens the microphone. */
  voiceCommands: boolean;
  /** A bell when the rest is over, even with the phone on silent. */
  restBell: boolean;
  barWeight: number;
  /** Weight of each collar, counted twice on the bar (0: no collars). */
  collarWeight: number;
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
  /** The user's own note per exercise name: machine setting, grip… */
  exerciseNotes: Record<string, string>;
  /** Machine loaded with plates (true) or a weight stack (false), per exercise name. Missing: the catalog's. */
  plateLoaded: Record<string, boolean>;
  /** Totals count both sides of a plate-loaded machine and both dumbbells. Off: the weight as logged. */
  countBothSides: boolean;
  /** Logged out: the app opens on the welcome screen, local data is kept. */
  signedOut: boolean;
  /** Date of the newest session when the user kept their program: "switch program?" waits for newer ones. */
  programSwitchDismissed: string | null;
  /** Language of the texts and the voice. `auto` follows the phone. */
  language: 'auto' | 'fr' | 'en';
  /** Light or dark mode. `auto` follows the phone. */
  theme: 'auto' | 'light' | 'dark';
  /** After a set, the RPE from 6 to 10 by half points instead of the three efforts. Off by default. */
  preciseRpe: boolean;
  /** Manual progression per exercise name: the targets repeat the last session, the app never changes the weight. */
  manualProgression: Record<string, boolean>;
  /** Warm-up sets computed before the working sets. */
  warmups: boolean;
  /** Warm-ups on or off for one exercise, over the global choice. */
  warmupOverrides: Record<string, boolean>;
  /** Days the user added to a program, per program ("ppl": ["Épaules"]). Their exercises are in `customDays`. */
  ownDays: Record<string, string[]>;
  /** Per program day ("ppl/Push"): the exercises chained with the one after them, as a superset. */
  supersets: Record<string, string[]>;
  /** The one-time suggestion to add a recovery email was answered (added or declined). */
  recoveryPromptSeen: boolean;
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
  /** Plate-loaded machine: the weight is what goes on each side. */
  plateLoaded?: boolean;
  /** Assisted machine: the weight is help, less of it is harder. */
  assisted?: boolean;
  /** "60 kg × 10 · 10 · 9": the last session, shown while logging. */
  lastTime?: string;
  /** Why today's target is what it is. */
  reason?: string;
  /** Why the rest lasts what it lasts, when it is not the default. */
  restNote?: string;
  /** The user skipped or removed warm-ups: they are not computed again this session. */
  keepWarmups?: boolean;
  /** Superset: the exercises with the same group take turns, no rest in between. */
  superset?: string;
}

export interface ActiveSession {
  workoutId: string;
  name: string;
  startedAt: string;
  exercises: ActiveExercise[];
  /** Absolute timestamps so the timers survive re-renders and app restarts. */
  restEndsAt: number | null;
  restDuration: number | null;
  /** The last validation, to undo it. `batch`: every set "Tout comme prévu" validated at once. */
  lastCompleted: { exerciseId: string; setIndex: number; batch?: number[] } | null;
}
