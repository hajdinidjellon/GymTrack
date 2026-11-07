import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { AppState } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setLocale } from '@/i18n';
import { stopRestAlarm } from '@/services/sound';
import { useSessionStore } from '@/stores/sessionStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { RestAlarm } from '@/components/session/RestAlarm';
import type { ActiveExercise } from '@/types';

const squat = (needsWeight = false): ActiveExercise => ({
  id: 'squat',
  name: 'Squat',
  category: 'compound',
  muscleGroups: ['legs'],
  equipment: 'barbell',
  needsWeight,
  sets: [0, 1].map(() => ({ weight: 80, reps: 5, setType: 'normal' as const, restTime: 90, completed: false })),
});

function ringAfterFirstSet(exercise = squat()) {
  useSessionStore.getState().startSession('Jambes', [exercise]);
  useSessionStore.getState().completeSet('squat', 0);
  jest.advanceTimersByTime(90_000);
}

beforeEach(() => {
  setLocale('fr');
  // L'app à l'écran : la fin du repos sonne dans l'app
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  jest.useFakeTimers();
  jest.clearAllMocks();
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, warmups: false } });
});

afterEach(() => {
  useSessionStore.getState().discardSession();
  jest.useRealTimers();
});

describe('RestAlarm', () => {
  it('shows nothing while nothing rings', async () => {
    await render(<RestAlarm />);
    expect(screen.queryByText('Repos terminé !')).toBeNull();
  });

  it('shows the next set while it rings, and a tap stops it', async () => {
    ringAfterFirstSet();
    await render(<RestAlarm />);
    expect(screen.getByText('Repos terminé !')).toBeTruthy();
    expect(screen.getByText('Squat')).toBeTruthy();
    expect(screen.getByText('80 kg × 5')).toBeTruthy();
    await fireEvent.press(screen.getByText("C'est reparti"));
    expect(stopRestAlarm).toHaveBeenCalled();
    expect(useSessionStore.getState().restAlarm).toBe(false);
    expect(screen.queryByText('Repos terminé !')).toBeNull();
  });

  it('stops with a tap anywhere on the screen', async () => {
    ringAfterFirstSet();
    await render(<RestAlarm />);
    await fireEvent.press(screen.getByLabelText("Repos terminé ! Arrêter l'alarme de fin du repos"));
    expect(useSessionStore.getState().restAlarm).toBe(false);
  });

  it('says the weight is still to set on a first time', async () => {
    useSessionStore.getState().startSession('Jambes', [squat(), { ...squat(true), id: 'lunge', name: 'Fentes' }]);
    useSessionStore.getState().completeSet('squat', 0);
    useSessionStore.getState().completeSet('squat', 1);
    jest.advanceTimersByTime(90_000);
    await render(<RestAlarm />);
    expect(screen.getByText('Charge à régler')).toBeTruthy();
  });
});
