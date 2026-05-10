/**
 * MOTEUR IA DE PLANIFICATION — porté depuis ../Gym-Tracker/src/utils/aiPlanner.ts
 * + Ajout mobile : getSuggestedSession (récupération musculaire 48h)
 */

import type {
  TrainingPlan,
  WeekPlan,
  SessionPlan,
  PlannedExercise,
  MuscleGroup,
  WorkoutSet,
  Workout,
  UserProfile,
  SuggestedSession,
  TrainingGoal,
  ExerciseCategory,
} from '@/types';

import { getRecoveredMuscles } from '@/lib/gamification';

// ============================================================
// CALCULS DE BASE
// ============================================================

export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function calculateWeight(oneRM: number, percentage: number): number {
  return Math.round((oneRM * (percentage / 100)) / 2.5) * 2.5;
}

export function getRecommendedReps(intensity: number): number {
  if (intensity >= 95) return 1;
  if (intensity >= 90) return 2;
  if (intensity >= 85) return 3;
  if (intensity >= 80) return 5;
  if (intensity >= 75) return 6;
  if (intensity >= 70) return 8;
  if (intensity >= 65) return 10;
  return 12;
}

export function generateWarmupSets(workingWeight: number): WorkoutSet[] {
  const warmups: WorkoutSet[] = [];

  warmups.push({
    reps: 10,
    weight: Math.max(20, workingWeight * 0.4),
    setType: 'warmup',
    restTime: 60,
  });

  if (workingWeight > 60) {
    warmups.push({
      reps: 5,
      weight: Math.round((workingWeight * 0.6) / 2.5) * 2.5,
      setType: 'warmup',
      restTime: 90,
    });
  }

  if (workingWeight > 80) {
    warmups.push({
      reps: 3,
      weight: Math.round((workingWeight * 0.75) / 2.5) * 2.5,
      setType: 'warmup',
      restTime: 120,
    });
  }

  if (workingWeight > 100) {
    warmups.push({
      reps: 1,
      weight: Math.round((workingWeight * 0.9) / 2.5) * 2.5,
      setType: 'warmup',
      restTime: 180,
    });
  }

  return warmups;
}

// ============================================================
// SUGGESTION DE SÉANCE (mobile-only)
// Priorité : plan actif → récupération musculaire → Full Body
// ============================================================

const EXERCISE_DB: Record<MuscleGroup, Array<{ name: string; category: ExerciseCategory }>> = {
  chest: [
    { name: 'Développé couché', category: 'compound' },
    { name: 'Développé incliné haltères', category: 'compound' },
    { name: 'Écarté haltères', category: 'isolation' },
    { name: 'Dips', category: 'compound' },
  ],
  back: [
    { name: 'Tractions', category: 'compound' },
    { name: 'Rowing barre', category: 'compound' },
    { name: 'Tirage vertical', category: 'compound' },
    { name: 'Rowing haltère', category: 'isolation' },
  ],
  shoulders: [
    { name: 'Développé militaire', category: 'compound' },
    { name: 'Élévations latérales', category: 'isolation' },
    { name: 'Face pulls', category: 'accessory' },
    { name: 'Développé Arnold', category: 'compound' },
  ],
  arms: [
    { name: 'Curl haltères', category: 'isolation' },
    { name: 'Curl barre', category: 'isolation' },
    { name: 'Extensions triceps poulie', category: 'isolation' },
    { name: 'Curl marteau', category: 'isolation' },
  ],
  legs: [
    { name: 'Squat', category: 'compound' },
    { name: 'Leg press', category: 'compound' },
    { name: 'Fentes marchées', category: 'compound' },
    { name: 'Leg curl', category: 'isolation' },
  ],
  core: [
    { name: 'Planche', category: 'accessory' },
    { name: 'Crunchs', category: 'isolation' },
    { name: 'Relevés de jambes', category: 'isolation' },
    { name: 'Russian twist', category: 'isolation' },
  ],
  glutes: [
    { name: 'Hip thrust', category: 'compound' },
    { name: 'Fentes bulgares', category: 'compound' },
    { name: 'Abductions câble', category: 'isolation' },
  ],
  calves: [
    { name: 'Mollets debout', category: 'isolation' },
    { name: 'Mollets assis', category: 'isolation' },
  ],
};

