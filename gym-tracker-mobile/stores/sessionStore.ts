/**
 * SESSION STORE — état de la séance en cours
 *
 * La séance est persistée dans expo-sqlite/kv-store (synchrone, dispo dans
 * Expo Go) : elle survit à un kill de l'app et se restaure au démarrage.
 *
 * Aucun tick par seconde ici : on stocke des timestamps absolus
 * (startedAt, restEndsAt) et seuls les composants qui affichent un chrono
 * recalculent le temps (voir hooks/useSessionClock.ts). Sinon tout l'écran
 * de séance se re-rend chaque seconde.
 *
 * Toutes les vibrations de la séance partent d'ici, pas des composants.
 */

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { Storage } from 'expo-sqlite/kv-store';
import * as Haptics from 'expo-haptics';
import { scheduleRestCompleteNotification, cancelRestCompleteNotification } from '@/lib/notifications';
import { useSettingsStore } from '@/stores/settingsStore';
import type {
  ActiveSession,
  ActiveExercise,
  WorkoutSet,
  Workout,
  WorkoutType,
} from '@/types';

type NudgeField = 'weight' | 'reps';

interface SessionStore {
  activeSession: ActiveSession | null;

  // Cycle de vie de la séance
  startSession: (workoutName: string, type: WorkoutType) => void;
  finishSession: () => Workout | null;
  discardSession: () => void;

  // Gestion des exercices
  addExercise: (exercise: ActiveExercise) => void;
  removeExercise: (exerciseId: string) => void;
  reorderExercises: (exerciseIds: string[]) => void;
  toggleExerciseExpanded: (exerciseId: string) => void;

  // Gestion des séries
  updateSet: (exerciseId: string, setIndex: number, set: Partial<WorkoutSet>) => void;
  /** One swipe step on weight or reps, with a haptic tick. */
  nudgeSet: (exerciseId: string, setIndex: number, field: NudgeField, delta: number) => void;
  addSet: (exerciseId: string, set: WorkoutSet) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  /** Marks the set done and starts the rest timer. */
  completeSet: (exerciseId: string, setIndex: number) => void;
  /** "Done as planned": completes every remaining set of the exercise at once. */
  completeRemaining: (exerciseId: string) => number[];

  // Timer de repos
  startRestTimer: (seconds: number) => void;
  addRestTime: (seconds: number) => void;
  stopRestTimer: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Hors du state : un timeout n'a rien à faire dans un état sérialisable
let restEndTimeout: ReturnType<typeof setTimeout> | null = null;

function clearRestEndTimeout() {
  if (restEndTimeout) {
    clearTimeout(restEndTimeout);
    restEndTimeout = null;
  }
}

function armRestEnd(ms: number) {
  clearRestEndTimeout();
  restEndTimeout = setTimeout(() => {
    restEndTimeout = null;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => null);
    useSessionStore.setState((s) => ({
      activeSession: s.activeSession ? { ...s.activeSession, restEndsAt: null } : null,
    }));
  }, ms);
}

// Lecture/écriture synchrones : la séance est déjà là au premier rendu
const kvStorage: StateStorage = {
  getItem: (key) => Storage.getItemSync(key),
  setItem: (key, value) => Storage.setItemSync(key, value),
  removeItem: (key) => { Storage.removeItemSync(key); },
};

function mapExercise(
  session: ActiveSession,
  exerciseId: string,
  fn: (e: ActiveExercise) => ActiveExercise,
): ActiveSession {
  return {
    ...session,
    exercises: session.exercises.map((e) => (e.id === exerciseId ? fn(e) : e)),
  };
}

function patchSet(e: ActiveExercise, setIndex: number, patch: Partial<WorkoutSet>): ActiveExercise {
  const current = e.sets[setIndex];
  if (!current) return e;
  const sets = [...e.sets];
  sets[setIndex] = { ...current, ...patch };
  return { ...e, sets };
}

