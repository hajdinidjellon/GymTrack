import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { findCurrent } from '@/domain/sessionCursor';
import { useSessionStore } from '@/stores/sessionStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { SetView } from '@/components/session/SetView';
import type { ActiveExercise } from '@/types';

const bench: ActiveExercise = {
  id: 'bench',
  name: 'Développé couché',
  category: 'compound',
  muscleGroups: ['chest'],
  equipment: 'barbell',
  needsWeight: false,
  lastTime: '60 kg × 10 · 10 · 9',
  reason: 'Une rep de plus par série.',
  rule: { kind: 'double', sets: 2, repMin: 8, repMax: 12, increment: 2.5 },
  sets: [0, 1].map(() => ({
    weight: 62.5,
    reps: 10,
    setType: 'normal' as const,
    restTime: 90,
    completed: false,
    target: { weight: 62.5, reps: 10 },
  })),
};

function renderCurrentSet() {
  const cursor = findCurrent(useSessionStore.getState().activeSession!.exercises)!;
  return render(<SetView cursor={cursor} />);
}

const sets = () => useSessionStore.getState().activeSession!.exercises[0]!.sets;

beforeEach(() => {
  // Warm-ups off: these tests are about the working sets
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, warmups: false } });
  jest.useFakeTimers();
  useSessionStore.getState().startSession('Push', [bench]);
});

describe('SetView', () => {
  it('shows the target, the plates and the last session', async () => {
    await renderCurrentSet();
    expect(screen.getByText('Pourquoi 62,5 kg ?')).toBeOnTheScreen();
    expect(screen.getByText('Par côté : 20 + 1,25')).toBeOnTheScreen();
    expect(screen.getByText('60 kg × 10 · 10 · 9')).toBeOnTheScreen();
    expect(screen.getByText('Une rep de plus par série.')).toBeOnTheScreen();
  });

  it('validates the set in one tap', async () => {
    await renderCurrentSet();
    await fireEvent.press(screen.getByRole('button', { name: 'Valider la série' }));
    expect(sets()[0]!.completed).toBe(true);
  });

  it('lists every set and circles the current one', async () => {
    useSessionStore.getState().completeSet('bench', 0);
    useSessionStore.getState().stopRestTimer();
    await renderCurrentSet();
    expect(screen.getByLabelText('Série 1, 62,5 kilos, 10 reps, faite')).toBeOnTheScreen();
    expect(screen.getByLabelText('Série 2, 62,5 kilos, 10 reps, en cours')).toBeOnTheScreen();
  });

  it('shows the rest at the bottom of the same screen, instead of the validate button', async () => {
    const cursor = findCurrent(useSessionStore.getState().activeSession!.exercises)!;
    await render(<SetView cursor={cursor} footer={<Text>Repos</Text>} />);
    expect(screen.getByText('Repos')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Valider la série' })).toBeNull();
  });

  it('adjusts the weight by the exercise increment', async () => {
    await renderCurrentSet();
    await fireEvent.press(screen.getByRole('button', { name: 'Plus 2,5 kg' }));
    expect(sets()[0]!.weight).toBe(65);
  });

  it('completes every set as planned', async () => {
    await renderCurrentSet();
    await fireEvent.press(screen.getByRole('button', { name: 'Tout comme prévu · 2 séries' }));
    expect(sets().every((s) => s.completed)).toBe(true);
  });

  it('logs a missed set with the reps actually done', async () => {
    await renderCurrentSet();
    await fireEvent.press(screen.getByRole('button', { name: /Série ratée/ }));
    await fireEvent.press(screen.getByRole('radio', { name: '7 reps' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer 7 reps' }));
    expect(sets()[0]).toMatchObject({ reps: 7, completed: true });
  });

  it('takes the weight and the reps typed on the keyboard', async () => {
    await renderCurrentSet();
    await fireEvent.changeText(screen.getByLabelText('Charge en kilos'), '70,5');
    await fireEvent.changeText(screen.getByLabelText('Nombre de reps'), '8');
    expect(sets()[0]).toMatchObject({ weight: 70.5, reps: 8 });
  });

  it('ignores text that is not a number yet', async () => {
    await renderCurrentSet();
    await fireEvent.changeText(screen.getByLabelText('Charge en kilos'), '');
    expect(sets()[0]!.weight).toBe(62.5);
  });

  it('adds a set and removes one with a swipe', async () => {
    await renderCurrentSet();
    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter une série' }));
    expect(sets()).toHaveLength(3);
    // Dans l'app, l'écran parent relit la séance : ici on refait le rendu
    await renderCurrentSet();
    await fireEvent.press(screen.getByRole('button', { name: 'Supprimer la série 3' }));
    expect(sets()).toHaveLength(2);
  });

  it('says a plate-loaded machine is loaded per side', async () => {
    const press = { ...bench, id: 'press', name: 'Chest press', equipment: 'machine' as const, plateLoaded: true };
    useSessionStore.getState().startSession('Push', [press]);
    await renderCurrentSet();
    expect(screen.getByText('De chaque côté : 20 + 20 + 20 + 2,5')).toBeTruthy();
  });
});

describe('SetView with warm-ups', () => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
    useSessionStore.getState().startSession('Push', [bench]);
  });

  it('says it is a warm-up, explains the working weight, and offers to skip', async () => {
    await renderCurrentSet();
    expect(screen.getByText('Échauffement · ne compte pas dans tes stats')).toBeOnTheScreen();
    expect(screen.getByText('Pourquoi 62,5 kg ?')).toBeOnTheScreen();
    expect(screen.getAllByText('Éch.').length).toBeGreaterThan(0);
    expect(screen.queryByText('Série ratée ? Note les reps faites')).toBeNull();
    expect(screen.queryByText(/Tout comme prévu/)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: "Passer l'échauffement" }));
    expect(sets().every((s) => s.setType === 'normal')).toBe(true);
  });

  it('numbers the working sets from 1, after the warm-ups', async () => {
    await renderCurrentSet();
    expect(screen.getByLabelText('Série 1, 62,5 kilos, 10 reps, à venir')).toBeOnTheScreen();
    expect(screen.getByLabelText('Échauffement, 20 kilos, 10 reps, en cours')).toBeOnTheScreen();
  });
});

