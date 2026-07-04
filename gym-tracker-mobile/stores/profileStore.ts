import { create } from 'zustand';
import { saveProfileLocal, loadProfileLocal, loadGoalsLocal, saveGoalLocal } from '@/lib/db';
import { flushSyncQueue } from '@/lib/sync';
import { calculateXPFromWorkouts, calculateStreakFromWorkouts, getRankByXP } from '@/lib/gamification';
import type { UserProfile, PersonalRecord, BodyStats, TrainingGoal, Rank, Workout } from '@/types';
import { useWorkoutStore } from './workoutStore';

// Mémoïsation des dérivés coûteux (XP/streak reparcourent tout l'historique).
// Invalide si le tableau workouts change (remplacé immutablement à chaque
// écriture) OU si le jour change (bonus récence et streak dépendent de la date).
const derivedCache = new Map<string, { workouts: Workout[]; day: string; value: number }>();

function memoized(
  key: string,
  workouts: Workout[],
  compute: (w: Workout[]) => number,
): number {
  const day = new Date().toDateString();
  const hit = derivedCache.get(key);
  if (hit && hit.workouts === workouts && hit.day === day) return hit.value;
  const value = compute(workouts);
  derivedCache.set(key, { workouts, day, value });
  return value;
}

interface ProfileStore {
  profile: UserProfile | null;
  goals: TrainingGoal[];
  isLoading: boolean;

  loadProfile: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;

  addPR: (pr: PersonalRecord) => Promise<void>;
  addBodyStats: (stats: BodyStats) => Promise<void>;

  loadGoals: () => Promise<void>;
  saveGoal: (goal: TrainingGoal) => Promise<void>;
  updateGoalProgress: (goalId: string, progress: number) => Promise<void>;

  // Sélecteurs gamification calculés à la volée
  getTotalXP: () => number;
  getStreak: () => number;
  getCurrentRank: () => Rank | null;
  getXPProgress: () => number;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  goals: [],
  isLoading: false,

  loadProfile: async () => {
    set({ isLoading: true });
    const profile = await loadProfileLocal();
    set({ profile, isLoading: false });
  },

  saveProfile: async (profile) => {
    await saveProfileLocal(profile);
    set({ profile });
    flushSyncQueue().catch(() => null);
  },

  updateProfile: async (patch) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...patch };
    await get().saveProfile(updated);
  },

  addPR: async (pr) => {
    const current = get().profile;
    if (!current) return;
    const existing = current.prs.findIndex(
      (p) => p.exercise.toLowerCase() === pr.exercise.toLowerCase(),
    );
    const prs = [...current.prs];
    if (existing >= 0) {
      prs[existing] = pr;
    } else {
      prs.push(pr);
    }
    await get().saveProfile({ ...current, prs });
  },

  addBodyStats: async (stats) => {
    const current = get().profile;
    if (!current) return;
    const bodyStats = [stats, ...current.bodyStats.filter((s) => s.date !== stats.date)];
    await get().saveProfile({ ...current, bodyStats });
  },

  loadGoals: async () => {
    const goals = await loadGoalsLocal();
    set({ goals });
  },

  saveGoal: async (goal) => {
    await saveGoalLocal(goal);
    set((s) => {
      const idx = s.goals.findIndex((g) => g.id === goal.id);
      const goals = [...s.goals];
      if (idx >= 0) goals[idx] = goal;
      else goals.push(goal);
      return { goals };
    });
    flushSyncQueue().catch(() => null);
  },

  updateGoalProgress: async (goalId, progress) => {
    const goal = get().goals.find((g) => g.id === goalId);
    if (!goal) return;
    const updated: TrainingGoal = {
      ...goal,
      progress,
      status: progress >= 100 ? 'completed' : goal.status,
    };
    await get().saveGoal(updated);
  },

  getTotalXP: () => {
    const workouts = useWorkoutStore.getState().workouts;
    return memoized('xp', workouts, calculateXPFromWorkouts);
  },

  getStreak: () => {
    const workouts = useWorkoutStore.getState().workouts;
    return memoized('streak', workouts, calculateStreakFromWorkouts);
  },

  getCurrentRank: () => {
    const xp = get().getTotalXP();
    return getRankByXP(xp);
  },

  getXPProgress: () => {
    const xp = get().getTotalXP();
    const rank = getRankByXP(xp);
    if (rank.maxXP === Infinity) return 100;
    return Math.round(((xp - rank.minXP) / (rank.maxXP - rank.minXP)) * 100);
  },
}));
