import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Speech from 'expo-speech';
import { cancelRestCompleteNotification, scheduleRestCompleteNotification } from '@/services/notifications';
import { playRestBell } from '@/services/sound';
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

// Warm-ups have their own tests below: off here, so set indexes stay simple
const BASE = { ...DEFAULT_SETTINGS, warmups: false };

const store = () => useSessionStore.getState();
const session = () => store().activeSession!;

beforeEach(() => {
  jest.useFakeTimers();
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
  it('ends by itself, rings, then says the next set', () => {
    store().completeSet('bench', 0);
    jest.advanceTimersByTime(120_000);
    expect(session().restEndsAt).toBeNull();
    expect(playRestBell).toHaveBeenCalledTimes(1);
    // La voix attend la fin de la cloche
    expect(Speech.speak).not.toHaveBeenCalledWith(expect.stringContaining("C'est reparti"), expect.anything());
    jest.advanceTimersByTime(900);
    expect(Speech.speak).toHaveBeenLastCalledWith("C'est reparti. Série 2. 60 kilos, 10 reps.", expect.anything());
  });

  it('stays silent with the bell off, and the notification too', () => {
    useSettingsStore.setState({ settings: { ...BASE, restBell: false } });
    store().completeSet('bench', 0);
    expect(scheduleRestCompleteNotification).toHaveBeenLastCalledWith(120, 'bench · 60 kg × 10', false);
    jest.advanceTimersByTime(120_000);
    expect(playRestBell).not.toHaveBeenCalled();
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
