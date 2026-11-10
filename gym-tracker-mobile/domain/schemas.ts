/**
 * SCHÉMAS — tout ce qui vient du disque ou du cloud est vérifié ici avant
 * d'entrer dans l'app. Les types restent dans types/index.ts : chaque schéma
 * est annoté avec son type, tsc refuse donc qu'ils divergent.
 */

import { z } from 'zod';
import { fitWorkout, WORKOUT_LIMITS } from '@/domain/limits';
import { NOTE_MAX_LENGTH } from '@/domain/notes';
import type {
  AppSettings,
  CustomExercise,
  Exercise,
  PersonalRecord,
  ProgressionRule,
  UserProfile,
  Workout,
  WorkoutSet,
} from '@/types';

const weight = z.number().finite().min(0).max(WORKOUT_LIMITS.amount);
const reps = z.number().int().min(0).max(WORKOUT_LIMITS.amount);
const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'invalid date');

const setTarget = z.object({ weight, reps });

const ruleSchema: z.ZodType<ProgressionRule> = z.object({
  kind: z.literal('double'),
  sets: z.number().int().min(1).max(20),
  repMin: reps,
  repMax: reps,
  increment: z.number().positive().max(50),
  repStep: z.number().int().min(1).max(60).optional(),
});

const setSchema: z.ZodType<WorkoutSet> = z.object({
  reps,
  weight,
  setType: z.enum(['warmup', 'normal', 'top', 'backoff', 'amrap', 'drop', 'failure']),
  rpe: z.number().min(0).max(10).optional(),
  notes: z.string().max(500).optional(),
  completed: z.boolean().optional(),
  restTime: z.number().int().min(0).max(3600).optional(),
  restTaken: z.number().int().min(0).max(3600).optional(),
  doneAt: z.number().int().min(0).optional(),
  target: setTarget.optional(),
});

const muscleGroup = z.enum([
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'arms',
  'legs',
  'core',
  'glutes',
  'calves',
]);
const category = z.enum(['compound', 'isolation', 'accessory']);

const customExerciseSchema: z.ZodType<CustomExercise> = z.object({
  name: z.string().trim().min(1).max(100),
  equipment: z.enum(['barbell', 'dumbbell', 'machine', 'bodyweight']),
  category,
  muscleGroups: z.array(muscleGroup).min(1).max(10),
  timed: z.boolean().optional(),
  aliases: z.array(z.string().max(100)).max(20).optional(),
});

const exerciseSchema: z.ZodType<Exercise> = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(100),
  category,
  muscleGroups: z.array(muscleGroup).max(10),
  sets: z.array(setSchema).max(WORKOUT_LIMITS.sets),
  notes: z.string().max(500).optional(),
  tempo: z.string().max(20).optional(),
  rule: ruleSchema.optional(),
  calibration: z.boolean().optional(),
  timed: z.boolean().optional(),
});

export const workoutSchema: z.ZodType<Workout> = z.object({
  id: z.string().min(1).max(200),
  date: isoDate,
  name: z.string().max(100),
  type: z.enum(['strength', 'hypertrophy', 'power', 'endurance', 'cardio', 'mobility', 'ppl', 'fullbody']),
  exercises: z.array(exerciseSchema).max(WORKOUT_LIMITS.exercises),
  duration: z.number().min(0).max(WORKOUT_LIMITS.minutes).optional(),
  notes: z.string().max(2000).optional(),
  feeling: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  completed: z.boolean(),
});

/** A session read back from disk, the cloud or a file: brought within the bounds first. */
export const storedWorkoutSchema: z.ZodType<Workout> = z.preprocess(fitWorkout, workoutSchema);

const prSchema: z.ZodType<PersonalRecord> = z.object({
  exercise: z.string().min(1).max(100),
  weight,
  reps,
  oneRepMax: weight,
  date: isoDate,
  videoUrl: z.string().url().optional(),
});

export const profileSchema: z.ZodType<UserProfile> = z.object({
  name: z.string().max(100).optional(),
  goal: z.enum(['muscle', 'force', 'forme']),
  program: z.object({
    split: z.enum(['ppl', 'ul', 'fb', 'glutes']),
    perWeek: z.number().int().min(1).max(7),
    schedule: z.array(z.string().max(60).nullable()).length(7).optional(),
  }),
  experience: z.enum(['new', 'months', 'years']).optional(),
  sex: z.enum(['male', 'female']).optional(),
  ageGroup: z.enum(['16', '25', '35', '45', '55']).optional(),
  sessionMinutes: z.number().int().min(15).max(240).optional(),
  prs: z.array(prSchema).max(500),
  bodyStats: z
    .array(
      z.object({
        date: isoDate,
        weight: z.number().positive().max(500),
        bodyFat: z.number().min(0).max(100).optional(),
        measurements: z
          .object({ chest: weight, arms: weight, waist: weight, thighs: weight, calves: weight })
          .partial()
          .optional(),
      }),
    )
    .max(5000),
});

