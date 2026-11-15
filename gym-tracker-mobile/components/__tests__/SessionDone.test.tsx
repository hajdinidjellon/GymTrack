import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useSessionStore } from '@/stores/sessionStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { SessionDone } from '@/components/session/SessionDone';
import { getSplit } from '@/domain/programs';
import { planLift, toActiveExercise } from '@/domain/sessionBuilder';
import { useProfileStore } from '@/stores/profileStore';
import type { UserProfile } from '@/types';

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

  describe('a session done differently', () => {
    const profile: UserProfile = { goal: 'muscle', program: { split: 'ppl', perWeek: 3 }, prs: [], bodyStats: [] };
    const push = getSplit('ppl').days[0]!.exercises;
    const ctx = { profile, settings: DEFAULT_SETTINGS, workouts: [] };
    const label = 'Garder ces changements pour ma séance Push';

    beforeEach(() => {
      useProfileStore.setState({ profile });
      useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, warmups: false, voice: false } });
      useSessionStore.getState().startSession(
        'Push',
        push.map((def, i) => toActiveExercise(planLift(def, ctx), i)),
      );
      // The second exercise done first
      useSessionStore.getState().doNow(useSessionStore.getState().activeSession!.exercises[1]!.id);
    });

    it('keeps the new order for the day when asked', async () => {
      const onFinish = jest.fn();
      await render(<SessionDone onFinish={onFinish} />);
      await fireEvent.press(screen.getByRole('checkbox', { name: label }));
      await fireEvent.press(screen.getByRole('button', { name: 'Terminer la séance' }));
      const names = push.map((e) => e.name);
      expect(useSettingsStore.getState().settings.customDays['ppl/Push']).toEqual([
        names[1],
        names[0],
        ...names.slice(2),
      ]);
      expect(onFinish).toHaveBeenCalled();
    });

    it('changes nothing unless asked', async () => {
      await render(<SessionDone onFinish={jest.fn()} />);
      await fireEvent.press(screen.getByRole('button', { name: 'Terminer la séance' }));
      expect(useSettingsStore.getState().settings.customDays['ppl/Push']).toBeUndefined();
    });

    it('offers nothing when the session followed the day', async () => {
      useSessionStore.getState().doNow(useSessionStore.getState().activeSession!.exercises[1]!.id);
      await render(<SessionDone onFinish={jest.fn()} />);
      expect(screen.queryByRole('checkbox', { name: label })).toBeNull();
    });
  });
});
