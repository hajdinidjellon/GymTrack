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

import { AppState } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { Storage } from 'expo-sqlite/kv-store';
import * as Haptics from 'expo-haptics';
import { effortOf, type Effort } from '@/domain/effort';
import type { VoiceCommand } from '@/domain/voiceCommands';
import * as Session from '@/domain/session';
import { formatKg } from '@/domain/plates';
import { findCurrent } from '@/domain/sessionCursor';
import { sessionEnd } from '@/domain/sessionTime';
import { nextExerciseLine, nextSetLine, restOverLine } from '@/domain/voiceLines';
import {
  cancelRestCompleteNotification,
  requestPermissions,
  scheduleRestCompleteNotification,
} from '@/services/notifications';
import { cancelRestAlarm, requestAlarmPermission, scheduleRestAlarm } from '@/services/alarmKit';
import { speak } from '@/services/speech';
import { playRestBell, startRestAlarm, stopRestAlarm } from '@/services/sound';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { t } from '@/i18n';
import type { ActiveExercise, ActiveSession, Workout, WorkoutSet } from '@/types';

type NudgeField = 'weight' | 'reps';

interface SessionStore {
  activeSession: ActiveSession | null;
  /** The rest is over and the alarm rings, app open: until a tap, or 30 s. Never persisted. */
  restAlarm: boolean;

  startSession: (name: string, exercises: ActiveExercise[]) => void;
  /**
   * Ends the session and returns what goes into the history. It ends now,
   * or at its last set when it was left open; `end` (epoch ms) sets it by hand.
   */
  finishSession: (end?: number) => Workout | null;
  /**
   * Saves what was done, and only then ends the session: if the save fails it throws and the
   * session stays, nothing is lost. Nothing done: nothing saved. Returns the saved session.
   */
  saveSession: (end?: number) => Promise<Workout | null>;
  /** Left open for hours: "Reprendre" keeps it, the question waits. */
  keepSessionOpen: () => void;
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
  /** How the last validated set felt; the same effort again clears it. */
  rateLastSet: (effort: Effort) => void;
  /** "RPE précis": the RPE of the set just validated, 6 to 10 by half points. */
  rateLastSetRpe: (rpe: number) => void;
  /** Takes back the last validated set and cancels its rest. */
  undoLastSet: () => void;
  /** Another exercise instead of this one; the sets already done stay. */
  replaceExercise: (exerciseId: string, next: ActiveExercise) => void;
  /** One more exercise, done last. */
  addExercise: (next: ActiveExercise) => void;
  /** This exercise right now (its machine just freed up). */
  doNow: (exerciseId: string) => void;
  /** This exercise at the end of the session (its machine is taken). */
  doLater: (exerciseId: string) => void;
  /** Drops the warm-ups left on this exercise. */
  skipWarmups: (exerciseId: string) => void;
  /** A lighter set right after this one, no rest in between. */
  addDropSet: (exerciseId: string, setIndex: number) => void;
  /** "Jusqu'à l'échec" on a working set, or back to normal. */
  toggleFailure: (exerciseId: string, setIndex: number) => void;
  /** A spoken command: validate, reps done, how it felt, later, end of rest. */
  voiceCommand: (command: VoiceCommand) => void;
  /** A held set just started (after the countdown): a tap in the hand, "C'est parti". */
  holdStarted: () => void;
  /** A held set is over: logs the seconds held and validates it. The bell when the target was reached. */
  finishHold: (exerciseId: string, setIndex: number, seconds: number, reached: boolean) => void;

