import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Speech from 'expo-speech';
import { cancelRestCompleteNotification, scheduleRestCompleteNotification } from '@/services/notifications';
import { useSessionStore } from '@/stores/sessionStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
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

const store = () => useSessionStore.getState();
const session = () => store().activeSession!;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
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
    expect(scheduleRestCompleteNotification).toHaveBeenCalledWith(120, 'bench · 60 kg × 10');
  });

  it('ignores a set validated twice', () => {
    store().completeSet('bench', 0);
    store().stopRestTimer();
    store().completeSet('bench', 0);
    expect(session().restEndsAt).toBeNull();
  });

  it('does not rest when the timer is turned off', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, restTimerEnabled: false } });
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
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, voice: false } });
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
    expect(Speech.speak).toHaveBeenCalledWith('Série 1. 40 kilos, 10 reps.', expect.anything());
  });
});

describe('rest timer', () => {
  it('ends by itself and says the next set', () => {
    store().completeSet('bench', 0);
    jest.advanceTimersByTime(120_000);
    expect(session().restEndsAt).toBeNull();
    expect(Speech.speak).toHaveBeenLastCalledWith("C'est reparti. Série 2. 60 kilos, 10 reps.", expect.anything());
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
});
