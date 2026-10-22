import { create } from 'zustand';
import { deleteWorkoutLocal, loadWorkoutsLocal, saveWorkoutLocal } from '@/services/db';
import { flushSyncQueue } from '@/services/sync';
import type { Workout } from '@/types';

interface WorkoutStore {
  workouts: Workout[];

  loadWorkouts: () => Promise<void>;
  addWorkout: (workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  setWorkouts: (workouts: Workout[]) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
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
}));