const PPL_SPLITS: Array<{ name: string; muscles: MuscleGroup[] }> = [
  { name: 'Push (Pousser)', muscles: ['chest', 'shoulders', 'arms'] },
  { name: 'Pull (Tirer)', muscles: ['back', 'arms'] },
  { name: 'Legs (Jambes)', muscles: ['legs', 'glutes', 'calves'] },
];

export function getSuggestedSession(
  profile: UserProfile,
  workouts: Workout[],
  activePlan: TrainingPlan | null,
): SuggestedSession {
  // 1. Si plan actif, retourner la prochaine session du plan
  if (activePlan) {
    const nextSession = getNextPlanSession(activePlan, workouts);
    if (nextSession) {
      return {
        title: `${activePlan.name} — Séance ${nextSession.dayNumber}`,
        focus: nextSession.focus,
        exercises: nextSession.exercises,
        estimatedDuration: nextSession.estimatedDuration,
        reason: 'Prochaine séance de ton programme actif',
      };
    }
  }

  // 2. Calcule les muscles récupérés (> 48h)
  const recovered = getRecoveredMuscles(workouts);

  // 3. Choisit le split PPL le plus adapté aux muscles récupérés
  const bestSplit = PPL_SPLITS.reduce(
    (best, split) => {
      const score = split.muscles.filter((m) => recovered.includes(m)).length;
      return score > best.score ? { split, score } : best;
    },
    { split: PPL_SPLITS[0]!, score: -1 },
  );

  const focusMuscles = bestSplit.split.muscles.filter((m) =>
    recovered.includes(m),
  );
  const finalFocus = focusMuscles.length > 0 ? focusMuscles : bestSplit.split.muscles;

  // 4. Construit la liste d'exercices pour les muscles focus
  const exercises: PlannedExercise[] = [];
  for (const muscle of finalFocus.slice(0, 3)) {
    const available = EXERCISE_DB[muscle] ?? [];
    const picked = available.slice(0, muscle === 'arms' ? 2 : 3);
    for (const ex of picked) {
      const pr = profile.prs.find((p) =>
        p.exercise.toLowerCase().includes(ex.name.toLowerCase().split(' ')[0] ?? ''),
      );
      exercises.push({
        name: ex.name,
        category: ex.category,
        targetSets: ex.category === 'compound' ? 4 : 3,
        targetReps: ex.category === 'compound' ? [5, 8] : [10, 15],
        targetWeight: pr ? calculateWeight(pr.oneRepMax, 75) : undefined,
        targetRPE: 8,
        restTime: ex.category === 'compound' ? 180 : 90,
      });
    }
  }

  const estimated = exercises.reduce((total, ex) => {
    const sets = ex.targetSets;
    const avgRest = ex.restTime / 60;
    return total + sets * (1.5 + avgRest);
  }, 0);

  const recoveredCount = finalFocus.length;
  const reason =
    recoveredCount > 0
      ? `${recoveredCount} groupe(s) musculaire(s) récupéré(s) depuis +48h`
      : 'Suggestion basée sur ton historique d\'entraînement';

  return {
    title: bestSplit.split.name,
    focus: finalFocus,
    exercises,
    estimatedDuration: Math.round(estimated),
    reason,
  };
}

function getNextPlanSession(
  plan: TrainingPlan,
  workouts: Workout[],
): SessionPlan | null {
  // Compte les séances déjà effectuées cette semaine
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const sessionsThisWeek = workouts.filter(
    (w) => new Date(w.date) >= weekStart,
  ).length;

  // Retourne la session correspondante dans le plan actuel
  const currentWeek =
    plan.weeks[Math.floor(sessionsThisWeek / plan.frequency)] ??
    plan.weeks[plan.weeks.length - 1];

  if (!currentWeek) return null;

  const dayInWeek = sessionsThisWeek % plan.frequency;
  return currentWeek.sessions[dayInWeek] ?? null;
}

