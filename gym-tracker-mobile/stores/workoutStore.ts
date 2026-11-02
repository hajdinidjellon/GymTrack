import { create } from 'zustand';
import { mergeWorkouts } from '@/domain/backup';
import { deleteWorkoutLocal, loadWorkoutsLocal, saveWorkoutLocal } from '@/services/db';
import { flushSyncQueue } from '@/services/sync';
import type { Workout } from '@/types';

interface WorkoutStore {
  workouts: Workout[];

  loadWorkouts: () => Promise<void>;
  addWorkout: (workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  setWorkouts: (workouts: Workout[]) => void;
  /** Adds the sessions not there yet (import, restore). Returns how many were added. */
  importWorkouts: (incoming: Workout[]) => Promise<number>;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  workouts: [],

  loadWorkouts: async () => {
    const workouts = await loadWorkoutsLocal();
    set({ workouts });
  },

  addWorkout: async (workout) => {
    await saveWorkoutLocal(workout);
    set((s) => ({ workouts: [workout, ...s.workouts.filter((w) => w.id !== workout.id)] }));
    flushSyncQueue().catch(() => null);
  },

  deleteWorkout: async (id) => {
    await deleteWorkoutLocal(id);
    set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) }));
    flushSyncQueue().catch(() => null);
  },

  setWorkouts: (workouts) => set({ workouts }),

  importWorkouts: async (incoming) => {
    const { workouts, added } = mergeWorkouts(get().workouts, incoming);
    for (const workout of added) await saveWorkoutLocal(workout);
    set({ workouts });
    if (added.length) flushSyncQueue().catch(() => null);
    return added.length;
  },
}));