describe('SetView on a held set', () => {
  const plank: ActiveExercise = {
    id: 'plank',
    name: 'Gainage',
    category: 'isolation',
    muscleGroups: ['core'],
    equipment: 'bodyweight',
    needsWeight: false,
    timed: true,
    rule: { kind: 'double', sets: 2, repMin: 30, repMax: 60, increment: 2.5, repStep: 5 },
    sets: [0, 1].map(() => ({ weight: 0, reps: 45, setType: 'normal' as const, restTime: 60, completed: false })),
  };

  beforeEach(() => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, voice: false } });
    useSessionStore.getState().startSession('Abdos', [plank]);
  });

  it('counts in seconds, 5 by 5, with no missed-reps link', async () => {
    await renderCurrentSet();
    expect(screen.getByText('SEC')).toBeOnTheScreen();
    expect(screen.queryByText('Série ratée ? Note les reps faites')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Plus 5 secondes' }));
    expect(sets()[0]!.reps).toBe(50);
  });

  it('runs the countdown, then the hold, and validates by itself at the end', async () => {
    await renderCurrentSet();
    await fireEvent.press(screen.getByRole('button', { name: 'Lancer · 45 s' }));
    expect(screen.getByText('Mets-toi en position')).toBeOnTheScreen();
    await act(() => jest.advanceTimersByTime(3200));
    expect(screen.getByText('Tiens bon')).toBeOnTheScreen();
    await act(() => jest.advanceTimersByTime(45_000));
    expect(sets()[0]).toMatchObject({ reps: 45, completed: true });
  });

  it('logs what was held when stopped, and cancels during the countdown', async () => {
    await renderCurrentSet();
    await fireEvent.press(screen.getByRole('button', { name: 'Lancer · 45 s' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Annuler' }));
    expect(sets()[0]!.completed).toBe(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Lancer · 45 s' }));
    await act(() => jest.advanceTimersByTime(3000 + 20_400));
    await fireEvent.press(screen.getByRole('button', { name: 'Stop' }));
    expect(sets()[0]).toMatchObject({ reps: 20, completed: true });
  });

  it('can be logged without the timer', async () => {
    await renderCurrentSet();
    await fireEvent.press(screen.getByRole('button', { name: 'Valider sans chrono' }));
    expect(sets()[0]).toMatchObject({ reps: 45, completed: true });
  });
});
