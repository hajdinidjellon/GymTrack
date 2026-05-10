// ============================================================
// TYPES PRINCIPAUX — GymTrack Mobile
// Portés depuis ../Gym-Tracker/src/types/index.ts (schéma fixe)
// ============================================================

export type SetType =
  | 'warmup'
  | 'normal'
  | 'top'
  | 'backoff'
  | 'amrap'
  | 'drop'
  | 'failure';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'glutes'
  | 'calves';

export type WorkoutType =
  | 'strength'
  | 'hypertrophy'
  | 'power'
  | 'endurance'
  | 'cardio'
  | 'mobility';

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
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  sets: WorkoutSet[];
  notes?: string;
  tempo?: string;
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

export interface TrainingGoal {
  id: string;
  type: 'pr' | 'bodyweight' | 'volume' | 'consistency';
  exercise?: string;
  currentValue: number;
  targetValue: number;
  deadline?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  progress: number;
}

export interface UserProfile {
  name: string;
  birthDate?: string;
  height: number;
  gender: 'male' | 'female' | 'other';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  prs: PersonalRecord[];
  bodyStats: BodyStats[];
  trainingFrequency: number;
  goals: TrainingGoal[];
}

export interface AppSettings {
  units: 'kg' | 'lbs';
  defaultRestTime: 60 | 90 | 120 | 180;
  restTimerEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
  notifications: boolean;
  language: 'fr' | 'en';
}

// ============================================================
// PLANIFICATION
// ============================================================

export interface PlannedExercise {
  name: string;
  category: ExerciseCategory;
  targetSets: number;
  targetReps: number | [number, number];
  targetWeight?: number;
  targetIntensity?: number;
  targetRPE?: number;
  restTime: number;
  notes?: string;
}

export interface SessionPlan {
  dayNumber: number;
  focus: MuscleGroup[];
  exercises: PlannedExercise[];
  estimatedDuration: number;
}

export interface WeekPlan {
  weekNumber: number;
  intensity: number;
  volume: number;
  sessions: SessionPlan[];
  deloadWeek?: boolean;
}

export interface TrainingPlan {
  id: string;
  name: string;
  goal: TrainingGoal;
  duration: number;
  frequency: number;
  weeks: WeekPlan[];
  createdAt: string;
  algorithm:
    | 'linear'
    | '5_3_1'
    | 'conjugate'
    | 'undulating'
    | 'block_periodization';
}

// ============================================================
// SUGGESTION DE SÉANCE (mobile-only)
// ============================================================

export interface SuggestedSession {
  title: string;
  focus: MuscleGroup[];
  exercises: PlannedExercise[];
  estimatedDuration: number;
  reason: string;
}

// ============================================================
// ANALYTICS
// ============================================================

export interface ProgressionDataPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
  estimated1RM: number;
}

export interface ProgressionData {
  exercise: string;
  dataPoints: ProgressionDataPoint[];
}

export interface MuscleGroupVolume {
  muscleGroup: MuscleGroup;
  totalSets: number;
  totalVolume: number;
}

// ============================================================
// SESSION EN COURS (état local uniquement)
// ============================================================

export interface ActiveExercise extends Exercise {
  isExpanded: boolean;
}

export interface ActiveSession {
  workoutId: string;
  startedAt: string;
  exercises: ActiveExercise[];
  elapsedSeconds: number;
  restSecondsLeft: number | null;
  isResting: boolean;
  lastCompletedSetIndex: number | null;
}

// ============================================================
// GAMIFICATION
// ============================================================

export type RankTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'legend';

export type BadgeCategory =
  | 'consistency'
  | 'strength'
  | 'volume'
  | 'diversity'
  | 'milestone'
  | 'special';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Rank {
  tier: RankTier;
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  color: string;
  icon: string;
  description: string;
}

export interface GamificationData {
  workouts: Workout[];
  profile: UserProfile | null;
  totalXP: number;
  streak: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  xpReward: number;
  rarity: BadgeRarity;
  condition: (data: GamificationData) => boolean;
  progress?: (data: GamificationData) => number;
}

export interface UnlockedBadge extends Omit<Badge, 'condition' | 'progress'> {
  unlockedAt: string;
  currentProgress: number;
}
