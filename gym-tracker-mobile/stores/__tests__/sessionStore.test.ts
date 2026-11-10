import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AppState } from 'react-native';
import * as Speech from 'expo-speech';
import {
  cancelRestCompleteNotification,
  requestPermissions,
  scheduleRestCompleteNotification,
} from '@/services/notifications';
import { playRestBell, startRestAlarm, stopRestAlarm } from '@/services/sound';
import { REST_ALARM_MAX_MS, useSessionStore } from '@/stores/sessionStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import type { ActiveExercise } from '@/types';

function exercise(id: string, sets: number, patch: Partial<ActiveExercise> = {}): ActiveExercise {
  return {
    id,
    name: id,
    category: 'compound',
    muscleGroups: ['chest'],
    equipment: 'barbell',
    needsWeight: false,
    sets: Array.from({ length: sets }, () => ({
      weight: 60,
      reps: 10,
      setType: 'normal' as const,
      restTime: 120,
      completed: false,
    })),
    ...patch,
  };
}

// Warm-ups have their own tests below: off here, so set indexes stay simple
const BASE = { ...DEFAULT_SETTINGS, warmups: false };

const store = () => useSessionStore.getState();

// Registered once, when the store loads: captured before beforeEach clears the mocks
const appStateChange = (
  jest.isMockFunction(AppState.addEventListener)
    ? jest.mocked(AppState.addEventListener).mock.calls.find(([type]) => type === 'change')?.[1]
    : undefined
) as ((state: string) => void) | undefined;
const session = () => store().activeSession!;

beforeEach(() => {
  jest.useFakeTimers();
  // L'app à l'écran : la fin du repos sonne dans l'app
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  jest.clearAllMocks();
  useSettingsStore.setState({ settings: { ...BASE } });
  store().startSession('Push', [exercise('bench', 2), exercise('ohp', 1)]);
});

afterEach(() => {
  store().discardSession();
  jest.useRealTimers();
});

