import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EXERCISES } from '@/domain/programs';
import { planLift, toActiveExercise } from '@/domain/sessionBuilder';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { AddExercise } from '@/components/session/AddExercise';
import type { UserProfile } from '@/types';

const profile: UserProfile = { goal: 'muscle', program: { split: 'ppl', perWeek: 3 }, prs: [], bodyStats: [] };
const ctx = { profile, settings: DEFAULT_SETTINGS, workouts: [] };

const names = () => useSessionStore.getState().activeSession!.exercises.map((e) => e.name);

async function openAdd() {
  const current = useSessionStore.getState().activeSession!.exercises[0]!;
  await render(<AddExercise current={current} sessionName="Push" />);
  await fireEvent.press(screen.getByRole('button', { name: 'Ajouter un exercice à la séance' }));
}

beforeEach(() => {
  jest.useFakeTimers();
  useProfileStore.setState({ profile });
  useWorkoutStore.setState({ workouts: [] });
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, voice: false } });
  useSessionStore.getState().startSession(
    'Push',
    [EXERCISES.bench, EXERCISES.ohp].map((def, i) => toActiveExercise(planLift(def, ctx), i)),
  );
});

describe('AddExercise', () => {
  it('adds an exercise at the end of today only', async () => {
    await openAdd();
    expect(screen.getByText('Même muscle')).toBeOnTheScreen();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Choisir Écarté poulie' })[0]!);
    expect(names()).toEqual(['Développé couché', 'Développé militaire', 'Écarté poulie']);
    expect(useSettingsStore.getState().settings.customDays).toEqual({});
  });

  it('keeps it in the next sessions when asked', async () => {
    await openAdd();
    await fireEvent.press(screen.getByRole('checkbox', { name: /L'ajouter aussi/ }));
    await fireEvent.press(screen.getAllByRole('button', { name: 'Choisir Écarté poulie' })[0]!);
    expect(useSettingsStore.getState().settings.customDays['ppl/Push']).toContain('Écarté poulie');
  });
});
