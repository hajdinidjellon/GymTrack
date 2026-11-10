import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DemoThumb } from '@/components/exercise/DemoThumb';
import { videoFor } from '@/components/exercise/ExerciseVideo';
import { MusclesCard } from '@/components/exercise/MusclesCard';

// The first render loads the catalog and the video player: slower than 5 s on a busy machine
jest.setTimeout(20_000);

describe('DemoThumb', () => {
  it('shows the demo top right, opens it big and closes it', async () => {
    const source = videoFor('Développé couché')!;
    await render(<DemoThumb name="Développé couché" source={source} />);
    expect(screen.getByText('Démo')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Voir la démo de Développé couché en grand' }));
    expect(screen.getByText('Développé couché · la démo')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'J’ai compris' }));
    expect(screen.queryByText('Développé couché · la démo')).toBeNull();
  });

  it('has a video for the catalog exercises, none for the user’s own', () => {
    expect(videoFor('Squat')).toBeDefined();
    expect(videoFor('Mon exercice à moi')).toBeUndefined();
  });
});

describe('MusclesCard', () => {
  it('names the main muscles and the ones that help', async () => {
    await render(<MusclesCard worked={{ primary: ['chest'], secondary: ['triceps', 'deltoids'] }} />);
    expect(screen.getByText('Muscles travaillés')).toBeTruthy();
    expect(screen.getByText('Pectoraux')).toBeTruthy();
    expect(screen.getByText('Aident : Triceps, Épaules')).toBeTruthy();
  });
});