/** How much the settings keep. The stores stop adding there, a longer list read from disk is cut. */
export const SETTINGS_LIMITS = { dayExercises: 30, ownDays: 14, customExercises: 200, plates: 20 } as const;

/** A list: the valid items are kept, up to `max`. One broken item never costs the whole list. */
function keptList<T>(item: z.ZodType<T>, max: number) {
  return z.array(z.unknown()).transform((items) => parseList(item, items).valid.slice(0, max));
}

/** A map by name: the valid entries are kept, a broken one is dropped. */
function keptRecord<T>(value: z.ZodType<T>, keyMax = 100) {
  return z.record(z.string(), z.unknown()).transform((entries) => {
    const kept: Record<string, T> = {};
    for (const [key, item] of Object.entries(entries)) {
      const result = value.safeParse(item);
      if (key.length <= keyMax && result.success) kept[key] = result.data;
    }
    return kept;
  });
}

const settingsFields = {
  units: z.enum(['kg', 'lbs']),
  defaultRestTime: z.number().int().min(0).max(3600),
  restTimerEnabled: z.boolean(),
  notifications: z.boolean(),
  voice: z.boolean(),
  voiceCommands: z.boolean(),
  restBell: z.boolean(),
  programSwitchDismissed: z.string().max(40).nullable(),
  barWeight: z.number().min(0).max(50),
  collarWeight: z.number().min(0).max(5),
  plates: keptList(z.number().positive().max(50), SETTINGS_LIMITS.plates),
  increments: keptRecord(z.number().positive().max(50)),
  customDays: keptRecord(keptList(z.string().max(100), SETTINGS_LIMITS.dayExercises)),
  ruleOverrides: keptRecord(
    z.object({
      sets: z.number().int().min(1).max(10),
      // Up to 600: on a timed exercise these are seconds
      repMin: z.number().int().min(1).max(600),
      repMax: z.number().int().min(1).max(600),
    }),
  ),
  restOverrides: keptRecord(z.number().int().min(15).max(600)),
  customExercises: keptList(customExerciseSchema, SETTINGS_LIMITS.customExercises),
  exerciseNotes: keptRecord(z.string().min(1).max(NOTE_MAX_LENGTH)),
  plateLoaded: keptRecord(z.boolean()),
  countBothSides: z.boolean(),
  signedOut: z.boolean(),
  language: z.enum(['auto', 'fr', 'en']),
  theme: z.enum(['auto', 'light', 'dark']),
  manualProgression: keptRecord(z.boolean()),
  preciseRpe: z.boolean(),
  warmups: z.boolean(),
  warmupOverrides: keptRecord(z.boolean()),
  supersets: keptRecord(keptList(z.string().max(100), SETTINGS_LIMITS.dayExercises)),
  ownDays: keptRecord(keptList(z.string().max(100), SETTINGS_LIMITS.ownDays), 10),
  recoveryPromptSeen: z.boolean(),
  stackStep: z.number().positive().max(20).nullable(),
  cableStep: z.number().positive().max(20).nullable(),
  gymChain: z.string().max(40).nullable(),
};

/** Settings are merged over the defaults: every field is optional here. */
export const settingsPatchSchema: z.ZodType<Partial<AppSettings>> = z.object(settingsFields).partial();

/**
 * Settings read from disk, the cloud or a backup, field by field: a field that does not
 * pass is left out (its default stays), the others are kept. Never all or nothing.
 */
export function parseSettingsPatch(json: unknown): Partial<AppSettings> {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return {};
  const kept: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(json)) {
    const field = Object.prototype.hasOwnProperty.call(settingsFields, key)
      ? settingsFields[key as keyof typeof settingsFields]
      : null;
    const result = field && value !== undefined ? field.safeParse(value) : null;
    if (result?.success) kept[key] = result.data;
  }
  return kept as Partial<AppSettings>;
}

/** When the settings last changed on this phone, and whether that change still has to reach the queue. */
export const settingsSyncMetaSchema = z.object({
  updatedAt: isoDate.nullable(),
  pending: z.boolean(),
});

/** What the account recovery Edge Functions answer (supabase/functions/). */
export const recoveryAnswerSchema = z.object({
  ok: z.boolean(),
  code: z.string().max(40).optional(),
  reason: z.enum(['limit', 'password']).optional(),
});

/** Valid items only. A broken record is skipped, not allowed to crash the app. */
export function parseList<T>(schema: z.ZodType<T>, items: unknown[]): { valid: T[]; rejected: number } {
  const valid: T[] = [];
  for (const item of items) {
    const result = schema.safeParse(item);
    if (result.success) valid.push(result.data);
  }
  return { valid, rejected: items.length - valid.length };
}