  startRestTimer: (seconds: number) => void;
  addRestTime: (seconds: number) => void;
  stopRestTimer: () => void;
  /** "C'est reparti": stops the alarm, then the voice says the next set. */
  stopRestAlarm: () => void;
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const settings = () => useSettingsStore.getState().settings;

// Hors du state : un timeout n'a rien à faire dans un état sérialisable
let restEndTimeout: ReturnType<typeof setTimeout> | null = null;

let alarmTimeout: ReturnType<typeof setTimeout> | null = null;

function clearRestEndTimeout() {
  if (restEndTimeout) clearTimeout(restEndTimeout);
  restEndTimeout = null;
}

/** The phone left on the bench rings no longer than this. */
export const REST_ALARM_MAX_MS = 30_000;

/** Past this, a rest end the phone delivers late (app asleep) stays quiet: the notification already rang. */
const LATE_MS = 2000;

function armRestEnd(ms: number) {
  clearRestEndTimeout();
  const due = Date.now() + ms;
  restEndTimeout = setTimeout(() => {
    restEndTimeout = null;
    const late = Date.now() - due > LATE_MS;
    useSessionStore.setState((s) => ({ activeSession: s.activeSession && Session.endRest(s.activeSession) }));
    if (late || AppState.currentState !== 'active') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => null);
    ringRestAlarm();
  }, ms);
}

/**
 * App off screen (another app, phone locked) during a rest: its end becomes a
 * real alarm when the iPhone has AlarmKit, and the notification is dropped so
 * nothing rings twice. Back on screen, the app rings itself again.
 */
function syncOffScreenAlarm() {
  const session = useSessionStore.getState().activeSession;
  const at = session?.restEndsAt;
  const { restBell, notifications } = settings();
  if (AppState.currentState === 'active' || at == null || at <= Date.now() || !restBell || !notifications) {
    void cancelRestAlarm();
    return;
  }
  void scheduleRestAlarm(at).then((scheduled) => {
    if (scheduled && useSessionStore.getState().activeSession?.restEndsAt === at) void cancelRestCompleteNotification();
  });
}

/** Back on screen: no alarm left, and the notification again in case the app is left once more. */
function backOnScreen() {
  void cancelRestAlarm();
  const session = useSessionStore.getState().activeSession;
  const left = session ? Session.restLeft(session, Date.now()) : 0;
  if (!session || left <= 0) return;
  void scheduleRestCompleteNotification(left, Session.nextSetSummary(session, formatKg), settings().restBell);
}

/** "C'est reparti. Série 2. 60 kilos, 10 reps." */
function announceNext() {
  const session = useSessionStore.getState().activeSession;
  const next = session && findCurrent(session.exercises);
  if (!next || next.exercise.needsWeight || !settings().voice) return;
  speak(restOverLine(next));
}

/** Like a real timer: it vibrates, and rings with the bell on, until a tap. The voice speaks once it stops. */
function ringRestAlarm() {
  silenceRestAlarm(false);
  const { restBell } = settings();
  startRestAlarm(restBell);
  useSessionStore.setState({ restAlarm: true });
  alarmTimeout = setTimeout(() => silenceRestAlarm(true), REST_ALARM_MAX_MS);
  // Sans sonnerie, rien à couvrir : la voix parle tout de suite
  if (!restBell) announceNext();
}

/** `announce`: the voice says the next set (a tap on the alarm, or its 30 s are over). */
function silenceRestAlarm(announce: boolean) {
  if (alarmTimeout) clearTimeout(alarmTimeout);
  alarmTimeout = null;
  if (!useSessionStore.getState().restAlarm) return;
  stopRestAlarm();
  useSessionStore.setState({ restAlarm: false });
  if (announce && settings().restBell) announceNext();
}

/**
 * After a set: announce a new exercise early, so the bar can be loaded during
 * the rest. No rest (from one warm-up to the next): the next load right away.
 */