export const useSessionStore = create<SessionStore>()(persist((set, get) => ({
  activeSession: null,

  startSession: () => {
    clearRestEndTimeout();
    set({
      activeSession: {
        workoutId: generateId(),
        startedAt: new Date().toISOString(),
        exercises: [],
        restEndsAt: null,
        restDuration: null,
        lastCompleted: null,
      },
    });
  },

  finishSession: () => {
    const { activeSession } = get();
    if (!activeSession) return null;

    get().stopRestTimer();

    const durationMinutes = Math.round(
      (Date.now() - new Date(activeSession.startedAt).getTime()) / 60000,
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
      return { activeSession: { ...s.activeSession, exercises: ordered } };
    });
  },

  toggleExerciseExpanded: (exerciseId) => {
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: mapExercise(s.activeSession, exerciseId, (e) => ({ ...e, isExpanded: !e.isExpanded })),
      };
    });
  },

  updateSet: (exerciseId, setIndex, patch) => {
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: mapExercise(s.activeSession, exerciseId, (e) => patchSet(e, setIndex, patch)),
      };
    });
  },

  nudgeSet: (exerciseId, setIndex, field, delta) => {
    const exercise = get().activeSession?.exercises.find((e) => e.id === exerciseId);
    const current = exercise?.sets[setIndex];
    if (!current) return;

    // Arrondi pour éviter les 52.49999 après plusieurs pas de 2.5
    const next = Math.max(0, Math.round((current[field] + delta) * 100) / 100);
    if (next === current[field]) return;

    get().updateSet(exerciseId, setIndex, { [field]: next });
    Haptics.selectionAsync().catch(() => null);
  },

  addSet: (exerciseId, setData) => {
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: mapExercise(s.activeSession, exerciseId, (e) => ({ ...e, sets: [...e.sets, setData] })),
      };
    });
  },

  removeSet: (exerciseId, setIndex) => {
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: mapExercise(s.activeSession, exerciseId, (e) => ({
          ...e,
          sets: e.sets.filter((_, i) => i !== setIndex),
        })),
      };
    });
  },

  completeSet: (exerciseId, setIndex) => {
    const exercise = get().activeSession?.exercises.find((e) => e.id === exerciseId);
    const target = exercise?.sets[setIndex];
    if (!target || target.completed) return;

    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: {
          ...mapExercise(s.activeSession, exerciseId, (e) => patchSet(e, setIndex, { completed: true })),
          lastCompleted: { exerciseId, setIndex },
        },
      };
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);

    const { restTimerEnabled, defaultRestTime } = useSettingsStore.getState().settings;
    if (restTimerEnabled) get().startRestTimer(target.restTime ?? defaultRestTime);
  },

  completeRemaining: (exerciseId) => {
    const exercise = get().activeSession?.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return [];

    const indexes = exercise.sets
      .map((s, i) => (s.completed ? -1 : i))
      .filter((i) => i >= 0);
    if (indexes.length === 0) return [];

    const lastIndex = indexes[indexes.length - 1]!;
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: {
          ...mapExercise(s.activeSession, exerciseId, (e) => ({
            ...e,
            sets: e.sets.map((set) => (set.completed ? set : { ...set, completed: true })),
          })),
          lastCompleted: { exerciseId, setIndex: lastIndex },
        },
      };
    });

    // Pas de repos : l'exercice est terminé, on enchaîne
    get().stopRestTimer();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    return indexes;
  },

  startRestTimer: (seconds) => {
    if (!get().activeSession) return;
    clearRestEndTimeout();

    const duration = Math.max(1, Math.round(seconds));
    const restEndsAt = Date.now() + duration * 1000;

    set((s) => ({
      activeSession: s.activeSession ? { ...s.activeSession, restEndsAt, restDuration: duration } : null,
    }));

    // Notification OS — se déclenche même app en arrière-plan
    cancelRestCompleteNotification().catch(() => null);
    scheduleRestCompleteNotification(duration).catch(() => null);

    armRestEnd(duration * 1000);
  },

  addRestTime: (seconds) => {
    const restEndsAt = get().activeSession?.restEndsAt;
    if (restEndsAt == null) return;
    const left = Math.ceil((restEndsAt - Date.now()) / 1000);
    get().startRestTimer(left + seconds);
  },

  stopRestTimer: () => {
    clearRestEndTimeout();
    cancelRestCompleteNotification().catch(() => null);
    set((s) => ({
      activeSession: s.activeSession
        ? { ...s.activeSession, restEndsAt: null, restDuration: null }
        : null,
    }));
  },
}), {
  name: 'active-session',
  version: 1,
  storage: createJSONStorage(() => kvStorage),
  partialize: (s) => ({ activeSession: s.activeSession }),
}));

// Après un kill de l'app : on réarme la fin du repos, ou on l'efface s'il est déjà fini
const restored = useSessionStore.getState().activeSession;
if (restored?.restEndsAt != null) {
  const left = restored.restEndsAt - Date.now();
  if (left > 0) {
    armRestEnd(left);
  } else {
    useSessionStore.setState({ activeSession: { ...restored, restEndsAt: null, restDuration: null } });
  }
}
