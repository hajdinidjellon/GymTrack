import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { findCurrent } from '@/domain/sessionCursor';
import { useSessionStore } from '@/stores/sessionStore';
import { RestMini, RestView } from '@/components/session/RestView';
import type { ActiveExercise } from '@/types';

const squat: ActiveExercise = {
  id: 'squat',
  name: 'Squat',
  category: 'compound',
  muscleGroups: ['legs'],
  equipment: 'barbell',
  needsWeight: false,
  rule: { kind: 'double', sets: 3, repMin: 5, repMax: 8, increment: 2.5 },
  sets: [0, 1, 2].map(() => ({
    weight: 80,
    reps: 5,
    setType: 'normal' as const,
    restTime: 120,
    completed: false,
    target: { weight: 80, reps: 5 },
  })),
};

const session = () => useSessionStore.getState().activeSession!;
const onMinimize = jest.fn();

async function renderRest() {
  const s = session();
  return render(
    <RestView
      next={findCurrent(s.exercises)}
      restEndsAt={s.restEndsAt!}
      total={s.restDuration ?? 120}
      doneLabel="Série 1 validée"
      onMinimize={onMinimize}
    />,
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  useSessionStore.getState().startSession('Jambes', [squat]);
  useSessionStore.getState().completeSet('squat', 0);
});

describe('RestView', () => {
  it('shows the timer and what to load next', async () => {
    await renderRest();
    expect(screen.getByRole('timer')).toBeOnTheScreen();
    expect(screen.getByText('80 kg × 5')).toBeOnTheScreen();
  });

  it('rates the set just validated in one tap, and takes it back', async () => {
    await renderRest();
    const easy = screen.getByRole('radio', { name: 'Facile' });
    await fireEvent.press(easy);
    expect(session().exercises[0]!.sets[0]!.rpe).toBe(6);
    expect(easy).toBeChecked();
    await fireEvent.press(easy);
    expect(session().exercises[0]!.sets[0]!.rpe).toBeUndefined();
    expect(easy).not.toBeChecked();
  });

  it('asks how it felt only right after a set', async () => {
    const s = session();
    await render(<RestView next={findCurrent(s.exercises)} restEndsAt={s.restEndsAt!} total={120} />);
    expect(screen.queryByText("Comment c'était ?")).toBeNull();
  });

  it('skips the rest', async () => {
    await renderRest();
    await fireEvent.press(screen.getByRole('button', { name: 'Passer le repos' }));
    expect(session().restEndsAt).toBeNull();
  });

  it('adds time to the rest', async () => {
    const before = session().restEndsAt!;
    await renderRest();
    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter 15 secondes' }));
    expect(session().restEndsAt).toBe(before + 15_000);
  });

  it('undoes the last set', async () => {
    await renderRest();
    await fireEvent.press(screen.getByRole('button', { name: 'Annuler la dernière série' }));
    expect(session().exercises[0]!.sets[0]!.completed).toBe(false);
  });

  it('closes the rest or shrinks it', async () => {
    await renderRest();
    await fireEvent.press(screen.getByRole('button', { name: 'Réduire le minuteur' }));
    expect(onMinimize).toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Fermer le repos' }));
    expect(session().restEndsAt).toBeNull();
  });

  it('brings the popup back from the small bar', async () => {
    const onExpand = jest.fn();
    await render(<RestMini restEndsAt={session().restEndsAt!} onExpand={onExpand} />);
    await fireEvent.press(screen.getByRole('button', { name: /Agrandir le minuteur/ }));
    expect(onExpand).toHaveBeenCalled();
  });
});
