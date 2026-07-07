/**
 * GAMIFICATION — porté depuis ../Gym-Tracker/src/lib/gamification.ts
 * Adapté React Native : suppression des imports Lucide (remplacés par string icon name).
 */

import type {
  Workout,
  UserProfile,
  MuscleGroup,
  Rank,
  RankTier,
  Badge,
  GamificationData,
  UnlockedBadge,
} from '@/types';

// ============================================================
// RANGS
// ============================================================

export const RANKS: Rank[] = [
  { tier: 'bronze',   level: 1, name: 'Bronze I',    minXP: 0,      maxXP: 500,    color: '#B45309', icon: 'shield',       description: 'Débutant motivé' },
  { tier: 'bronze',   level: 2, name: 'Bronze II',   minXP: 500,    maxXP: 1000,   color: '#B45309', icon: 'shield',       description: 'En progression' },
  { tier: 'bronze',   level: 3, name: 'Bronze III',  minXP: 1000,   maxXP: 2000,   color: '#B45309', icon: 'shield',       description: 'Régulier' },
  { tier: 'silver',   level: 1, name: 'Argent I',    minXP: 2000,   maxXP: 3500,   color: '#9CA3AF', icon: 'shield-check', description: 'Intermédiaire confirmé' },
  { tier: 'silver',   level: 2, name: 'Argent II',   minXP: 3500,   maxXP: 5000,   color: '#9CA3AF', icon: 'shield-check', description: 'Solide' },
  { tier: 'silver',   level: 3, name: 'Argent III',  minXP: 5000,   maxXP: 7500,   color: '#9CA3AF', icon: 'shield-check', description: 'Persévérant' },
  { tier: 'gold',     level: 1, name: 'Or I',        minXP: 7500,   maxXP: 10000,  color: '#D97706', icon: 'award',        description: 'Athlète accompli' },
  { tier: 'gold',     level: 2, name: 'Or II',       minXP: 10000,  maxXP: 14000,  color: '#D97706', icon: 'award',        description: 'Compétiteur' },
  { tier: 'gold',     level: 3, name: 'Or III',      minXP: 14000,  maxXP: 20000,  color: '#D97706', icon: 'award',        description: 'Champion' },
  { tier: 'platinum', level: 1, name: 'Platine I',   minXP: 20000,  maxXP: 27000,  color: '#0891B2', icon: 'star',         description: 'Élite' },
  { tier: 'platinum', level: 2, name: 'Platine II',  minXP: 27000,  maxXP: 35000,  color: '#0891B2', icon: 'star',         description: 'Haut niveau' },
  { tier: 'platinum', level: 3, name: 'Platine III', minXP: 35000,  maxXP: 45000,  color: '#0891B2', icon: 'star',         description: 'Exceptionnel' },
  { tier: 'diamond',  level: 1, name: 'Diamant I',   minXP: 45000,  maxXP: 60000,  color: '#7C3AED', icon: 'gem',          description: 'Maître' },
  { tier: 'diamond',  level: 2, name: 'Diamant II',  minXP: 60000,  maxXP: 80000,  color: '#7C3AED', icon: 'gem',          description: 'Grand maître' },
  { tier: 'diamond',  level: 3, name: 'Diamant III', minXP: 80000,  maxXP: 100000, color: '#7C3AED', icon: 'gem',          description: 'Légende en devenir' },
  { tier: 'legend',   level: 1, name: 'Légende',     minXP: 100000, maxXP: Infinity, color: '#DC2626', icon: 'crown',      description: 'Le sommet absolu' },
];

export function getRankByXP(xp: number): Rank {
  return (
    RANKS.find((r) => xp >= r.minXP && xp < r.maxXP) ??
    (RANKS[RANKS.length - 1] as Rank)
  );
}

export function getProgressToNextRank(xp: number): number {
  const rank = getRankByXP(xp);
  if (rank.maxXP === Infinity) return 100;
  const range = rank.maxXP - rank.minXP;
  return Math.round(((xp - rank.minXP) / range) * 100);
}

export function getNextRank(tier: RankTier, level: number): Rank | null {
  const idx = RANKS.findIndex((r) => r.tier === tier && r.level === level);
  return idx >= 0 && idx < RANKS.length - 1 ? (RANKS[idx + 1] ?? null) : null;
}

