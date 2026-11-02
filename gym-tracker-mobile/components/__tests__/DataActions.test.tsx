import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Alert, type AlertButton } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { pickTextFile, shareFile } from '@/services/files';
import { useProfileStore } from '@/stores/profileStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { DataActions } from '@/components/data/DataActions';
import type { Workout } from '@/types';

jest.mock('@/services/files', () => ({ shareFile: jest.fn(() => Promise.resolve()), pickTextFile: jest.fn() }));
jest.mock('@/services/db');
jest.mock('@/services/sync', () => ({ flushSyncQueue: jest.fn(() => Promise.resolve()) }));

const picked = jest.mocked(pickTextFile);
const shared = jest.mocked(shareFile);
const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

const session: Workout = {
  id: 'w1',
  date: '2026-11-01T18:00:00.000Z',
  name: 'Push',
  type: 'strength',
  exercises: [
    {
      id: 'b',
      name: 'Développé couché',
      category: 'compound',
      muscleGroups: ['chest'],
      sets: [{ weight: 80, reps: 8, setType: 'normal', completed: true }],
    },
  ],
  feeling: 3,
  completed: true,
};

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));
const press = async (name: string) => {
  await fireEvent.press(screen.getByRole('button', { name }));
  await flush();
};
const lastAlert = () => alert.mock.calls.at(-1)!;

beforeEach(() => {
  jest.clearAllMocks();
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  useProfileStore.setState({
    profile: { goal: 'muscle', program: { split: 'ppl', perWeek: 3 }, prs: [], bodyStats: [] },
  });
  useWorkoutStore.setState({ workouts: [session] });
});

describe('DataActions', () => {
  it('shares a dated backup file with everything in it', async () => {
    await render(<DataActions />);
    await press('Créer une sauvegarde');
    const [name, content, mime] = shared.mock.calls[0]!;
    expect(name).toMatch(/^gymtrack-\d{4}-\d{2}-\d{2}\.json$/);
    expect(mime).toBe('application/json');
    expect(JSON.parse(content)).toMatchObject({
      app: 'gymtrack',
      workouts: [{ id: 'w1' }],
      profile: { goal: 'muscle' },
    });
  });

  it('restores a backup after asking, and says what came back', async () => {
    const backup = JSON.stringify({
      app: 'gymtrack',
      version: 1,
      profile: { goal: 'force', program: { split: 'ul', perWeek: 4 }, prs: [], bodyStats: [] },
      workouts: [session, { ...session, id: 'w2', date: '2026-10-20T18:00:00.000Z' }],
      settings: { barWeight: 15 },
    });
    picked.mockResolvedValue(backup);
    await render(<DataActions />);
    await press('Restaurer une sauvegarde');
    expect(lastAlert()[0]).toBe('Restaurer cette sauvegarde ?');
    expect(lastAlert()[1]).toContain('2 séances dedans');
    const confirm = (lastAlert()[2] as AlertButton[]).find((b) => b.text === 'Restaurer')!;
    confirm.onPress!();
    await flush();
    await flush();
    expect(useProfileStore.getState().profile?.goal).toBe('force');
    expect(useSettingsStore.getState().settings.barWeight).toBe(15);
    expect(useWorkoutStore.getState().workouts.map((w) => w.id)).toEqual(['w1', 'w2']);
    expect(lastAlert()).toEqual(['Sauvegarde restaurée', '1 séance ajoutée à ton historique.']);
  });

  it('refuses a file that is not a backup, and does nothing when the picker is closed', async () => {
    picked.mockResolvedValueOnce('{"app":"other","version":1}').mockResolvedValueOnce(null);
    await render(<DataActions />);
    await press('Restaurer une sauvegarde');
    expect(lastAlert()).toEqual(['Ça n’a pas marché', 'Ce fichier n’est pas une sauvegarde GymTrack.']);
    alert.mockClear();
    await press('Restaurer une sauvegarde');
    expect(alert).not.toHaveBeenCalled();
  });

  it('imports a Strong export and says what it did, line by line', async () => {
    picked.mockResolvedValue(
      [
        'Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE',
        '2024-01-15 18:30:00,Push Day,1h,Bench Press (Barbell),1,80,8,0,0,,,',
        '2024-01-15 18:30:00,Push Day,1h,Bicep Curl (Dumbbell),1,14,12,0,0,,,',
        '2024-01-15 18:30:00,Push Day,1h,Plank,1,0,0,0,60,,,',
      ].join('\n'),
    );
    await render(<DataActions />);
    await press('Importer un fichier CSV');
    expect(lastAlert()).toEqual([
      'Import terminé',
      [
        '1 séance ajoutée depuis Strong.',
        '1 exercice reconnu : la progression le reprend.',
        '1 exercice gardé sous son nom, visible dans l’historique.',
        '1 ligne sans reps ignorée (cardio, gainage…).',
        'Strong n’indique pas l’unité : les poids sont lus en kilos.',
      ].join('\n'),
    ]);
    expect(useWorkoutStore.getState().workouts).toHaveLength(2);
  });

  it('says when a CSV is not an export it knows', async () => {
    picked.mockResolvedValue('a,b\n1,2');
    await render(<DataActions />);
    await press('Importer un fichier CSV');
    expect(lastAlert()).toEqual(['Import impossible', 'Ce fichier ne ressemble pas à un export Strong ou Hevy.']);
  });

  it('exports the sets as a CSV file, or says there is nothing yet', async () => {
    await render(<DataActions />);
    await press('Exporter en CSV');
    expect(shared.mock.calls[0]![2]).toBe('text/csv');
    useWorkoutStore.setState({ workouts: [] });
    await press('Exporter en CSV');
    expect(lastAlert()[0]).toBe('Rien à exporter');
  });

  it('turns a failure into a message', async () => {
    shared.mockRejectedValueOnce(new Error('no share sheet'));
    await render(<DataActions />);
    await press('Créer une sauvegarde');
    expect(lastAlert()).toEqual(['Ça n’a pas marché', 'Le fichier n’a pas pu être ouvert. Réessaie.']);
  });
});
