import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useSessionStore } from '@/stores/sessionStore';
import { CalibrationView } from '@/components/session/CalibrationView';
import type { ActiveExercise } from '@/types';

function fresh(patch: Partial<ActiveExercise>): ActiveExercise {
  return {
    id: 'ex',
    name: 'Chest press',
    category: 'compound',
    muscleGroups: ['chest'],
    equipment: 'machine',
    needsWeight: true,
    calibration: true,
    rule: { kind: 'double', sets: 2, repMin: 8, repMax: 12, increment: 2.5 },
    sets: [0, 1].map(() => ({ weight: 0, reps: 8, setType: 'normal' as const, restTime: 90, completed: false })),
    ...patch,
  };
}

async function show(exercise: ActiveExercise) {
  useSessionStore.getState().startSession('Push', [exercise]);
  return render(<CalibrationView exercise={exercise} />);
}

const sets = () => useSessionStore.getState().activeSession!.exercises[0]!.sets;

beforeEach(() => {
  jest.useFakeTimers();
});

describe('CalibrationView', () => {
  it('counts a plate-loaded machine per side and shows the plates for it', async () => {
    await show(fresh({ plateLoaded: true }));
    await fireEvent.press(screen.getByLabelText('25 kilos'));
    expect(screen.getByText('De chaque côté : 20 + 5')).toBeTruthy();
    await fireEvent.press(screen.getByText('Commencer à 25 kg'));
    expect(sets().map((s) => s.weight)).toEqual([25, 25]);
  });

  it('says a dumbbell weight is per dumbbell', async () => {
    await show(fresh({ name: 'Curl', equipment: 'dumbbell' }));
    expect(screen.getByText('Par haltère')).toBeTruthy();
  });

  it('offers weights that fit the exercise', async () => {
    await show(fresh({ name: 'Squat', equipment: 'barbell', muscleGroups: ['legs'] }));
    expect(screen.getByLabelText('120 kilos')).toBeTruthy();
    expect(screen.queryByLabelText('20 kilos')).toBeNull();
  });

  it('says nothing more for a weight stack', async () => {
    await show(fresh({ name: 'Pec deck' }));
    expect(screen.queryByText(/côté|haltère/)).toBeNull();
  });

  it('never goes under the empty bar', async () => {
    await show(fresh({ name: 'Développé couché', equipment: 'barbell' }));
    await fireEvent.press(screen.getByLabelText('20 kilos'));
    await fireEvent.press(screen.getByLabelText('Moins 2,5 kg'));
    expect(screen.getByText('Barre à vide')).toBeTruthy();
    expect(screen.getByText('Commencer à 20 kg')).toBeTruthy();
  });

  it('takes any weight typed off the bar, even under one step', async () => {
    await show(
      fresh({ name: 'Écarté poulie', rule: { kind: 'double', sets: 2, repMin: 8, repMax: 12, increment: 5 } }),
    );
    const input = screen.getByLabelText('Charge de départ en kilos');
    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, '2,9');
    expect(screen.getByText('Commencer à 2,9 kg')).toBeTruthy();
    await fireEvent(input, 'blur');
    await fireEvent.press(screen.getByLabelText('Moins 5 kg'));
    expect(screen.getByText('Commencer à 2,9 kg')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Plus 5 kg'));
    expect(screen.getByText('Commencer à 7,9 kg')).toBeTruthy();
  });

  it('steps the weight with the round buttons', async () => {
    await show(fresh({ plateLoaded: true }));
    await fireEvent.press(screen.getByLabelText('20 kilos'));
    await fireEvent.press(screen.getByLabelText('Plus 2,5 kg'));
    expect(screen.getByText('Commencer à 22,5 kg')).toBeTruthy();
  });

  it('takes a weight typed on the keyboard, never under the empty bar', async () => {
    await show(fresh({ name: 'Squat', equipment: 'barbell' }));
    const input = screen.getByLabelText('Charge de départ en kilos');
    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, '72,5');
    expect(screen.getByText('Commencer à 72,5 kg')).toBeTruthy();
    await fireEvent.changeText(input, '5');
    expect(screen.getByText('Commencer à 20 kg')).toBeTruthy();
  });
});
