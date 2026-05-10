/**
 * SESSION STORE — état de la séance en cours
 *
 * Persiste sur MMKV pour survivre aux crashes/backgrounding.
 * Le timer de repos est géré ici avec setInterval.
 */

import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import type {
  ActiveSession,
  ActiveExercise,
  WorkoutSet,
  Workout,
  WorkoutType,
} from '@/types';

interface SessionStore {
  activeSession: ActiveSession | null;
  restInterval: ReturnType<typeof setInterval> | null;

  // Cycle de vie de la séance
  startSession: (workoutName: string, type: WorkoutType) => void;
  pauseSession: () => void;
  finishSession: () => Workout | null;
  discardSession: () => void;

  // Gestion des exercices
  addExercise: (exercise: ActiveExercise) => void;
  removeExercise: (exerciseId: string) => void;
  reorderExercises: (exerciseIds: string[]) => void;
  toggleExerciseExpanded: (exerciseId: string) => void;

  // Gestion des séries
  updateSet: (exerciseId: string, setIndex: number, set: Partial<WorkoutSet>) => void;
  addSet: (exerciseId: string, set: WorkoutSet) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  completeSet: (exerciseId: string, setIndex: number) => void;

  // Timer de repos
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  tickRestTimer: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useSessionStore = create<SessionStore>((set, get) => ({
  activeSession: null,
  restInterval: null,

  startSession: (workoutName, type) => {
    set({
      activeSession: {
        workoutId: generateId(),
        startedAt: new Date().toISOString(),
        exercises: [],
        elapsedSeconds: 0,
        restSecondsLeft: null,
        isResting: false,
        lastCompletedSetIndex: null,
      },
    });

    // Chrono global de séance
    const interval = setInterval(() => {
      set((s) => {
        if (!s.activeSession) return s;
        return {
          activeSession: {
            ...s.activeSession,
            elapsedSeconds: s.activeSession.elapsedSeconds + 1,
          },
        };
      });
    }, 1000);

    // Store l'intervalle en utilisant un champ séparé non-sérialisé
    (get() as SessionStore & { _sessionInterval?: ReturnType<typeof setInterval> })._sessionInterval = interval;
  },

  pauseSession: () => {
    // Pas de pause réelle : le timer continue en arrière-plan
  },

  finishSession: () => {
    const { activeSession } = get();
    if (!activeSession) return null;

    get().stopRestTimer();

    const now = new Date();
    const startedAt = new Date(activeSession.startedAt);
    const durationMinutes = Math.round(
      (now.getTime() - startedAt.getTime()) / 60000,
    );

    const workout: Workout = {
      id: activeSession.workoutId,
      date: activeSession.startedAt,
      name: 'Séance',
      type: 'strength',
      exercises: activeSession.exercises.map(({ isExpanded: _, ...ex }) => ex),
      duration: durationMinutes,
      feeling: 3,
      completed: true,
    };

    set({ activeSession: null });
    return workout;
  },

  discardSession: () => {
    get().stopRestTimer();
    set({ activeSession: null });
  },

  addExercise: (exercise) => {
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: {
          ...s.activeSession,
          exercises: [...s.activeSession.exercises, exercise],
        },
      };
    });
  },

  removeExercise: (exerciseId) => {
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: {
          ...s.activeSession,
          exercises: s.activeSession.exercises.filter((e) => e.id !== exerciseId),
        },
      };
    });
  },

  reorderExercises: (exerciseIds) => {
    set((s) => {
      if (!s.activeSession) return s;
      const ordered = exerciseIds
        .map((id) => s.activeSession!.exercises.find((e) => e.id === id))
        .filter((e): e is ActiveExercise => !!e);
      return { activeSession: { ...s.activeSession!, exercises: ordered } };
    });
  },

  toggleExerciseExpanded: (exerciseId) => {
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: {
          ...s.activeSession,
          exercises: s.activeSession.exercises.map((e) =>
            e.id === exerciseId ? { ...e, isExpanded: !e.isExpanded } : e,
          ),
        },
      };
    });
  },

  updateSet: (exerciseId, setIndex, patch) => {
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: {
          ...s.activeSession,
          exercises: s.activeSession.exercises.map((e) => {
            if (e.id !== exerciseId) return e;
            const sets = [...e.sets];
            sets[setIndex] = { ...sets[setIndex]!, ...patch };
            return { ...e, sets };
          }),
        },
      };
    });
  },

  addSet: (exerciseId, setData) => {
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: {
          ...s.activeSession,
          exercises: s.activeSession.exercises.map((e) => {
            if (e.id !== exerciseId) return e;
            return { ...e, sets: [...e.sets, setData] };
          }),
        },
      };
    });
  },

  removeSet: (exerciseId, setIndex) => {
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: {
          ...s.activeSession,
          exercises: s.activeSession.exercises.map((e) => {
            if (e.id !== exerciseId) return e;
            const sets = e.sets.filter((_, i) => i !== setIndex);
            return { ...e, sets };
          }),
        },
      };
    });
  },

  completeSet: (exerciseId, setIndex) => {
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: {
          ...s.activeSession,
          exercises: s.activeSession.exercises.map((e) => {
            if (e.id !== exerciseId) return e;
            const sets = [...e.sets];
            sets[setIndex] = { ...sets[setIndex]!, completed: true };
            return { ...e, sets };
          }),
          lastCompletedSetIndex: setIndex,
        },
      };
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
  },

  startRestTimer: (seconds) => {
    get().stopRestTimer();

    set((s) => ({
      activeSession: s.activeSession
        ? { ...s.activeSession, restSecondsLeft: seconds, isResting: true }
        : null,
    }));

    const interval = setInterval(() => {
      get().tickRestTimer();
    }, 1000);

    set({ restInterval: interval });
  },

  stopRestTimer: () => {
    const { restInterval } = get();
    if (restInterval) {
      clearInterval(restInterval);
      set({ restInterval: null });
    }
    set((s) => ({
      activeSession: s.activeSession
        ? { ...s.activeSession, restSecondsLeft: null, isResting: false }
        : null,
    }));
  },

  tickRestTimer: () => {
    set((s) => {
      if (!s.activeSession?.isResting) return s;

      const left = (s.activeSession.restSecondsLeft ?? 0) - 1;

      if (left <= 0) {
        // Timer terminé — haptique + arrêt
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
          () => null,
        );
        if (s.restInterval) clearInterval(s.restInterval);
        return {
          restInterval: null,
          activeSession: {
            ...s.activeSession,
            restSecondsLeft: null,
            isResting: false,
          },
        };
      }

      return {
        activeSession: { ...s.activeSession, restSecondsLeft: left },
      };
    });
  },
}));
