import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EXERCISES } from '@/domain/programs';
import { planLift, toActiveExercise } from '@/domain/sessionBuilder';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { SwapExercise } from '@/components/session/SwapExercise';
import type { UserProfile } from '@/types';

const profile: UserProfile = { goal: 'muscle', program: { split: 'ppl', perWeek: 3 }, prs: [], bodyStats: [] };
const ctx = { profile, settings: DEFAULT_SETTINGS, workouts: [] };

const names = () => useSessionStore.getState().activeSession!.exercises.map((e) => e.name);

async function openSwap() {
  const exercise = useSessionStore.getState().activeSession!.exercises[0]!;
  await render(<SwapExercise exercise={exercise} sessionName="Push" />);
  await fireEvent.press(screen.getByRole('button', { name: /Changer d'exercice/ }));
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

describe('SwapExercise', () => {
  it('suggests the same muscle first and swaps for today only', async () => {
    await openSwap();
    expect(screen.getByText('Même muscle · Pectoraux')).toBeOnTheScreen();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Choisir Écarté poulie' })[0]!);
    expect(names()).toEqual(['Écarté poulie', 'Développé militaire']);
    expect(useSettingsStore.getState().settings.customDays).toEqual({});
  });

  it('keeps the change for the next sessions when asked', async () => {
    await openSwap();
    await fireEvent.press(screen.getByRole('checkbox', { name: /Garder ce changement/ }));
    await fireEvent.press(screen.getAllByRole('button', { name: 'Choisir Dips' })[0]!);
    expect(useSettingsStore.getState().settings.customDays['ppl/Push']).toEqual([
      'Dips',
      'Développé militaire',
      'Développé incliné haltères',
      'Élévations latérales',
    ]);
  });

  it('creates an exercise and uses it right away', async () => {
    await openSwap();
    await fireEvent.press(screen.getByRole('button', { name: 'Créer un exercice' }));
    await fireEvent.press(screen.getByRole('button', { name: "Créer l'exercice" }));
    expect(screen.getByText('Donne un nom à ton exercice.')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText("Nom de l'exercice"), 'Écarté Panatta');
    await fireEvent.press(screen.getByRole('radio', { name: 'Machine' }));
    await fireEvent.press(screen.getByRole('button', { name: "Créer l'exercice" }));
    expect(useSettingsStore.getState().settings.customExercises).toEqual([
      { name: 'Écarté Panatta', equipment: 'machine', category: 'isolation', muscleGroups: ['chest'] },
    ]);
    expect(names()[0]).toBe('Écarté Panatta');
    expect(useSessionStore.getState().activeSession!.exercises[0]!.needsWeight).toBe(true);
  });
});
