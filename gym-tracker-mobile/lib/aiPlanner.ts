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
  WorkoutType,
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

export function generateWarmupSets(workingWeight: number, targetReps: number = 5): WorkoutSet[] {
  const warmups: WorkoutSet[] = [];

  // Plus les reps sont basses (intensité haute), plus on a besoin de montée progressive
  const isLowRep  = targetReps <= 3;   // Force max, 1-3 reps
  const isMidRep  = targetReps <= 6;   // Force/hypertrophie, 4-6 reps
  // isHighRep = 7+ reps : moins de sets de chauffe nécessaires

  // Set 1 — toujours : très léger, activer les muscles
  warmups.push({
    reps: Math.min(15, targetReps + 8),
    weight: Math.max(0, Math.round((workingWeight * 0.35) / 2.5) * 2.5),
    setType: 'warmup',
    restTime: 60,
  });

  // Set 2 — si poids > 50kg
  if (workingWeight > 50) {
    warmups.push({
      reps: Math.min(10, targetReps + 4),
      weight: Math.round((workingWeight * 0.55) / 2.5) * 2.5,
      setType: 'warmup',
      restTime: 75,
    });
  }

  // Set 3 — si poids > 70kg et reps modérées/basses
  if (workingWeight > 70 && isMidRep) {
    warmups.push({
      reps: Math.min(5, targetReps + 2),
      weight: Math.round((workingWeight * 0.72) / 2.5) * 2.5,
      setType: 'warmup',
      restTime: 90,
    });
  }

  // Set 4 — si poids > 90kg et reps basses (force max)
  if (workingWeight > 90 && isLowRep) {
    warmups.push({
      reps: Math.max(1, targetReps),
      weight: Math.round((workingWeight * 0.87) / 2.5) * 2.5,
      setType: 'warmup',
      restTime: 150,
    });
  }

  // Set 5 — si poids > 120kg et reps très basses (≤ 2)
  if (workingWeight > 120 && targetReps <= 2) {
    warmups.push({
      reps: 1,
      weight: Math.round((workingWeight * 0.95) / 2.5) * 2.5,
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

const CARDIO_SUGGESTION: SuggestedSession = {
  title: 'Circuit Cardio',
  focus: [],
  exercises: [
    { name: 'Corde à sauter', category: 'accessory', targetSets: 5, targetReps: 60, restTime: 30, targetRPE: 8 },
    { name: 'Burpees', category: 'accessory', targetSets: 4, targetReps: 15, restTime: 45, targetRPE: 8 },
    { name: 'Mountain climbers', category: 'accessory', targetSets: 4, targetReps: 20, restTime: 30, targetRPE: 7 },
    { name: 'Jumping jacks', category: 'accessory', targetSets: 4, targetReps: 30, restTime: 20, targetRPE: 6 },
  ],
  estimatedDuration: 30,
  reason: 'Boost ton endurance cardiovasculaire et brûle des calories efficacement',
};

const MOBILITY_SUGGESTION: SuggestedSession = {
  title: 'Mobilité & Récupération',
  focus: [],
  exercises: [
    { name: 'Échauffement articulaire', category: 'accessory', targetSets: 2, targetReps: 10, restTime: 15, targetRPE: 2 },
    { name: 'World greatest stretch', category: 'accessory', targetSets: 3, targetReps: 8, restTime: 20, targetRPE: 3 },
    { name: 'Hip flexor stretch', category: 'accessory', targetSets: 2, targetReps: 30, restTime: 15, targetRPE: 3 },
    { name: 'Cat-cow', category: 'accessory', targetSets: 3, targetReps: 12, restTime: 10, targetRPE: 2 },
    { name: 'Pigeon pose', category: 'accessory', targetSets: 2, targetReps: 30, restTime: 15, targetRPE: 3 },
  ],
  estimatedDuration: 25,
  reason: 'Améliore ta mobilité articulaire et accélère la récupération musculaire',
};

export function getSuggestedSession(
  profile: UserProfile,
  workouts: Workout[],
  activePlan: TrainingPlan | null,
  workoutType: WorkoutType = 'strength',
): SuggestedSession {
  if (workoutType === 'cardio') return CARDIO_SUGGESTION;
  if (workoutType === 'mobility') return MOBILITY_SUGGESTION;

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

  const focusMuscles = bestSplit.split.muscles.filter((m) => recovered.includes(m));
  const finalFocus = focusMuscles.length > 0 ? focusMuscles : bestSplit.split.muscles;

  // Paramètres spécifiques au type
  const isStrength = workoutType === 'strength';
  const targetSetsCompound = isStrength ? 5 : 4;
  const targetSetsIsolation = isStrength ? 4 : 3;
  const targetRepsRange: [number, number] = isStrength ? [3, 5] : [8, 12];
  const restTimeCompound = isStrength ? 240 : 90;
  const restTimeIsolation = isStrength ? 180 : 60;
  const intensityPct = isStrength ? 85 : 70;

  // 4. Construit la liste d'exercices — force : composés uniquement
  const exercises: PlannedExercise[] = [];
  for (const muscle of finalFocus.slice(0, 3)) {
    const available = EXERCISE_DB[muscle] ?? [];
    const filtered = isStrength ? available.filter((ex) => ex.category === 'compound') : available;
    const picked = filtered.slice(0, muscle === 'arms' ? 2 : isStrength ? 2 : 3);
    for (const ex of picked) {
      const pr = profile.prs.find((p) =>
        p.exercise.toLowerCase().includes(ex.name.toLowerCase().split(' ')[0] ?? ''),
      );
      exercises.push({
        name: ex.name,
        category: ex.category,
        targetSets: ex.category === 'compound' ? targetSetsCompound : targetSetsIsolation,
        targetReps: targetRepsRange,
        targetWeight: pr ? calculateWeight(pr.oneRepMax, intensityPct) : undefined,
        targetRPE: isStrength ? 9 : 8,
        restTime: ex.category === 'compound' ? restTimeCompound : restTimeIsolation,
      });
    }
  }

  const estimated = exercises.reduce((total, ex) => {
    const sets = ex.targetSets;
    const avgRest = ex.restTime / 60;
    return total + sets * (1.5 + avgRest);
  }, 0);

  const recoveredCount = finalFocus.length;
  const typeLabel = isStrength
    ? 'Charges lourdes, faibles reps — développe ta force max'
    : 'Volume modéré, tension musculaire — optimise l\'hypertrophie';
  const reason =
    recoveredCount > 0
      ? typeLabel
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
