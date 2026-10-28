import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { RunningCard } from '@/components/session/RunningCard';
import type { ActiveExercise, ActiveSession } from '@/types';

function exercise(name: string, done: number, total: number): ActiveExercise {
  return {
    id: name,
    name,
    category: 'compound',
    muscleGroups: ['back'],
    equipment: 'machine',
    needsWeight: false,
    sets: Array.from({ length: total }, (_, i) => ({
      weight: 40,
      reps: 10,
      setType: 'normal' as const,
      restTime: 90,
      completed: i < done,
    })),
  };
}

const session = (exercises: ActiveExercise[]): ActiveSession => ({
  workoutId: 'w',
  name: 'Pull',
  startedAt: '2026-10-29T18:00:00.000Z',
  exercises,
  restEndsAt: null,
  restDuration: null,
  lastCompleted: null,
});

describe('RunningCard', () => {
  it('shows the running session, not the planned one', async () => {
    await render(<RunningCard session={session([exercise('Tirage vertical', 2, 3), exercise('Face pull', 0, 3)])} />);
    expect(screen.getByText('Séance en cours')).toBeOnTheScreen();
    expect(screen.getByText('Pull')).toBeOnTheScreen();
    expect(screen.getByText('2 / 6 séries validées')).toBeOnTheScreen();
    expect(screen.getByText('Tirage vertical')).toBeOnTheScreen();
    expect(screen.getByText('2 / 3')).toBeOnTheScreen();
  });

  it('keeps one set singular', async () => {
    await render(<RunningCard session={session([exercise('Face pull', 0, 1)])} />);
    expect(screen.getByText('0 / 1 série validée')).toBeOnTheScreen();
  });
});