describe('sets', () => {
  it('validates a set and starts the rest with its own duration', () => {
    store().completeSet('bench', 0);
    expect(session().exercises[0]!.sets[0]!.completed).toBe(true);
    expect(session().restDuration).toBe(120);
    expect(scheduleRestCompleteNotification).toHaveBeenCalledWith(120, 'bench · 60 kg × 10', true);
  });

  it('ignores a set validated twice', () => {
    store().completeSet('bench', 0);
    store().stopRestTimer();
    store().completeSet('bench', 0);
    expect(session().restEndsAt).toBeNull();
  });

  it('does not rest when the timer is turned off', () => {
    useSettingsStore.setState({ settings: { ...BASE, restTimerEnabled: false } });
    store().completeSet('bench', 0);
    expect(session().restEndsAt).toBeNull();
  });

  it('nudges weight and reps, never below zero', () => {
    store().nudgeSet('bench', 0, 'weight', 2.5);
    store().nudgeSet('bench', 0, 'reps', -11);
    expect(session().exercises[0]!.sets[0]).toMatchObject({ weight: 62.5, reps: 0 });
  });

  it('announces the next exercise once the current one is finished', () => {
    store().completeRemaining('bench');
    expect(Speech.speak).toHaveBeenCalledWith(expect.stringContaining('Prochain exercice : ohp'), expect.anything());
  });

  it('stays quiet when the voice is off', () => {
    useSettingsStore.setState({ settings: { ...BASE, voice: false } });
    store().completeRemaining('bench');
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('does not rest after the very last set', () => {
    store().completeRemaining('bench');
    store().stopRestTimer();
    store().completeSet('ohp', 0);
    expect(session().restEndsAt).toBeNull();
  });

  it('sets the start weight of a new exercise and says the first set', () => {
    store().startSession('Pull', [exercise('row', 2, { needsWeight: true })]);
    store().setStartWeight('row', 40);
    expect(session().exercises[0]).toMatchObject({ needsWeight: false });
    expect(session().exercises[0]!.sets[1]).toMatchObject({ weight: 40, target: { weight: 40, reps: 10 } });
    expect(Speech.speak).toHaveBeenCalledWith('Mets 10 de chaque côté. Série 1. 40 kilos, 10 reps.', expect.anything());
  });
});

describe('adding and removing sets', () => {
  it('adds a set, then removes it with a haptic', () => {
    store().addSet('bench');
    expect(session().exercises[0]!.sets).toHaveLength(3);
    store().removeSet('bench', 2);
    expect(session().exercises[0]!.sets).toHaveLength(2);
  });

  it('never removes the only set of an exercise', () => {
    store().removeSet('ohp', 0);
    expect(session().exercises[1]!.sets).toHaveLength(1);
  });
});

describe('rest timer', () => {
  it('ends by itself and rings until a tap, then says the next set', () => {
    store().completeSet('bench', 0);
    jest.advanceTimersByTime(120_000);
    expect(session().restEndsAt).toBeNull();
    expect(startRestAlarm).toHaveBeenCalledWith(true);
    expect(store().restAlarm).toBe(true);
    // La voix attend qu'on coupe l'alarme
    jest.advanceTimersByTime(10_000);
    expect(Speech.speak).not.toHaveBeenCalledWith(expect.stringContaining("C'est reparti"), expect.anything());
    store().stopRestAlarm();
    expect(stopRestAlarm).toHaveBeenCalled();
    expect(store().restAlarm).toBe(false);
    expect(Speech.speak).toHaveBeenLastCalledWith("C'est reparti. Série 2. 60 kilos, 10 reps.", expect.anything());
  });

  it('stops ringing by itself after 30 s, the phone left on the bench', () => {
    store().completeSet('bench', 0);
    jest.advanceTimersByTime(120_000 + REST_ALARM_MAX_MS);
    expect(store().restAlarm).toBe(false);
    expect(stopRestAlarm).toHaveBeenCalledTimes(1);
    expect(Speech.speak).toHaveBeenLastCalledWith("C'est reparti. Série 2. 60 kilos, 10 reps.", expect.anything());
  });

  it('stops ringing as soon as the session is touched, without talking', () => {
    store().completeSet('bench', 0);
    jest.advanceTimersByTime(120_000);
    jest.mocked(Speech.speak).mockClear();
    store().nudgeSet('bench', 1, 'weight', 2.5);
    expect(store().restAlarm).toBe(false);
    expect(stopRestAlarm).toHaveBeenCalled();
    jest.advanceTimersByTime(REST_ALARM_MAX_MS);
    expect(Speech.speak).not.toHaveBeenCalledWith(expect.stringContaining("C'est reparti"), expect.anything());
  });

  it('stops ringing when the app leaves the screen', () => {
    expect(appStateChange).toBeDefined();
    store().completeSet('bench', 0);
    jest.advanceTimersByTime(120_000);
    appStateChange!('active');
    expect(store().restAlarm).toBe(true);
    appStateChange!('background');
    expect(store().restAlarm).toBe(false);
    expect(stopRestAlarm).toHaveBeenCalled();
  });

  it('leaves the end of the rest to the notification when the app is not on screen', () => {
    store().completeSet('bench', 0);
    Object.defineProperty(AppState, 'currentState', { value: 'background', configurable: true });
    jest.advanceTimersByTime(120_000);
    expect(startRestAlarm).not.toHaveBeenCalled();
    expect(store().restAlarm).toBe(false);
  });

  it('only vibrates with the bell off, and the voice speaks right away', () => {
    useSettingsStore.setState({ settings: { ...BASE, restBell: false } });
    store().completeSet('bench', 0);
    expect(scheduleRestCompleteNotification).toHaveBeenLastCalledWith(120, 'bench · 60 kg × 10', false);
    jest.advanceTimersByTime(120_000);
    expect(startRestAlarm).toHaveBeenCalledWith(false);
    expect(playRestBell).not.toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenLastCalledWith("C'est reparti. Série 2. 60 kilos, 10 reps.", expect.anything());
    // Pas une deuxième fois quand on coupe
    jest.mocked(Speech.speak).mockClear();
    store().stopRestAlarm();
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('adds time to the current rest', () => {
    store().completeSet('bench', 0);
    jest.advanceTimersByTime(30_000);
    store().addRestTime(30);
    expect(session().restDuration).toBe(120);
  });

  it('can be skipped', () => {
    store().completeSet('bench', 0);
    store().stopRestTimer();
    expect(session().restEndsAt).toBeNull();
    expect(cancelRestCompleteNotification).toHaveBeenCalled();
  });
});

describe('undo', () => {
  it('takes back a set validated by mistake and cancels its rest', () => {
    store().completeSet('bench', 0);
    store().undoLastSet();
    expect(session().exercises[0]!.sets[0]!.completed).toBe(false);
    expect(session().restEndsAt).toBeNull();
    jest.advanceTimersByTime(200_000);
    expect(Speech.speak).not.toHaveBeenCalledWith(expect.stringContaining("C'est reparti"), expect.anything());
  });
});

describe('end of session', () => {
  it('returns the workout with only what was done', () => {
    store().completeSet('bench', 0);
    const workout = store().finishSession();
    expect(workout?.exercises.map((e) => e.name)).toEqual(['bench']);
    expect(store().activeSession).toBeNull();
  });

  it('returns nothing when no session is running', () => {
    store().discardSession();
    expect(store().finishSession()).toBeNull();
  });

  it('ends a session left open at its last set, not hours later', () => {
    const started = Date.parse(session().startedAt);
    jest.setSystemTime(started + 40 * 60_000);
    store().completeSet('bench', 0);
    jest.setSystemTime(started + 5 * 3600_000);
    const workout = store().finishSession();
    expect(workout?.duration).toBe(40);
    // The validation time is kept for the timeline
    expect(workout?.exercises[0]!.sets[0]!.doneAt).toBe(started + 40 * 60_000);
  });

  it('ends at the time asked, and keeps a session open on purpose', () => {
    const started = Date.parse(session().startedAt);
    store().completeSet('bench', 0);
    jest.setSystemTime(started + 3 * 3600_000);
    store().keepSessionOpen();
    expect(session().keptOpenAt).toBe(started + 3 * 3600_000);
    expect(store().finishSession(started + 25 * 60_000)?.duration).toBe(25);
  });
});

describe('saving the session', () => {
  it('saves first, then ends the session', async () => {
    const addWorkout = jest.spyOn(useWorkoutStore.getState(), 'addWorkout').mockResolvedValue();
    store().completeSet('bench', 0);
    const workout = await store().saveSession();
    expect(addWorkout).toHaveBeenCalledWith(workout!);
    expect(workout?.exercises.map((e) => e.name)).toEqual(['bench']);
    expect(store().activeSession).toBeNull();
    addWorkout.mockRestore();
  });

  it('keeps the session when the save fails: nothing is lost', async () => {
    const addWorkout = jest.spyOn(useWorkoutStore.getState(), 'addWorkout').mockRejectedValue(new Error('disk full'));
    store().completeSet('bench', 0);
    await expect(store().saveSession()).rejects.toThrow('disk full');
    expect(session().exercises[0]!.sets[0]!.completed).toBe(true);
    addWorkout.mockRestore();
  });

  it('saves nothing when nothing was done, and ends the session', async () => {
    const addWorkout = jest.spyOn(useWorkoutStore.getState(), 'addWorkout').mockResolvedValue();
    expect(await store().saveSession()).toBeNull();
    expect(addWorkout).not.toHaveBeenCalled();
    expect(store().activeSession).toBeNull();
    addWorkout.mockRestore();
  });
});

describe('swapping an exercise', () => {
  it('puts the new one in place and announces it', () => {
    store().replaceExercise('bench', exercise('row', 3));
    expect(session().exercises.map((e) => e.id)).toEqual(['row', 'ohp']);
    expect(Speech.speak).toHaveBeenCalledWith(expect.stringContaining('row'), expect.anything());
  });

  it('stays quiet during a rest, and on an exercise that is not next', () => {
    store().completeSet('bench', 0);
    jest.clearAllMocks();
    store().replaceExercise('ohp', exercise('row', 3));
    store().replaceExercise('bench', exercise('dips', 1));
    expect(session().exercises.map((e) => e.id)).toEqual(['bench', 'dips', 'row']);
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('names the new exercise in the rest notification', () => {
    store().completeSet('bench', 0);
    jest.advanceTimersByTime(20_000);
    jest.clearAllMocks();
    store().replaceExercise('bench', exercise('dips', 1));
    expect(scheduleRestCompleteNotification).toHaveBeenCalledWith(100, 'dips · 60 kg × 10', true);
  });

  it('leaves the rest notification alone when the next exercise stays the same', () => {
    store().completeSet('bench', 0);
    jest.clearAllMocks();
    store().replaceExercise('ohp', exercise('row', 3));
    expect(scheduleRestCompleteNotification).not.toHaveBeenCalled();
  });

  it('dates each validation', () => {
    jest.setSystemTime(new Date('2026-10-20T18:00:00Z'));
    store().completeSet('bench', 0);
    expect(session().exercises[0]!.sets[0]!.doneAt).toBe(new Date('2026-10-20T18:00:00Z').getTime());
  });
});

describe('changing the order', () => {
  const ids = () => session().exercises.map((e) => e.id);

  it('does an exercise now and announces it', () => {
    store().doNow('ohp');
    expect(ids()).toEqual(['ohp', 'bench']);
    expect(Speech.speak).toHaveBeenCalledWith(expect.stringContaining('Prochain exercice : ohp'), expect.anything());
  });

  it('keeps an exercise for later and announces the next one', () => {
    store().doLater('bench');
    expect(ids()).toEqual(['ohp', 'bench']);
    expect(Speech.speak).toHaveBeenCalledWith(expect.stringContaining('Prochain exercice : ohp'), expect.anything());
  });

  it('names the new exercise in the rest notification instead of speaking', () => {
    store().completeSet('bench', 0);
    jest.clearAllMocks();
    store().doNow('ohp');
    expect(scheduleRestCompleteNotification).toHaveBeenCalledWith(120, 'ohp · 60 kg × 10', true);
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('does nothing, silently, when the order cannot change', () => {
    store().doLater('ohp');
    store().doNow('bench');
    expect(ids()).toEqual(['bench', 'ohp']);
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('does nothing without a running session', () => {
    store().discardSession();
    store().doNow('ohp');
    expect(store().activeSession).toBeNull();
  });
});

describe('rating a set', () => {
  it('stores how the last set felt', () => {
    store().completeSet('bench', 0);
    store().rateLastSet('easy');
    expect(session().exercises[0]!.sets[0]!.rpe).toBe(6);
  });

  it('keeps the rating in the saved workout', () => {
    store().completeSet('bench', 0);
    store().rateLastSet('max');
    expect(store().finishSession()!.exercises[0]!.sets[0]!.rpe).toBe(10);
  });
});

describe('warm-ups', () => {
  beforeEach(() => {
    store().discardSession();
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
    store().startSession('Push', [
      exercise('bench', 2, { sets: exercise('x', 2).sets.map((x) => ({ ...x, weight: 100 })) }),
    ]);
  });

  it('starts the session with the warm-ups first', () => {
    expect(session().exercises[0]!.sets.map((x) => x.weight)).toEqual([20, 40, 60, 80, 100, 100]);
  });

  it('goes straight to the next warm-up and says what to load', () => {
    store().completeSet('bench', 0);
    expect(session().restEndsAt).toBeNull();
    expect(Speech.speak).toHaveBeenCalledWith(
      'Mets 10 de chaque côté. Échauffement 2. 40 kilos, 5 reps.',
      expect.anything(),
    );
  });

  it('rests before the working sets', () => {
    for (let i = 0; i < 4; i++) store().completeSet('bench', i);
    expect(session().restDuration).toBe(90);
  });

  it('skips the warm-ups left and announces the first working set', () => {
    store().skipWarmups('bench');
    expect(session().exercises[0]!.sets.map((x) => x.weight)).toEqual([100, 100]);
    expect(Speech.speak).toHaveBeenLastCalledWith(
      'Mets 20 et 20 de chaque côté. Série 1. 100 kilos, 10 reps.',
      expect.anything(),
    );
  });

  it('computes them once the start weight is picked', () => {
    store().discardSession();
    store().startSession('Push', [exercise('row', 1, { needsWeight: true })]);
    expect(session().exercises[0]!.sets).toHaveLength(1);
    store().setStartWeight('row', 80);
    expect(session().exercises[0]!.sets.map((x) => x.weight)).toEqual([20, 30, 47.5, 62.5, 80]);
  });
});

describe('held sets', () => {
  beforeEach(() => {
    store().discardSession();
    store().startSession('Abdos', [exercise('plank', 2, { equipment: 'bodyweight', timed: true })]);
  });

  it('cues the start of the hold', () => {
    store().holdStarted();
    expect(Speech.speak).toHaveBeenCalledWith("C'est parti.", expect.anything());
  });

  it('logs the seconds held, rings when the target is reached, then rests', () => {
    store().finishHold('plank', 0, 60, true);
    expect(session().exercises[0]!.sets[0]).toMatchObject({ reps: 60, completed: true });
    expect(playRestBell).toHaveBeenCalled();
    expect(session().restEndsAt).not.toBeNull();
  });

  it('logs a hold stopped early without the bell', () => {
    store().finishHold('plank', 0, 22, false);
    expect(session().exercises[0]!.sets[0]!.reps).toBe(22);
    expect(playRestBell).not.toHaveBeenCalled();
  });
});

describe('supersets and drop sets', () => {
  beforeEach(() => {
    store().discardSession();
    store().startSession('Push', [
      exercise('bench', 2, { superset: 'bench' }),
      exercise('row', 2, { superset: 'bench', muscleGroups: ['back'] }),
    ]);
  });

  it('goes to the partner without resting, then rests after the round', () => {
    store().completeSet('bench', 0);
    expect(session().restEndsAt).toBeNull();
    expect(Speech.speak).toHaveBeenCalledWith(expect.stringContaining('Prochain exercice : row'), expect.anything());
    store().completeSet('row', 0);
    expect(session().restDuration).toBe(120);
  });

  it('adds a drop set and marks a set to failure', () => {
    store().addDropSet('bench', 0);
    expect(session().exercises[0]!.sets[1]).toMatchObject({ setType: 'drop', weight: 47.5 });
    store().toggleFailure('bench', 0);
    expect(session().exercises[0]!.sets[0]!.setType).toBe('failure');
  });
});

describe('voice commands', () => {
  it('validates the current set, with the reps said', () => {
    store().voiceCommand({ kind: 'reps', reps: 7 });
    expect(session().exercises[0]!.sets[0]).toMatchObject({ reps: 7, completed: true });
    store().voiceCommand({ kind: 'validate' });
    expect(session().exercises[0]!.sets[1]!.completed).toBe(true);
    expect(session().restEndsAt).not.toBeNull();
  });

  it('rates the last set once, even said twice', () => {
    store().completeSet('bench', 0);
    store().voiceCommand({ kind: 'effort', effort: 'easy' });
    store().voiceCommand({ kind: 'effort', effort: 'easy' });
    expect(session().exercises[0]!.sets[0]!.rpe).toBeDefined();
  });

  it('ends the rest, and sends the exercise to the end', () => {
    store().completeSet('bench', 0);
    store().voiceCommand({ kind: 'skipRest' });
    expect(session().restEndsAt).toBeNull();
    store().voiceCommand({ kind: 'skipRest' });
    store().voiceCommand({ kind: 'later' });
    expect(session().exercises.map((e) => e.id)).toEqual(['ohp', 'bench']);
  });

  it('does nothing before a weight is picked, nor without a session', () => {
    store().discardSession();
    store().voiceCommand({ kind: 'validate' });
    store().startSession('Push', [exercise('row', 1, { needsWeight: true })]);
    store().voiceCommand({ kind: 'validate' });
    store().voiceCommand({ kind: 'effort', effort: 'max' });
    expect(session().exercises[0]!.sets[0]!.completed).toBe(false);
  });
});

describe('a rest that ends while the phone sleeps', () => {
  it('stays quiet when the app wakes up late: the notification already rang', () => {
    store().completeSet('bench', 0);
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now + 120_000 + 10_000);
    jest.advanceTimersByTime(120_000);
    expect(startRestAlarm).not.toHaveBeenCalled();
    expect(session().restEndsAt).toBeNull();
    clock.mockRestore();
  });

  it('ends the rest when the next set is validated from the minimized bar', () => {
    store().completeSet('bench', 0);
    store().completeSet('bench', 1);
    expect(cancelRestCompleteNotification).toHaveBeenCalled();
  });
});

describe('notification permission', () => {
  it('is asked when a session starts, not when the app opens', () => {
    expect(requestPermissions).toHaveBeenCalled();
  });
});
