import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useSessionStore } from '@/stores/sessionStore';
import { DoLater } from '@/components/session/DoLater';
import type { ActiveExercise } from '@/types';

function exercise(name: string): ActiveExercise {
  return {
    id: name,
    name,
    category: 'compound',
    muscleGroups: ['chest'],
    equipment: 'barbell',
    needsWeight: false,
    sets: [{ weight: 60, reps: 10, setType: 'normal' as const, completed: false }],
  };
}

const store = () => useSessionStore.getState();
const order = () => store().activeSession!.exercises.map((e) => e.id);

beforeEach(() => {
  jest.useFakeTimers();
  store().startSession('Legs', [exercise('Squat'), exercise('Presse')]);
});

describe('DoLater', () => {
  it('sends the exercise to the end of the session', async () => {
    await render(<DoLater exercise={exercise('Squat')} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Faire Squat plus tard' }));
    expect(order()).toEqual(['Presse', 'Squat']);
  });

  it('is hidden on the last exercise left', async () => {
    store().completeSet('Presse', 0);
    await render(<DoLater exercise={exercise('Squat')} />);
    expect(screen.queryByText('Plus tard')).toBeNull();
  });
});
