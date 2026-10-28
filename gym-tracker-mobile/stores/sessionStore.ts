/**
 * SESSION STORE — la séance en cours.
 *
 * Les transitions d'état sont pures et testées (domain/session.ts). Ce store
 * les applique puis déclenche les effets : vibrations, voix, notification de
 * fin de repos. Aucun composant ne fait vibrer ou parler l'app lui-même.
 *
 * La séance est persistée dans expo-sqlite/kv-store (synchrone, dispo dans
 * Expo Go) : elle survit à un kill de l'app. Les minuteurs sont des
 * timestamps absolus, seuls les composants qui affichent un chrono se
 * re-rendent chaque seconde (hooks/useSessionClock.ts).
 */

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { Storage } from 'expo-sqlite/kv-store';
import * as Haptics from 'expo-haptics';
import * as Session from '@/domain/session';
import { formatKg } from '@/domain/plates';
import { findCurrent } from '@/domain/sessionCursor';
import { nextExerciseLine, restOverLine, setLine } from '@/domain/voiceLines';
import { cancelRestCompleteNotification, scheduleRestCompleteNotification } from '@/services/notifications';
import { speak } from '@/services/speech';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ActiveExercise, ActiveSession, Workout, WorkoutSet } from '@/types';

type NudgeField = 'weight' | 'reps';

interface SessionStore {
  activeSession: ActiveSession | null;

  startSession: (name: string, exercises: ActiveExercise[]) => void;
  /** Ends the session and returns what goes into the history. */
  finishSession: () => Workout | null;
  discardSession: () => void;

  updateSet: (exerciseId: string, setIndex: number, patch: Partial<WorkoutSet>) => void;
  /** One step on weight or reps, with a haptic tick. */
  nudgeSet: (exerciseId: string, setIndex: number, field: NudgeField, delta: number) => void;
  /** One more set at the end of the exercise, same target as the last one. */
  addSet: (exerciseId: string) => void;
  /** Removes a set still to do (swipe left on its row). */
  removeSet: (exerciseId: string, setIndex: number) => void;
  /** First time on an exercise: sets the weight of every remaining set. */
  setStartWeight: (exerciseId: string, weight: number) => void;
  /** Marks the set done and starts the rest timer, unless it was the last set. */
  completeSet: (exerciseId: string, setIndex: number) => void;
  /** "Done as planned": completes every remaining set of the exercise at once. */
  completeRemaining: (exerciseId: string) => void;
  /** Takes back the last validated set and cancels its rest. */
  undoLastSet: () => void;
  /** Another exercise instead of this one; the sets already done stay. */
  replaceExercise: (exerciseId: string, next: ActiveExercise) => void;

  startRestTimer: (seconds: number) => void;
  addRestTime: (seconds: number) => void;
  stopRestTimer: () => void;
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const settings = () => useSettingsStore.getState().settings;

// Hors du state : un timeout n'a rien à faire dans un état sérialisable
let restEndTimeout: ReturnType<typeof setTimeout> | null = null;

function clearRestEndTimeout() {
  if (restEndTimeout) clearTimeout(restEndTimeout);
  restEndTimeout = null;
}

function armRestEnd(ms: number) {
  clearRestEndTimeout();
  restEndTimeout = setTimeout(() => {
    restEndTimeout = null;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => null);
    useSessionStore.setState((s) => ({ activeSession: s.activeSession && Session.endRest(s.activeSession) }));

    const session = useSessionStore.getState().activeSession;
    const next = session && findCurrent(session.exercises);
    if (next && !next.exercise.needsWeight && settings().voice) speak(restOverLine(next));
  }, ms);
}

/** After a set: announce a new exercise early, so the bar can be loaded during the rest. */
function afterSet(previousExerciseId: string, restSeconds: number) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
  const session = useSessionStore.getState().activeSession;
  if (!session || Session.isDone(session)) return;

  const { restTimerEnabled, voice } = settings();
  if (restTimerEnabled) useSessionStore.getState().startRestTimer(restSeconds);

  const next = findCurrent(session.exercises);
  if (next && voice && next.exercise.id !== previousExerciseId) speak(nextExerciseLine(next, settings()));
}

/**
 * The exercise to do just changed under the user's thumb (swap, reorder).
 * Resting: the rest notification now names the right exercise. Not resting:
 * the voice announces it, plates included.
 */
function afterCurrentChanged(previousExerciseId: string | undefined) {
  const session = useSessionStore.getState().activeSession;
  const next = session && findCurrent(session.exercises);
  if (!session || !next || next.exercise.id === previousExerciseId) return;
  const left = Session.restLeft(session, Date.now());
  if (left > 0) void scheduleRestCompleteNotification(left, Session.nextSetSummary(session, formatKg));
  else if (settings().voice) speak(nextExerciseLine(next, settings()));
}

