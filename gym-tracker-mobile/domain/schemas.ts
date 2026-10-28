/**
 * SCHÉMAS — tout ce qui vient du disque ou du cloud est vérifié ici avant
 * d'entrer dans l'app. Les types restent dans types/index.ts : chaque schéma
 * est annoté avec son type, tsc refuse donc qu'ils divergent.
 */

import { z } from 'zod';
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

const weight = z.number().finite().min(0).max(1000);
const reps = z.number().int().min(0).max(1000);
const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'invalid date');

const setTarget = z.object({ weight, reps });

const ruleSchema: z.ZodType<ProgressionRule> = z.object({
  kind: z.literal('double'),
  sets: z.number().int().min(1).max(20),
  repMin: reps,
  repMax: reps,
  increment: z.number().positive().max(50),
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
});

const exerciseSchema: z.ZodType<Exercise> = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(100),
  category,
  muscleGroups: z.array(muscleGroup).max(10),
  sets: z.array(setSchema).max(50),
  notes: z.string().max(500).optional(),
  tempo: z.string().max(20).optional(),
  rule: ruleSchema.optional(),
  calibration: z.boolean().optional(),
});

export const workoutSchema: z.ZodType<Workout> = z.object({
  id: z.string().min(1).max(200),
  date: isoDate,
  name: z.string().max(100),
  type: z.enum(['strength', 'hypertrophy', 'power', 'endurance', 'cardio', 'mobility', 'ppl', 'fullbody']),
  exercises: z.array(exerciseSchema).max(50),
  duration: z
    .number()
    .min(0)
    .max(24 * 60)
    .optional(),
  notes: z.string().max(2000).optional(),
  feeling: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  completed: z.boolean(),
});

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
    split: z.enum(['ppl', 'ul', 'fb']),
    perWeek: z.number().int().min(1).max(7),
  }),
  experience: z.enum(['new', 'months', 'years']).optional(),
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

/** Settings are merged over the defaults: every field is optional here. */
export const settingsPatchSchema: z.ZodType<Partial<AppSettings>> = z
  .object({
    units: z.enum(['kg', 'lbs']),
    defaultRestTime: z.number().int().min(0).max(3600),
    restTimerEnabled: z.boolean(),
    notifications: z.boolean(),
    voice: z.boolean(),
    barWeight: z.number().min(0).max(50),
    plates: z.array(z.number().positive().max(50)).max(20),
    increments: z.record(z.string().max(100), z.number().positive().max(50)),
    customDays: z.record(z.string().max(100), z.array(z.string().max(100)).max(30)),
    ruleOverrides: z.record(
      z.string().max(100),
      z.object({
        sets: z.number().int().min(1).max(10),
        repMin: z.number().int().min(1).max(50),
        repMax: z.number().int().min(1).max(50),
      }),
    ),
    restOverrides: z.record(z.string().max(100), z.number().int().min(15).max(600)),
    customExercises: z.array(customExerciseSchema).max(200),
    signedOut: z.boolean(),
  })
  .partial();

/** Valid items only. A broken record is skipped, not allowed to crash the app. */
export function parseList<T>(schema: z.ZodType<T>, items: unknown[]): { valid: T[]; rejected: number } {
  const valid: T[] = [];
  for (const item of items) {
    const result = schema.safeParse(item);
    if (result.success) valid.push(result.data);
  }
  return { valid, rejected: items.length - valid.length };
}
