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
 * Toutes les vibrations et annonces vocales de la séance partent d'ici,
 * pas des composants.
 */

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { Storage } from 'expo-sqlite/kv-store';
import * as Haptics from 'expo-haptics';
import { scheduleRestCompleteNotification, cancelRestCompleteNotification } from '@/lib/notifications';
import { findCurrent } from '@/lib/sessionCursor';
import { nextExerciseLine, restOverLine, setLine, speak } from '@/lib/voice';
import { formatKg } from '@/lib/plates';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ActiveSession, ActiveExercise, WorkoutSet, Workout } from '@/types';

type NudgeField = 'weight' | 'reps';

interface SessionStore {
  activeSession: ActiveSession | null;

  // Cycle de vie de la séance
  startSession: (name: string, exercises: ActiveExercise[]) => void;
  finishSession: () => Workout | null;
  discardSession: () => void;

  // Gestion des séries
  updateSet: (exerciseId: string, setIndex: number, set: Partial<WorkoutSet>) => void;
  /** One step on weight or reps, with a haptic tick. */
  nudgeSet: (exerciseId: string, setIndex: number, field: NudgeField, delta: number) => void;
  /** First time on an exercise: sets the weight of every remaining set. */
  setStartWeight: (exerciseId: string, weight: number) => void;
  /** Marks the set done and starts the rest timer, unless it was the last set. */
  completeSet: (exerciseId: string, setIndex: number) => void;
  /** "Done as planned": completes every remaining set at once, then starts the rest timer. */
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
      activeSession: s.activeSession ? { ...s.activeSession, restEndsAt: null, restDuration: null } : null,
    }));

    const session = useSessionStore.getState().activeSession;
    const next = session && findCurrent(session.exercises);
    if (next && !next.exercise.needsWeight && useSettingsStore.getState().settings.voice) {
      speak(restOverLine(next));
    }
  }, ms);
}

/** After a set: announce the next exercise early so the bar can be loaded during the rest. */
function announceNext(previousExerciseId: string) {
  const session = useSessionStore.getState().activeSession;
  const settings = useSettingsStore.getState().settings;
  const next = session && findCurrent(session.exercises);
  if (!next || !settings.voice) return;
  if (next.exercise.id !== previousExerciseId) speak(nextExerciseLine(next, settings));
}

function restBody(session: ActiveSession | null): string {
  const next = session && findCurrent(session.exercises);
  if (!next) return 'Lance ta prochaine série.';
  const load = next.set.weight > 0 ? ` · ${formatKg(next.set.weight)} kg × ${next.set.reps}` : ` · ${next.set.reps} reps`;
  return `${next.exercise.name}${load}`;
}

/** Last set of the whole session: no rest, the summary comes next. */
function isSessionDone(session: ActiveSession | null): boolean {
  return !!session && findCurrent(session.exercises) === null;
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

  startSession: (name, exercises) => {
    clearRestEndTimeout();
    set({
      activeSession: {
        workoutId: generateId(),
        name,
        startedAt: new Date().toISOString(),
        exercises,
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
      name: activeSession.name,
      type: 'strength',
      // Un exercice sans aucune série validée n'a rien à faire dans l'historique
      exercises: activeSession.exercises
        .filter((e) => e.sets.some((set) => set.completed))
        .map(({ equipment: _e, needsWeight: _n, ...ex }) => ex),
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

  setStartWeight: (exerciseId, weight) => {
    set((s) => {
      if (!s.activeSession) return s;
      return {
        activeSession: mapExercise(s.activeSession, exerciseId, (e) => ({
          ...e,
          needsWeight: false,
          sets: e.sets.map((set) =>
            set.completed ? set : { ...set, weight, target: { weight, reps: set.target?.reps ?? set.reps } },
          ),
        })),
      };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
    const next = findCurrent(get().activeSession?.exercises ?? []);
    if (next && useSettingsStore.getState().settings.voice) speak(setLine(next));
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
    if (isSessionDone(get().activeSession)) return;

    const { restTimerEnabled, defaultRestTime } = useSettingsStore.getState().settings;
    if (restTimerEnabled) get().startRestTimer(target.restTime ?? defaultRestTime);
    announceNext(exerciseId);
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

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    if (isSessionDone(get().activeSession)) return indexes;

    const { restTimerEnabled, defaultRestTime } = useSettingsStore.getState().settings;
    if (restTimerEnabled) get().startRestTimer(exercise.sets[lastIndex]?.restTime ?? defaultRestTime);
    announceNext(exerciseId);
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
    scheduleRestCompleteNotification(duration, restBody(get().activeSession)).catch(() => null);

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
  version: 2,
  // Les séances de l'ancienne interface n'ont pas la même forme : on les abandonne
  migrate: () => ({ activeSession: null }),
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