// Lecture/écriture synchrones : la séance est déjà là au premier rendu
const kvStorage: StateStorage = {
  getItem: (key) => Storage.getItemSync(key),
  setItem: (key, value) => Storage.setItemSync(key, value),
  removeItem: (key) => {
    Storage.removeItemSync(key);
  },
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => {
      /** Applies a pure transition to the running session, if any. */
      const apply = (fn: (s: ActiveSession) => ActiveSession) =>
        set((state) => (state.activeSession ? { activeSession: fn(state.activeSession) } : state));
      const currentId = () => findCurrent(get().activeSession?.exercises ?? [])?.exercise.id;

      return {
        activeSession: null,

        startSession: (name, exercises) => {
          clearRestEndTimeout();
          set({ activeSession: Session.createSession(newId(), name, exercises, new Date()) });
        },

        finishSession: () => {
          const session = get().activeSession;
          if (!session) return null;
          get().stopRestTimer();
          set({ activeSession: null });
          return Session.toWorkout(session, new Date());
        },

        discardSession: () => {
          get().stopRestTimer();
          set({ activeSession: null });
        },

        updateSet: (exerciseId, setIndex, patch) => apply((s) => Session.updateSet(s, exerciseId, setIndex, patch)),

        nudgeSet: (exerciseId, setIndex, field, delta) => {
          const session = get().activeSession;
          const current = session && Session.findSet(session, exerciseId, setIndex);
          if (!current) return;
          const next = Session.nudge(current[field], delta);
          if (next === current[field]) return;
          get().updateSet(exerciseId, setIndex, { [field]: next });
          Haptics.selectionAsync().catch(() => null);
        },

        addSet: (exerciseId) => {
          apply((s) => Session.addSet(s, exerciseId));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
        },

        removeSet: (exerciseId, setIndex) => {
          const before = get().activeSession;
          apply((s) => Session.removeSet(s, exerciseId, setIndex));
          if (get().activeSession !== before) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
          }
        },

        setStartWeight: (exerciseId, weight) => {
          apply((s) => Session.setStartWeight(s, exerciseId, weight));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
          const next = findCurrent(get().activeSession?.exercises ?? []);
          if (next && settings().voice) speak(setLine(next));
        },

        completeSet: (exerciseId, setIndex) => {
          const session = get().activeSession;
          const target = session && Session.findSet(session, exerciseId, setIndex);
          if (!target || target.completed) return;
          apply((s) => Session.completeSet(s, exerciseId, setIndex, Date.now()));
          afterSet(exerciseId, target.restTime ?? settings().defaultRestTime);
        },

        completeRemaining: (exerciseId) => {
          const exercise = get().activeSession?.exercises.find((e) => e.id === exerciseId);
          const last = exercise ? Session.remainingSets(exercise).pop() : undefined;
          if (!exercise || last === undefined) return;
          apply((s) => Session.completeRemaining(s, exerciseId, Date.now()));
          afterSet(exerciseId, exercise.sets[last]?.restTime ?? settings().defaultRestTime);
        },

        undoLastSet: () => {
          clearRestEndTimeout();
          void cancelRestCompleteNotification();
          apply(Session.undoLastSet);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
        },

        replaceExercise: (exerciseId, next) => {
          const previous = currentId();
          apply((s) => Session.replaceExercise(s, exerciseId, next));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
          afterCurrentChanged(previous);
        },

        startRestTimer: (seconds) => {
          if (!get().activeSession) return;
          apply((s) => Session.startRest(s, seconds, Date.now()));
          const session = get().activeSession!;
          // Notification gérée par l'OS : elle sonne même app en arrière-plan
          void scheduleRestCompleteNotification(session.restDuration!, Session.nextSetSummary(session, formatKg));
          armRestEnd(session.restDuration! * 1000);
        },

        addRestTime: (seconds) => {
          const session = get().activeSession;
          if (session?.restEndsAt == null) return;
          get().startRestTimer(Session.restLeft(session, Date.now()) + seconds);
        },

        stopRestTimer: () => {
          clearRestEndTimeout();
          void cancelRestCompleteNotification();
          apply(Session.endRest);
        },
      };
    },
    {
      name: 'active-session',
      version: 2,
      // Les séances de l'ancienne interface n'ont pas la même forme : on les abandonne
      migrate: () => ({ activeSession: null }),
      storage: createJSONStorage(() => kvStorage),
      partialize: (s) => ({ activeSession: s.activeSession }),
    },
  ),
);

// Après un kill de l'app : on réarme la fin du repos, ou on l'efface si elle est passée
const restored = useSessionStore.getState().activeSession;
if (restored?.restEndsAt != null) {
  const left = restored.restEndsAt - Date.now();
  if (left > 0) armRestEnd(left);
  else useSessionStore.setState({ activeSession: Session.endRest(restored) });
}
