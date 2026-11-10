import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useProfileStore } from '@/stores/profileStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { MovementButton } from '@/components/exercise/MovementButton';
import { MusclesCard } from '@/components/exercise/MusclesCard';
import type { Experience, UserProfile, Workout } from '@/types';

// The first render loads the catalog and the video player: slower than 5 s on a busy machine
jest.setTimeout(20_000);

const profile = (experience?: Experience): UserProfile => ({
  goal: 'muscle',
  program: { split: 'ppl', perWeek: 3 },
  prs: [],
  bodyStats: [],
  experience,
});

const benchSession = (i: number): Workout => ({
  id: `w${i}`,
  date: `2026-11-0${i + 1}T10:00:00.000Z`,
  name: 'Push',
  type: 'ppl',
  feeling: 3,
  completed: true,
  exercises: [
    {
      id: `e${i}`,
      name: 'Développé couché',
      category: 'compound',
      muscleGroups: ['chest'],
      sets: [{ weight: 60, reps: 10, setType: 'normal', completed: true }],
    },
  ],
});

function setUp(experience: Experience | undefined, timesDone: number) {
  useProfileStore.setState({ profile: profile(experience) });
  useWorkoutStore.setState({ workouts: Array.from({ length: timesDone }, (_, i) => benchSession(i)) });
}

beforeEach(() => {
  useSettingsStore.setState({ settings: DEFAULT_SETTINGS });
});

describe('MovementButton', () => {
  it('puts the video forward the first time, and opens it in a popup', async () => {
    setUp('new', 0);
    await render(<MovementButton name="Développé couché" />);
    expect(screen.getByText('Nouveau ? Voir le mouvement')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Voir la vidéo du mouvement' }));
    expect(screen.getByText('Fermer')).toBeTruthy();
  });

  it('stays quiet once or twice done', async () => {
    setUp('months', 2);
    await render(<MovementButton name="Développé couché" />);
    expect(screen.getByText('Voir le mouvement')).toBeTruthy();
  });

  it('is gone once the movement is known', async () => {
    setUp(undefined, 3);
    await render(<MovementButton name="Développé couché" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is gone for years of training', async () => {
    setUp('years', 0);
    await render(<MovementButton name="Développé couché" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows nothing for an exercise without a video', async () => {
    setUp('new', 0);
    await render(<MovementButton name="Mon exercice à moi" />);
    expect(screen.queryByRole('button')).toBeNull();
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