function afterSet(previousExerciseId: string, restSeconds: number) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
  const session = useSessionStore.getState().activeSession;
  if (!session || Session.isDone(session)) return;

  const { restTimerEnabled, voice } = settings();
  const rests = restSeconds > 0;
  if (restTimerEnabled && rests) useSessionStore.getState().startRestTimer(restSeconds);

  const next = findCurrent(session.exercises);
  if (!next || !voice) return;
  if (next.exercise.id !== previousExerciseId) speak(nextExerciseLine(next, settings()));
  else if (!rests) speak(nextSetLine(next, settings()));
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
  if (left > 0)
    void scheduleRestCompleteNotification(left, Session.nextSetSummary(session, formatKg), settings().restBell);
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
      const apply = (fn: (s: ActiveSession) => ActiveSession) => {
        // Toucher à la séance, c'est avoir entendu l'alarme
        silenceRestAlarm(false);
        set((state) => (state.activeSession ? { activeSession: fn(state.activeSession) } : state));
      };
      /** Same, then the warm-ups follow the new order or the new exercises. */
      const applyWarm = (fn: (s: ActiveSession) => ActiveSession) =>
        apply((s) => Session.refreshWarmups(fn(s), settings()));
      const currentId = () => findCurrent(get().activeSession?.exercises ?? [])?.exercise.id;
      /** The rest after a set: none when a superset partner goes next. */
      const restAfter = (exerciseId: string, planned: number | undefined) => {
        const session = get().activeSession;
        if (session && Session.supersetHandoff(session, exerciseId)) return 0;
        return planned ?? settings().defaultRestTime;
      };
      /** Applies a new order; a no-op stays silent. */
      const reorder = (fn: (s: ActiveSession) => ActiveSession) => {
        const before = get().activeSession;
        const previous = currentId();
        applyWarm(fn);
        if (get().activeSession === before) return;
        Haptics.selectionAsync().catch(() => null);
        afterCurrentChanged(previous);
      };

      return {
        activeSession: null,
        restAlarm: false,

        startSession: (name, exercises) => {
          clearRestEndTimeout();
          // Asked when it makes sense (the first session, for the end of the rest), not at the app's launch
          if (settings().notifications) {
            requestPermissions().catch(() => null);
            requestAlarmPermission().catch(() => null);
          }
          const session = Session.createSession(newId(), name, exercises, new Date());
          set({ activeSession: Session.refreshWarmups(session, settings()) });
        },

        finishSession: (end) => {
          const session = get().activeSession;
          if (!session) return null;
          get().stopRestTimer();
          set({ activeSession: null });
          return Session.toWorkout(session, new Date(end ?? sessionEnd(session, Date.now())));
        },

        saveSession: async (end) => {
          const session = get().activeSession;
          if (!session) return null;
          const endAt = end ?? sessionEnd(session, Date.now());
          const workout = Session.toWorkout(session, new Date(endAt));
          if (workout.exercises.length) await useWorkoutStore.getState().addWorkout(workout);
          // Still the same session once saved: it ends now
          if (get().activeSession?.workoutId === session.workoutId) get().finishSession(endAt);
          return workout.exercises.length ? workout : null;
        },

        keepSessionOpen: () => apply((s) => Session.keepOpen(s, Date.now())),

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
          applyWarm((s) => Session.setStartWeight(s, exerciseId, weight));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
          const next = findCurrent(get().activeSession?.exercises ?? []);
          if (next && settings().voice) speak(nextSetLine(next, settings()));
        },

        completeSet: (exerciseId, setIndex) => {
          const session = get().activeSession;
          const target = session && Session.findSet(session, exerciseId, setIndex);
          if (!target || target.completed) return;
          // Validated during a rest (the minimized bar): that rest is over
          if (session.restEndsAt != null) get().stopRestTimer();
          apply((s) => Session.completeSet(s, exerciseId, setIndex, Date.now()));
          afterSet(exerciseId, restAfter(exerciseId, target.restTime));
        },

        completeRemaining: (exerciseId) => {
          const exercise = get().activeSession?.exercises.find((e) => e.id === exerciseId);
          const last = exercise ? Session.remainingSets(exercise).pop() : undefined;
          if (!exercise || last === undefined) return;
          if (get().activeSession?.restEndsAt != null) get().stopRestTimer();
          apply((s) => Session.completeRemaining(s, exerciseId, Date.now()));
          afterSet(exerciseId, restAfter(exerciseId, exercise.sets[last]?.restTime));
        },

        rateLastSet: (effort) => {
          apply((s) => Session.rateLastSet(s, effort));
          Haptics.selectionAsync().catch(() => null);
        },

        rateLastSetRpe: (rpe) => {
          apply((s) => Session.rateLastSetRpe(s, rpe));
          Haptics.selectionAsync().catch(() => null);
        },

        undoLastSet: () => {
          clearRestEndTimeout();
          void cancelRestCompleteNotification();
          apply(Session.undoLastSet);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
        },

        replaceExercise: (exerciseId, next) => {
          const previous = currentId();
          applyWarm((s) => Session.replaceExercise(s, exerciseId, next));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
          afterCurrentChanged(previous);
        },

        addExercise: (next) => {
          applyWarm((s) => Session.addExercise(s, next));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
        },

        doNow: (exerciseId) => reorder((s) => Session.doNow(s, exerciseId)),

        doLater: (exerciseId) => reorder((s) => Session.doLater(s, exerciseId)),

        holdStarted: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null);
          if (settings().voice) speak(t('domain.voice.holdGo'));
        },

        finishHold: (exerciseId, setIndex, seconds, reached) => {
          if (reached && settings().restBell) playRestBell();
          get().updateSet(exerciseId, setIndex, { reps: seconds });
          get().completeSet(exerciseId, setIndex);
        },

        addDropSet: (exerciseId, setIndex) => {
          apply((s) => Session.addDropSet(s, exerciseId, setIndex));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
        },

        toggleFailure: (exerciseId, setIndex) => {
          apply((s) => Session.toggleFailure(s, exerciseId, setIndex));
          Haptics.selectionAsync().catch(() => null);
        },

        voiceCommand: (command) => {
          const session = get().activeSession;
          const current = session && findCurrent(session.exercises);
          if (!session) return;
          switch (command.kind) {
            case 'validate':
            case 'reps':
              // Still to calibrate: the weight has to be picked on screen first
              if (!current || current.exercise.needsWeight) return;
              get().stopRestTimer();
              if (command.kind === 'reps')
                get().updateSet(current.exercise.id, current.setIndex, { reps: command.reps });
              get().completeSet(current.exercise.id, current.setIndex);
              return;
            case 'effort': {
              // Said twice, it stays: the same tap twice would clear it
              const last = session.lastCompleted;
              const set = last && Session.findSet(session, last.exerciseId, last.setIndex);
              if (set?.completed && effortOf(set.rpe) !== command.effort) get().rateLastSet(command.effort);
              return;
            }
            case 'later':
              if (current) get().doLater(current.exercise.id);
              return;
            case 'skipRest':
              if (session.restEndsAt != null) get().stopRestTimer();
              return;
          }
        },

        skipWarmups: (exerciseId) => {
          apply((s) => Session.skipWarmups(s, exerciseId));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
          const next = findCurrent(get().activeSession?.exercises ?? []);
          if (next && settings().voice) speak(nextSetLine(next, settings()));
        },

        startRestTimer: (seconds) => {
          if (!get().activeSession) return;
          apply((s) => Session.startRest(s, seconds, Date.now()));
          const session = get().activeSession!;
          // Notification gérée par l'OS : elle sonne même app en arrière-plan
          void scheduleRestCompleteNotification(
            session.restDuration!,
            Session.nextSetSummary(session, formatKg),
            settings().restBell,
          );
          armRestEnd(session.restDuration! * 1000);
          // Validated from the lock screen, the app stays in the background: the alarm right away
          syncOffScreenAlarm();
        },

        addRestTime: (seconds) => {
          const session = get().activeSession;
          if (session?.restEndsAt == null) return;
          get().startRestTimer(Session.restLeft(session, Date.now()) + seconds);
        },

        stopRestTimer: () => {
          clearRestEndTimeout();
          void cancelRestCompleteNotification();
          void cancelRestAlarm();
          apply(Session.endRest);
        },

        stopRestAlarm: () => silenceRestAlarm(true),
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

// L'app quitte l'écran : l'alarme de l'app s'arrête (son et vibrations ne tournent pas en arrière-plan),
// celle d'AlarmKit prend le relais
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    backOnScreen();
    return;
  }
  silenceRestAlarm(false);
  syncOffScreenAlarm();
});
