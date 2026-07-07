/**
 * SESSION STORE — état de la séance en cours
 *
 * activeSession est persisté sur AsyncStorage (middleware zustand/persist) :
 * une séance en cours survit au kill de l'app. À la réhydratation,
 * resumeSession() recalcule le chrono depuis startedAt et relance les timers.
 * Les séances de plus de MAX_RESUMABLE_AGE_MS sont considérées abandonnées.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { scheduleRestCompleteNotification, cancelRestCompleteNotification } from '@/lib/notifications';
import type {
  ActiveSession,
  ActiveExercise,
  WorkoutSet,
  Workout,
  WorkoutType,
} from '@/types';

const SESSION_STORAGE_KEY = '@gymtrack/active-session';

// Au-delà de 12 h, une séance retrouvée à la réhydratation est jetée :
// personne ne s'entraîne 12 h, c'est une séance oubliée puis app tuée.
const MAX_RESUMABLE_AGE_MS = 12 * 60 * 60 * 1000;

interface SessionStore {
  activeSession: ActiveSession | null;
  sessionInterval: ReturnType<typeof setInterval> | null;
  restInterval: ReturnType<typeof setInterval> | null;

  // Cycle de vie de la séance
  startSession: (workoutName: string, type: WorkoutType) => void;
  resumeSession: () => void;
  pauseSession: () => void;
  finishSession: (feeling?: Workout['feeling']) => Workout | null;
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

const elapsedSince = (startedAt: string): number =>
  Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => {
      // Chrono global : recalculé depuis startedAt à chaque tick (pas
      // d'incrément) → pas de dérive quand JS est gelé en arrière-plan.
      const startClock = () => {
        const prev = get().sessionInterval;
        if (prev) clearInterval(prev);
        const interval = setInterval(() => {
          set((s) => {
            if (!s.activeSession) return s;
            return {
              activeSession: {
                ...s.activeSession,
                elapsedSeconds: elapsedSince(s.activeSession.startedAt),
              },
            };
          });
        }, 1000);
        set({ sessionInterval: interval });
      };

      const stopClock = () => {
        const { sessionInterval } = get();
        if (sessionInterval) {
          clearInterval(sessionInterval);
          set({ sessionInterval: null });
        }
      };

      return {
        activeSession: null,
        sessionInterval: null,
        restInterval: null,

        startSession: (workoutName, type) => {
          set({
            activeSession: {
              workoutId: generateId(),
              name: workoutName,
              type,
              startedAt: new Date().toISOString(),
              exercises: [],
              elapsedSeconds: 0,
              restSecondsLeft: null,
              restEndsAt: null,
              isResting: false,
              lastCompletedSetIndex: null,
            },
          });
          startClock();
        },

        // Appelé après réhydratation (kill/restart de l'app avec séance en cours)
        resumeSession: () => {
          const { activeSession } = get();
          if (!activeSession) return;

          const ageMs = Date.now() - new Date(activeSession.startedAt).getTime();
          if (ageMs > MAX_RESUMABLE_AGE_MS) {
            get().discardSession();
            return;
          }

          set({
            activeSession: {
              ...activeSession,
              elapsedSeconds: elapsedSince(activeSession.startedAt),
            },
          });
          startClock();

          if (activeSession.isResting && activeSession.restEndsAt != null) {
            if (activeSession.restEndsAt <= Date.now()) {
              // Le repos s'est terminé pendant que l'app était fermée
              set((s) => ({
                activeSession: s.activeSession
                  ? { ...s.activeSession, restSecondsLeft: 0, restEndsAt: null, isResting: false }
                  : null,
              }));
            } else {
              const interval = setInterval(() => get().tickRestTimer(), 1000);
              set({ restInterval: interval });
              get().tickRestTimer();
            }
          }
        },

        pauseSession: () => {
          // Pas de pause réelle : le timer continue en arrière-plan
        },

        finishSession: (feeling = 3) => {
          const { activeSession } = get();
          if (!activeSession) return null;

          get().stopRestTimer();
          stopClock();

          const now = new Date();
          const startedAt = new Date(activeSession.startedAt);
          const durationMinutes = Math.round(
            (now.getTime() - startedAt.getTime()) / 60000,
          );

          const workout: Workout = {
            id: activeSession.workoutId,
            date: activeSession.startedAt,
            name: activeSession.name,
            type: activeSession.type,
            exercises: activeSession.exercises.map(({ isExpanded: _, ...ex }) => ex),
            duration: durationMinutes,
            feeling,
            completed: true,
          };

          set({ activeSession: null });
          return workout;
        },

        discardSession: () => {
          get().stopRestTimer();
          stopClock();
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

          const restEndsAt = Date.now() + seconds * 1000;

          set((s) => ({
            activeSession: s.activeSession
              ? { ...s.activeSession, restSecondsLeft: seconds, restEndsAt, isResting: true }
              : null,
          }));

          // Notification OS — se déclenche même app en arrière-plan
          scheduleRestCompleteNotification(seconds).catch(() => null);

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
          cancelRestCompleteNotification().catch(() => null);
          set((s) => ({
            activeSession: s.activeSession
              ? { ...s.activeSession, restSecondsLeft: null, restEndsAt: null, isResting: false }
              : null,
          }));
        },

        tickRestTimer: () => {
          const { activeSession, restInterval } = get();
          if (!activeSession?.isResting || activeSession.restEndsAt == null) return;

          const left = Math.ceil((activeSession.restEndsAt - Date.now()) / 1000);

          if (left <= 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => null);
            if (restInterval) clearInterval(restInterval);
            set({
              restInterval: null,
              activeSession: { ...activeSession, restSecondsLeft: 0, restEndsAt: null, isResting: false },
            });
            return;
          }

          set({ activeSession: { ...activeSession, restSecondsLeft: left } });
        },
      };
    },
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      // Seule la séance est persistée — jamais les handles d'interval
      partialize: (s) => ({ activeSession: s.activeSession }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('[session] rehydration failed', error);
          return;
        }
        // Relance les timers hors du cycle de réhydratation
        if (state?.activeSession) {
          setTimeout(() => useSessionStore.getState().resumeSession(), 0);
        }
      },
    },
  ),
);
