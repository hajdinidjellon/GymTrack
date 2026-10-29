import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SessionProgress } from '@/components/session/SessionProgress';
import type { ActiveExercise } from '@/types';

function exercise(name: string, done: boolean[]): ActiveExercise {
  return {
    id: name,
    name,
    category: 'compound',
    muscleGroups: ['chest'],
    equipment: 'barbell',
    needsWeight: false,
    sets: done.map((completed) => ({ weight: 60, reps: 10, setType: 'normal' as const, completed })),
  };
}

const exercises = [exercise('Squat', [true]), exercise('Presse', [false]), exercise('Fentes', [false])];
const onPick = jest.fn<(id: string) => void>();

beforeEach(() => {
  onPick.mockClear();
});

describe('SessionProgress', () => {
  it('does a waiting exercise now when its pill is tapped', async () => {
    await render(<SessionProgress exercises={exercises} current={1} onPick={onPick} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Faire Fentes maintenant' }));
    expect(onPick).toHaveBeenCalledWith('Fentes');
  });

  it('only offers the waiting exercises', async () => {
    await render(<SessionProgress exercises={exercises} current={1} onPick={onPick} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByLabelText('Squat, terminé')).toBeOnTheScreen();
    expect(screen.getByLabelText('Presse, en cours')).toBeOnTheScreen();
  });

  it('ignores a tap on the current or a finished exercise', async () => {
    await render(<SessionProgress exercises={exercises} current={1} onPick={onPick} />);
    await fireEvent.press(screen.getByLabelText('Squat, terminé'));
    await fireEvent.press(screen.getByLabelText('Presse, en cours'));
    expect(onPick).not.toHaveBeenCalled();
  });
});
