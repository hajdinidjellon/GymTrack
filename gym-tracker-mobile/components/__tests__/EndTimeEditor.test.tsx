import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EndTimeEditor } from '@/components/session/EndTimeEditor';
import { SessionTimeline } from '@/components/stats/SessionTimeline';
import type { Workout } from '@/types';

const at = (hour: number, minute = 0) => new Date(2026, 9, 20, hour, minute).getTime();

const workout: Workout = {
  id: 'w1',
  date: new Date(at(18)).toISOString(),
  name: 'Push',
  type: 'strength',
  exercises: [],
  duration: 60,
  feeling: 3,
  completed: true,
};

describe('EndTimeEditor', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(at(19, 3));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the end, and moves it by 5 minutes, never past now', async () => {
    const onChange = jest.fn();
    await render(<EndTimeEditor workout={workout} onChange={onChange} />);
    expect(screen.getByText(/Fin : 19:00/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Modifier l’heure de fin' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Fin 5 minutes plus tôt' }));
    expect(onChange).toHaveBeenCalledWith({ ...workout, duration: 55 });
    // 19:05 would be after now (19:03)
    expect(screen.getByRole('button', { name: 'Fin 5 minutes plus tard' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'OK' }));
    expect(screen.getByText(/Fin : 19:00/)).toBeOnTheScreen();
  });

  it('has nothing to change without a duration', async () => {
    await render(<EndTimeEditor workout={{ ...workout, duration: undefined }} onChange={() => undefined} />);
    expect(screen.queryByText(/Fin/)).toBeNull();
  });
});

describe('SessionTimeline', () => {
  it('shows start, end, total and the time of each exercise', async () => {
    await render(
      <SessionTimeline
        timeline={{
          start: at(18),
          end: at(19, 8),
          minutes: 68,
          blocks: [
            { names: ['Développé couché'], minutes: 25 },
            { names: ['Dips', 'Élévations latérales'], minutes: 18 },
          ],
        }}
      />,
    );
    expect(screen.getByLabelText('De 18:00 à 19:08, 1 h 08')).toBeOnTheScreen();
    expect(screen.getByText('Développé couché')).toBeOnTheScreen();
    expect(screen.getByText('Dips et Élévations latérales')).toBeOnTheScreen();
    expect(screen.getByText('25 min')).toBeOnTheScreen();
  });
});
