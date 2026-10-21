import { create } from 'zustand';
import { saveWorkoutLocal, deleteWorkoutLocal, loadWorkoutsLocal } from '@/lib/db';
import { flushSyncQueue } from '@/lib/sync';
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
    set((s) => ({ workouts: [workout, ...s.workouts] }));
    flushSyncQueue().catch(() => null);
  },

  deleteWorkout: async (id) => {
    await deleteWorkoutLocal(id);
    set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) }));
    flushSyncQueue().catch(() => null);
  },

  setWorkouts: (workouts) => set({ workouts }),
}));

/** Workouts since Monday. */
export function workoutsThisWeek(workouts: Workout[], now = new Date()): Workout[] {
  const start = new Date(now);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return workouts.filter((w) => new Date(w.date) >= start);
}
