import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { router } from 'expo-router';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { getContactEmail } from '@/services/recovery';
import { hasSession } from '@/services/supabase';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { RecoveryEmailPrompt } from '@/components/account/RecoveryEmailPrompt';
import type { Workout } from '@/types';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/services/recovery', () => ({ getContactEmail: jest.fn() }));
jest.mock('@/services/supabase', () => ({ hasSession: jest.fn() }));
jest.mock('@/services/sync', () => ({ queueSettingsSync: jest.fn(() => Promise.resolve()) }));

const sessions = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `w${i}`, date: '2026-11-01T18:00:00.000Z' }) as Workout);

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(hasSession).mockResolvedValue(true);
  jest.mocked(getContactEmail).mockResolvedValue(null);
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  useWorkoutStore.setState({ workouts: sessions(5) });
});

describe('RecoveryEmailPrompt', () => {
  it('asks an account without email, after the 5th session, to add one', async () => {
    await render(<RecoveryEmailPrompt />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Ajouter un email' }));
    expect(router.push).toHaveBeenCalledWith('/account');
    expect(useSettingsStore.getState().settings.recoveryPromptSeen).toBe(true);
  });

  it('goes away for good on "no thanks"', async () => {
    await render(<RecoveryEmailPrompt />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Non merci' }));
    expect(useSettingsStore.getState().settings.recoveryPromptSeen).toBe(true);
    expect(screen.queryByText('Et si tu oublies ton mot de passe ?')).toBeNull();
  });

  it('says nothing before the 5th session, or to an account with an email', async () => {
    useWorkoutStore.setState({ workouts: sessions(4) });
    await render(<RecoveryEmailPrompt />);
    expect(screen.queryByText('Et si tu oublies ton mot de passe ?')).toBeNull();
    expect(hasSession).not.toHaveBeenCalled();

    useWorkoutStore.setState({ workouts: sessions(5) });
    jest.mocked(getContactEmail).mockResolvedValue('me@mail.com');
    await render(<RecoveryEmailPrompt />);
    expect(screen.queryByText('Et si tu oublies ton mot de passe ?')).toBeNull();
  });
});
