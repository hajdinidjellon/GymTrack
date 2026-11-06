import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useSessionStore } from '@/stores/sessionStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { SessionDone } from '@/components/session/SessionDone';

const sets = () => useSessionStore.getState().activeSession!.exercises[0]!.sets;

beforeEach(() => {
  jest.useFakeTimers();
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, warmups: false, voice: false } });
  useSessionStore.getState().startSession('Push', [
    {
      id: 'curl',
      name: 'Curl',
      category: 'isolation',
      muscleGroups: ['biceps'],
      equipment: 'dumbbell',
      needsWeight: false,
      sets: [{ weight: 12, reps: 10, setType: 'normal', restTime: 60, completed: false }],
    },
  ]);
  useSessionStore.getState().completeSet('curl', 0);
});

describe('SessionDone', () => {
  it('asks how the last set felt, then saves on one tap', async () => {
    const onFinish = jest.fn();
    await render(<SessionDone onFinish={onFinish} />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Facile' }));
    expect(sets()[0]!.rpe).toBeDefined();
    await fireEvent.press(screen.getByRole('button', { name: 'Terminer la séance' }));
    expect(onFinish).toHaveBeenCalled();
  });

  it('offers RPE 6 to 10 by half points when "RPE précis" is on', async () => {
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, preciseRpe: true } });
    await render(<SessionDone onFinish={jest.fn()} />);
    expect(screen.queryByRole('radio', { name: 'Facile' })).toBeNull();
    await fireEvent.press(screen.getByRole('radio', { name: 'RPE 8,5' }));
    expect(sets()[0]!.rpe).toBe(8.5);
    expect(screen.getByRole('radio', { name: 'RPE 8,5' }).props.accessibilityState).toMatchObject({ checked: true });
  });

  it('takes back the last set, or adds one more', async () => {
    await render(<SessionDone onFinish={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: '+ Une série de plus' }));
    expect(sets()).toHaveLength(2);
    await fireEvent.press(screen.getByRole('button', { name: 'Annuler la dernière série' }));
    expect(sets()[0]!.completed).toBe(false);
  });
});