// ============================================================
// GÉNÉRATION DE PLANS
// ============================================================

interface PRPlanOptions {
  exerciseName: string;
  currentMax: number;
  targetMax: number;
  weeks: number;
  frequency: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  trainingGoal?: 'strength' | 'hypertrophy' | 'power';
}

export function generatePRProgression(options: PRPlanOptions): TrainingPlan {
  const { exerciseName, currentMax, targetMax, weeks, frequency, experienceLevel, trainingGoal = 'strength' } = options;

  const algorithm = selectAlgorithm(experienceLevel, trainingGoal);
  let weekPlans: WeekPlan[];

  switch (algorithm) {
    case 'linear':
      weekPlans = generateLinearProgression(currentMax, targetMax, weeks, frequency);
      break;
    case '5_3_1':
      weekPlans = generate531Program(currentMax, weeks);
      break;
    case 'undulating':
      weekPlans = generateDUPProgression(currentMax, targetMax, weeks, frequency);
      break;
    default:
      weekPlans = generateLinearProgression(currentMax, targetMax, weeks, frequency);
  }

  const goal: TrainingGoal = {
    id: `goal-${Date.now()}`,
    type: 'pr',
    exercise: exerciseName,
    currentValue: currentMax,
    targetValue: targetMax,
    deadline: new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    progress: 0,
  };

  return {
    id: `plan-${Date.now()}`,
    name: `${exerciseName} — ${currentMax}kg → ${targetMax}kg`,
    goal,
    duration: weeks,
    frequency,
    weeks: weekPlans,
    createdAt: new Date().toISOString(),
    algorithm,
  };
}

function selectAlgorithm(
  level: string,
  goal: string,
): 'linear' | '5_3_1' | 'undulating' | 'conjugate' | 'block_periodization' {
  if (level === 'beginner') return 'linear';
  if (level === 'intermediate' && goal === 'hypertrophy') return 'undulating';
  if (level === 'advanced' || level === 'elite') return '5_3_1';
  return 'linear';
}

function generateLinearProgression(
  startWeight: number,
  targetWeight: number,
  weeks: number,
  frequency: number,
): WeekPlan[] {
  const increment = (targetWeight - startWeight) / weeks;

  return Array.from({ length: weeks }, (_, i) => {
    const week = i + 1;
    const currentWeight = startWeight + increment * week;
    const isDeload = week % 4 === 0;
    const dayWeight = isDeload ? currentWeight * 0.7 : currentWeight;

    const sessions: SessionPlan[] = Array.from({ length: frequency }, (__, d) => ({
      dayNumber: d + 1,
      focus: ['chest', 'shoulders', 'arms'] as MuscleGroup[],
      exercises: [
        {
          name: 'Développé couché',
          category: 'compound' as const,
          targetSets: isDeload ? 3 : 5,
          targetReps: 5,
          targetWeight: Math.round(dayWeight / 2.5) * 2.5,
          targetIntensity: isDeload ? 70 : 85,
          targetRPE: isDeload ? 6 : 8,
          restTime: 180,
          notes: isDeload ? 'Semaine de récupération' : undefined,
        },
      ],
      estimatedDuration: 45,
    }));

    return {
      weekNumber: week,
      intensity: isDeload ? 70 : 85,
      volume: isDeload ? frequency * 3 * 5 : frequency * 5 * 5,
      sessions,
      deloadWeek: isDeload,
    };
  });
}

function generate531Program(trainingMax: number, totalWeeks: number): WeekPlan[] {
  const cycles = Math.ceil(totalWeeks / 4);
  const plans: WeekPlan[] = [];

  for (let cycle = 0; cycle < cycles; cycle++) {
    const cycleMax = trainingMax + cycle * 5;
    plans.push(create531Week(cycleMax, 1, [65, 75, 85], [5, 5, 5]));
    plans.push(create531Week(cycleMax, 2, [70, 80, 90], [3, 3, 3]));
    plans.push(create531Week(cycleMax, 3, [75, 85, 95], [5, 3, 1]));
    plans.push(create531Week(cycleMax, 4, [40, 50, 60], [5, 5, 5], true));
  }

  return plans.slice(0, totalWeeks);
}