// ============================================================
// CALCUL XP
// ============================================================

export function calculateXPFromWorkouts(workouts: Workout[]): number {
  let xp = 0;
  const today = new Date();

  for (const workout of workouts) {
    xp += 50; // base par séance

    const completedSets = workout.exercises.reduce(
      (t, e) => t + e.sets.filter((s) => s.completed !== false).length,
      0,
    );
    xp += completedSets * 5;

    if (workout.duration) xp += Math.floor(workout.duration / 10) * 10;

    const vol = workout.exercises.reduce(
      (t, e) =>
        t + e.sets.reduce((s, set) => s + set.weight * set.reps, 0),
      0,
    );
    xp += Math.floor(vol / 100) * 2;

    if (workout.feeling) xp += (workout.feeling - 1) * 10;

    const daysDiff = Math.floor(
      (today.getTime() - new Date(workout.date).getTime()) / 86400000,
    );
    if (daysDiff <= 7) xp += 20;
  }

  xp += calculateStreakFromWorkouts(workouts) * 15;

  return xp;
}

/** Clé jour en date LOCALE (YYYY-MM-DD). Ne pas remplacer par toISOString() :
 *  l'ISO est en UTC et décale le jour pour tout fuseau ≠ UTC. */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function calculateStreakFromWorkouts(workouts: Workout[]): number {
  if (!workouts.length) return 0;

  const trainedDays = new Set(
    workouts.map((w) => localDateKey(new Date(w.date))),
  );

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  let streak = 0;

  for (let i = 0; i < 365; i++) {
    if (trainedDays.has(localDateKey(currentDate))) {
      streak++;
    } else if (i > 0) {
      // Un jour raté (autre qu'aujourd'hui, pas encore terminé) casse le streak
      break;
    }

    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

// ============================================================
// BADGES
// ============================================================

export const BADGES: Badge[] = [
  {
    id: 'first_workout',
    name: 'Premier Pas',
    description: 'Complète ta première séance',
    icon: 'dumbbell',
    category: 'milestone',
    xpReward: 100,
    rarity: 'common',
    condition: (d) => d.workouts.length >= 1,
    progress: (d) => Math.min(d.workouts.length, 1) * 100,
  },
  {
    id: 'streak_3',
    name: 'En Feu',
    description: '3 jours de streak consécutifs',
    icon: 'flame',
    category: 'consistency',
    xpReward: 150,
    rarity: 'common',
    condition: (d) => d.streak >= 3,
    progress: (d) => Math.min((d.streak / 3) * 100, 100),
  },
  {
    id: 'streak_7',
    name: 'Semaine Parfaite',
    description: '7 jours de streak',
    icon: 'zap',
    category: 'consistency',
    xpReward: 300,
    rarity: 'rare',
    condition: (d) => d.streak >= 7,
    progress: (d) => Math.min((d.streak / 7) * 100, 100),
  },
  {
    id: 'streak_30',
    name: 'Mois de Fer',
    description: '30 jours de streak',
    icon: 'trophy',
    category: 'consistency',
    xpReward: 1000,
    rarity: 'epic',
    condition: (d) => d.streak >= 30,
    progress: (d) => Math.min((d.streak / 30) * 100, 100),
  },
  {
    id: 'streak_100',
    name: 'Centenaire',
    description: '100 jours de streak',
    icon: 'crown',
    category: 'consistency',
    xpReward: 5000,
    rarity: 'legendary',
    condition: (d) => d.streak >= 100,
    progress: (d) => Math.min((d.streak / 100) * 100, 100),
  },
  {
    id: 'workouts_10',
    name: 'Habitude',
    description: '10 séances complétées',
    icon: 'calendar',
    category: 'milestone',
    xpReward: 200,
    rarity: 'common',
    condition: (d) => d.workouts.length >= 10,
    progress: (d) => Math.min((d.workouts.length / 10) * 100, 100),
  },
  {
    id: 'workouts_50',
    name: 'Régulier',
    description: '50 séances complétées',
    icon: 'trending-up',
    category: 'milestone',
    xpReward: 500,
    rarity: 'rare',
    condition: (d) => d.workouts.length >= 50,
    progress: (d) => Math.min((d.workouts.length / 50) * 100, 100),
  },
  {
    id: 'workouts_100',
    name: 'Centurion',
    description: '100 séances complétées',
    icon: 'shield-check',
    category: 'milestone',
    xpReward: 1500,
    rarity: 'epic',
    condition: (d) => d.workouts.length >= 100,
    progress: (d) => Math.min((d.workouts.length / 100) * 100, 100),
  },
  {
    id: 'pr_first',
    name: 'Premier Record',
    description: 'Enregistre ton premier PR',
    icon: 'star',
    category: 'strength',
    xpReward: 200,
    rarity: 'common',
    condition: (d) => (d.profile?.prs?.length ?? 0) >= 1,
    progress: (d) => Math.min((d.profile?.prs?.length ?? 0), 1) * 100,
  },
  {
    id: 'pr_5',
    name: 'Collectionneur de PRs',
    description: '5 records personnels',
    icon: 'medal',
    category: 'strength',
    xpReward: 400,
    rarity: 'rare',
    condition: (d) => (d.profile?.prs?.length ?? 0) >= 5,
    progress: (d) =>
      Math.min(((d.profile?.prs?.length ?? 0) / 5) * 100, 100),
  },
  {
    id: 'bench_100',
    name: 'Club des 100kg',
    description: 'Développé couché 100kg',
    icon: 'dumbbell',
    category: 'strength',
    xpReward: 800,
    rarity: 'epic',
    condition: (d) =>
      (d.profile?.prs ?? []).some(
        (pr) =>
          pr.exercise.toLowerCase().includes('couché') && pr.weight >= 100,
      ),
    progress: (d) => {
      const pr = (d.profile?.prs ?? []).find((p) =>
        p.exercise.toLowerCase().includes('couché'),
      );
      return pr ? Math.min((pr.weight / 100) * 100, 100) : 0;
    },
  },
  {
    id: 'squat_100',
    name: "Jambes d'Acier",
    description: 'Squat 100kg',
    icon: 'chevron-down',
    category: 'strength',
    xpReward: 800,
    rarity: 'epic',
    condition: (d) =>
      (d.profile?.prs ?? []).some(
        (pr) =>
          pr.exercise.toLowerCase().includes('squat') && pr.weight >= 100,
      ),
    progress: (d) => {
      const pr = (d.profile?.prs ?? []).find((p) =>
        p.exercise.toLowerCase().includes('squat'),
      );
      return pr ? Math.min((pr.weight / 100) * 100, 100) : 0;
    },
  },
  {
    id: 'deadlift_100',
    name: 'Force Brute',
    description: 'Soulevé de terre 100kg',
    icon: 'arrow-up',
    category: 'strength',
    xpReward: 800,
    rarity: 'epic',
    condition: (d) =>
      (d.profile?.prs ?? []).some(
        (pr) =>
          pr.exercise.toLowerCase().includes('terre') && pr.weight >= 100,
      ),
    progress: (d) => {
      const pr = (d.profile?.prs ?? []).find((p) =>
        p.exercise.toLowerCase().includes('terre'),
      );
      return pr ? Math.min((pr.weight / 100) * 100, 100) : 0;
    },
  },
  {
    id: 'volume_1ton',
    name: 'Une Tonne',
    description: '1000kg de volume en une séance',
    icon: 'bar-chart-2',
    category: 'volume',
    xpReward: 300,
    rarity: 'rare',
    condition: (d) =>
      d.workouts.some(
        (w) =>
          w.exercises.reduce(
            (t, e) =>
              t + e.sets.reduce((s, set) => s + set.weight * set.reps, 0),
            0,
          ) >= 1000,
      ),
    progress: (d) => {
      const maxVol = Math.max(
        0,
        ...d.workouts.map((w) =>
          w.exercises.reduce(
            (t, e) =>
              t + e.sets.reduce((s, set) => s + set.weight * set.reps, 0),
            0,
          ),
        ),
      );
      return Math.min((maxVol / 1000) * 100, 100);
    },
  },
  {
    id: 'all_muscles',
    name: 'Corps Complet',
    description: 'Travaille tous les groupes musculaires',
    icon: 'activity',
    category: 'diversity',
    xpReward: 500,
    rarity: 'epic',
    condition: (d) => {
      const muscles = new Set(
        d.workouts.flatMap((w) =>
          w.exercises.flatMap((e) => e.muscleGroups),
        ),
      );
      return (
        ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes'] as MuscleGroup[]
      ).every((m) => muscles.has(m));
    },
    progress: (d) => {
      const muscles = new Set(
        d.workouts.flatMap((w) =>
          w.exercises.flatMap((e) => e.muscleGroups),
        ),
      );
      const all: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes'];
      return Math.round((all.filter((m) => muscles.has(m)).length / all.length) * 100);
    },
  },
  {
    id: 'gold_rank',
    name: 'Statut Or',
    description: 'Atteindre le rang Or',
    icon: 'crown',
    category: 'special',
    xpReward: 1000,
    rarity: 'legendary',
    condition: (d) =>
      (['gold', 'platinum', 'diamond', 'legend'] as RankTier[]).includes(
        getRankByXP(d.totalXP).tier,
      ),
    progress: (d) => Math.min((d.totalXP / 7500) * 100, 100),
  },
];

export function getUnlockedBadges(data: GamificationData): UnlockedBadge[] {
  return BADGES.filter((b) => b.condition(data)).map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    category: b.category,
    xpReward: b.xpReward,
    rarity: b.rarity,
    unlockedAt: new Date().toISOString(),
    currentProgress: 100,
  }));
}

