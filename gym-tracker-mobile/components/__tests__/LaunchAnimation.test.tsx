import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { LaunchAnimation } from '@/components/brand/LaunchAnimation';

beforeEach(() => {
  jest.useFakeTimers();
});

describe('LaunchAnimation', () => {
  it('shows the name while the app loads', async () => {
    await render(<LaunchAnimation ready={false} onDone={jest.fn()} />);
    expect(screen.getByText('GymTrack')).toBeOnTheScreen();
  });

  it('waits for the data, however long the animation took', async () => {
    const onDone = jest.fn();
    const view = await render(<LaunchAnimation ready={false} onDone={onDone} />);
    await act(async () => jest.advanceTimersByTime(5000));
    expect(onDone).not.toHaveBeenCalled();

    await view.rerender(<LaunchAnimation ready onDone={onDone} />);
    await act(async () => jest.advanceTimersByTime(300));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('never holds a ready app more than about a second', async () => {
    const onDone = jest.fn();
    await render(<LaunchAnimation ready onDone={onDone} />);
    await act(async () => jest.advanceTimersByTime(900));
    expect(onDone).not.toHaveBeenCalled();
    // Fin de la séquence à 1 s, puis le fondu de sortie
    await act(async () => jest.advanceTimersByTime(100));
    await act(async () => jest.advanceTimersByTime(300));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