function create531Week(
  trainingMax: number,
  weekNum: number,
  intensities: number[],
  reps: number[],
  isDeload = false,
): WeekPlan {
  const exercises: PlannedExercise[] = intensities.map((intensity, i) => ({
    name: 'Développé couché',
    category: 'compound' as const,
    targetSets: 1,
    targetReps: reps[i] ?? 5,
    targetWeight: calculateWeight(trainingMax, intensity),
    targetIntensity: intensity,
    targetRPE: isDeload ? 5 : 8,
    restTime: 180,
    notes:
      i === intensities.length - 1 && !isDeload
        ? 'Set AMRAP'
        : undefined,
  }));

  return {
    weekNumber: weekNum,
    intensity: intensities[intensities.length - 1] ?? 85,
    volume: (reps as number[]).reduce((a, b) => a + b, 0),
    sessions: [{ dayNumber: 1, focus: ['chest'], exercises, estimatedDuration: 60 }],
    deloadWeek: isDeload,
  };
}

function generateDUPProgression(
  startWeight: number,
  targetWeight: number,
  weeks: number,
  frequency: number,
): WeekPlan[] {
  const progression = (targetWeight - startWeight) / weeks;
  const patterns = [
    { intensity: 85, reps: 5, sets: 5 },
    { intensity: 75, reps: 8, sets: 4 },
    { intensity: 65, reps: 12, sets: 3 },
  ];

  return Array.from({ length: weeks }, (_, i) => {
    const week = i + 1;
    const weekWeight = startWeight + progression * week;

    const sessions: SessionPlan[] = Array.from({ length: frequency }, (__, d) => {
      const pattern = patterns[d % patterns.length] ?? patterns[0]!;
      return {
        dayNumber: d + 1,
        focus: ['chest'] as MuscleGroup[],
        exercises: [
          {
            name: 'Développé couché',
            category: 'compound' as const,
            targetSets: pattern.sets,
            targetReps: pattern.reps,
            targetWeight: calculateWeight(weekWeight, pattern.intensity),
            targetIntensity: pattern.intensity,
            targetRPE: 8,
            restTime: 180 - (pattern.intensity - 65) * 2,
          },
        ],
        estimatedDuration: 50,
      };
    });

    return {
      weekNumber: week,
      intensity: 75,
      volume: sessions.reduce(
        (sum, s) =>
          sum +
          s.exercises.reduce(
            (eSum, e) =>
              eSum +
              e.targetSets *
                (typeof e.targetReps === 'number' ? e.targetReps : 8),
            0,
          ),
        0,
      ),
      sessions,
      deloadWeek: week % 5 === 0,
    };
  });
}

// ============================================================
// ÉQUILIBRAGE MUSCULAIRE
// ============================================================

export interface MuscleGroupBalance {
  muscleGroup: MuscleGroup;
  currentVolume: number;
  recommendedVolume: number;
  status: 'undertrained' | 'optimal' | 'overtrained';
}

const WEEKLY_VOLUME_RECOMMENDATIONS: Record<MuscleGroup, [number, number]> = {
  chest: [12, 20],
  back: [15, 25],
  shoulders: [12, 20],
  arms: [10, 18],
  legs: [15, 25],
  core: [8, 15],
  glutes: [10, 20],
  calves: [8, 16],
};

export function analyzeMuscleGroupBalance(
  weeklyVolume: Map<MuscleGroup, number>,
): MuscleGroupBalance[] {
  return (Object.entries(WEEKLY_VOLUME_RECOMMENDATIONS) as Array<[MuscleGroup, [number, number]]>)
    .map(([group, [min, max]]) => {
      const current = weeklyVolume.get(group) ?? 0;
      const status: MuscleGroupBalance['status'] =
        current < min ? 'undertrained' : current > max ? 'overtrained' : 'optimal';

      return {
        muscleGroup: group,
        currentVolume: current,
        recommendedVolume: (min + max) / 2,
        status,
      };
    });
}
