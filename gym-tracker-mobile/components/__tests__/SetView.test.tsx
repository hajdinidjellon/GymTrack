import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { findCurrent } from '@/domain/sessionCursor';
import { useSessionStore } from '@/stores/sessionStore';
import { SetView } from '@/components/session/SetView';
import type { ActiveExercise } from '@/types';

const bench: ActiveExercise = {
  id: 'bench',
  name: 'Développé couché',
  category: 'compound',
  muscleGroups: ['chest'],
  equipment: 'barbell',
  needsWeight: false,
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
  jest.useFakeTimers();
  useSessionStore.getState().startSession('Push', [bench]);
});

describe('SetView', () => {
  it('shows the target and the plates', async () => {
    await renderCurrentSet();
    expect(screen.getByText('62,5')).toBeOnTheScreen();
    expect(screen.getByText('Par côté : 20 + 1,25')).toBeOnTheScreen();
  });

  it('validates the set in one tap', async () => {
    await renderCurrentSet();
    await fireEvent.press(screen.getByRole('button', { name: 'Valider la série' }));
    expect(sets()[0]!.completed).toBe(true);
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
});