export function getNextBadges(
  data: GamificationData,
): Array<UnlockedBadge & { currentProgress: number }> {
  return BADGES.filter((b) => !b.condition(data))
    .map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      category: b.category,
      xpReward: b.xpReward,
      rarity: b.rarity,
      unlockedAt: '',
      currentProgress: b.progress ? b.progress(data) : 0,
    }))
    .sort((a, b) => b.currentProgress - a.currentProgress)
    .slice(0, 5);
}

// ============================================================
// MUSCLE ACTIVITY
// ============================================================

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  arms: 'Bras',
  legs: 'Jambes',
  core: 'Abdos',
  glutes: 'Fessiers',
  calves: 'Mollets',
};

export function getMuscleActivity(
  workouts: Workout[],
  days = 7,
): Record<MuscleGroup, number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const counts: Partial<Record<MuscleGroup, number>> = {};
  let maxCount = 0;

  const filtered = workouts.filter((w) => new Date(w.date) >= cutoff);

  for (const workout of filtered) {
    for (const exercise of workout.exercises) {
      for (const muscle of exercise.muscleGroups) {
        const prev = counts[muscle] ?? 0;
        counts[muscle] = prev + exercise.sets.length;
        if ((counts[muscle] ?? 0) > maxCount) maxCount = counts[muscle] ?? 0;
      }
    }
  }

  const muscles: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'calves',
  ];
  const result = {} as Record<MuscleGroup, number>;
  for (const m of muscles) {
    result[m] =
      maxCount > 0 ? Math.round(((counts[m] ?? 0) / maxCount) * 100) : 0;
  }

  return result;
}

// Retourne les groupes sous-travaillés (< 25% du max) depuis les 7 derniers jours
export function getUndertainedMuscles(workouts: Workout[]): MuscleGroup[] {
  const activity = getMuscleActivity(workouts, 7);
  return (Object.keys(activity) as MuscleGroup[]).filter(
    (m) => activity[m] < 25,
  );
}

// Retourne les groupes récupérés (dernière sollicitation > 48h)
export function getRecoveredMuscles(workouts: Workout[]): MuscleGroup[] {
  const allMuscles: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'calves',
  ];
  const now = Date.now();
  const cutoff48h = 48 * 60 * 60 * 1000;

  return allMuscles.filter((muscle) => {
    const lastSession = workouts
      .filter((w) =>
        w.exercises.some((e) => e.muscleGroups.includes(muscle)),
      )
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )[0];

    if (!lastSession) return true; // Jamais travaillé → récupéré
    return now - new Date(lastSession.date).getTime() > cutoff48h;
  });
}
