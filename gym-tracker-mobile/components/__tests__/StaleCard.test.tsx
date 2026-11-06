import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Alert, type AlertButton } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StaleCard } from '@/components/session/StaleCard';
import type { ActiveExercise, ActiveSession } from '@/types';

const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

const at = (hour: number, minute = 0, day = 20) => new Date(2026, 9, day, hour, minute).getTime();

function bench(doneAt: (number | undefined)[]): ActiveExercise {
  return {
    id: 'bench',
    name: 'Développé couché',
    category: 'compound',
    muscleGroups: ['chest'],
    equipment: 'barbell',
    needsWeight: false,
    sets: doneAt.map((time) => ({
      weight: 60,
      reps: 10,
      setType: 'normal' as const,
      completed: time != null,
      doneAt: time,
    })),
  };
}

const session = (exercise: ActiveExercise): ActiveSession => ({
  workoutId: 'w',
  name: 'Push',
  startedAt: new Date(at(18)).toISOString(),
  exercises: [exercise],
  restEndsAt: null,
  restDuration: null,
  lastCompleted: null,
});

describe('StaleCard', () => {
  it('says the session stayed open, when the last set was, and that it is not saved', async () => {
    const onResume = jest.fn();
    await render(
      <StaleCard
        session={session(bench([at(18, 20), at(19, 42), undefined]))}
        now={at(9, 0, 21)}
        onResume={onResume}
        onDelete={() => undefined}
      />,
    );
    expect(screen.getByText('Ta séance Push est restée ouverte')).toBeOnTheScreen();
    expect(
      screen.getByText('Dernière série hier à 19:42. Tes 2 séries validées ne sont pas encore dans ton historique.'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Reprendre la séance' }));
    expect(onResume).toHaveBeenCalled();
  });

  it('asks before deleting', async () => {
    const onDelete = jest.fn();
    await render(
      <StaleCard session={session(bench([at(18, 20)]))} now={at(23)} onResume={() => undefined} onDelete={onDelete} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Supprimer la séance' }));
    const [title, text, buttons] = alert.mock.calls.at(-1)!;
    expect(title).toBe('Supprimer la séance ?');
    expect(text).toBe('Ta série validée sera effacée, rien ne sera enregistré.');
    expect(onDelete).not.toHaveBeenCalled();
    (buttons as AlertButton[]).find((b) => b.style === 'destructive')!.onPress!();
    expect(onDelete).toHaveBeenCalled();
  });

  it('tells when it started when no set was done', async () => {
    await render(
      <StaleCard
        session={session(bench([undefined]))}
        now={at(23)}
        onResume={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(screen.getByText('Lancée 18:00, aucune série validée.')).toBeOnTheScreen();
  });
});
