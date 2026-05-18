import { create } from 'zustand';
import { saveWorkoutLocal, deleteWorkoutLocal, loadWorkoutsLocal } from '@/lib/db';
import { flushSyncQueue } from '@/lib/sync';
import { refreshAllNotifications } from '@/lib/notifications';
import { calculateStreakFromWorkouts } from '@/lib/gamification';
import type { Workout } from '@/types';

interface WorkoutStore {
  workouts: Workout[];
  isLoading: boolean;

  loadWorkouts: () => Promise<void>;
  addWorkout: (workout: Workout) => Promise<void>;
  updateWorkout: (workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  setWorkouts: (workouts: Workout[]) => void;

  // Sélecteurs calculés
  getWorkoutById: (id: string) => Workout | undefined;
  getLastWorkoutForExercise: (exerciseName: string) => Workout | undefined;
  getWorkoutsThisWeek: () => Workout[];
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  workouts: [],
  isLoading: false,

  loadWorkouts: async () => {
    set({ isLoading: true });
    const workouts = await loadWorkoutsLocal();
    set({ workouts, isLoading: false });
  },

  addWorkout: async (workout) => {
    await saveWorkoutLocal(workout);
    set((s) => ({ workouts: [workout, ...s.workouts] }));
    flushSyncQueue().catch(() => null);

    // Reschedule streak warning après chaque nouvelle séance
    // Import dynamique pour éviter les cycles
    try {
      const { useProfileStore } = await import('./profileStore');
      const { useSettingsStore } = await import('./settingsStore');
      const profile  = useProfileStore.getState().profile;
      const settings = useSettingsStore.getState().settings;
      if (settings.notifications && profile) {
        const workouts = get().workouts;
        const streak   = calculateStreakFromWorkouts(workouts);
        await refreshAllNotifications(profile.onboarding, streak, workout.date);
      }
    } catch {
      // best-effort
    }
  },

  updateWorkout: async (workout) => {
    await saveWorkoutLocal(workout);
    set((s) => ({
      workouts: s.workouts.map((w) => (w.id === workout.id ? workout : w)),
    }));
    flushSyncQueue().catch(() => null);
  },

  deleteWorkout: async (id) => {
    await deleteWorkoutLocal(id);
    set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) }));
    flushSyncQueue().catch(() => null);
  },

  setWorkouts: (workouts) => set({ workouts }),

  getWorkoutById: (id) => get().workouts.find((w) => w.id === id),

  getLastWorkoutForExercise: (exerciseName) => {
    const lower = exerciseName.toLowerCase();
    return get()
      .workouts.filter((w) =>
        w.exercises.some((e) => e.name.toLowerCase() === lower),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  },

  getWorkoutsThisWeek: () => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return get().workouts.filter((w) => new Date(w.date) >= start);
  },
}));
