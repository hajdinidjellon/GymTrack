import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { CalibrationView } from '@/components/session/CalibrationView';
import type { ActiveExercise, PersonalRecord } from '@/types';

function fresh(patch: Partial<ActiveExercise>): ActiveExercise {
  return {
    id: 'ex',
    name: 'Chest press',
    category: 'compound',
    muscleGroups: ['chest'],
    equipment: 'machine',
    needsWeight: true,
    calibration: true,
    rule: { kind: 'double', sets: 2, repMin: 8, repMax: 12, increment: 2.5 },
    sets: [0, 1].map(() => ({ weight: 0, reps: 8, setType: 'normal' as const, restTime: 90, completed: false })),
    ...patch,
  };
}

async function show(exercise: ActiveExercise) {
  useSessionStore.getState().startSession('Push', [exercise]);
  return render(<CalibrationView exercise={exercise} />);
}

const sets = () => useSessionStore.getState().activeSession!.exercises[0]!.sets;

beforeEach(() => {
  // Warm-ups off: these tests are about the working sets
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, warmups: false } });
  useProfileStore.setState({ profile: null });
  jest.useFakeTimers();
});

describe('Tu connais ton max ?', () => {
  const squat = () => fresh({ name: 'Squat', equipment: 'barbell', muscleGroups: ['legs'] });
  const asExperienced = (experience: 'new' | 'years', addPR = jest.fn(async (_pr: PersonalRecord) => undefined)) => {
    useProfileStore.setState({
      profile: { goal: 'force', program: { split: 'ul', perWeek: 4 }, experience, prs: [], bodyStats: [] },
      addPR,
    });
    return addPR;
  };

  it('starts an experienced lifter at 70 % of the max they give, and keeps it', async () => {
    const addPR = asExperienced('years');
    await show(squat());
    await fireEvent.press(screen.getByRole('button', { name: 'Tu connais ton max ?' }));
    const input = screen.getByLabelText('Ton max en kilos');
    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, '140');
    await fireEvent(input, 'blur');
    // 70 % of 140 = 98, down to what the plates make
    await fireEvent.press(screen.getByText('Partir à 70 % : 97,5 kg'));
    expect(screen.getByText(/^Série faite : 97,5 kg × /)).toBeTruthy();
    expect(addPR).toHaveBeenCalledWith(expect.objectContaining({ exercise: 'Squat', oneRepMax: 140, reps: 1 }));
  });

  it('is not asked to a beginner', async () => {
    asExperienced('new');
    await show(squat());
    expect(screen.queryByText('Tu connais ton max ?')).toBeNull();
  });
});

describe('CalibrationView', () => {
  it('counts a plate-loaded machine per side and shows the plates for it', async () => {
    await show(fresh({ plateLoaded: true }));
    await fireEvent.press(screen.getByLabelText('25 kilos'));
    expect(screen.getByText('De chaque côté : 20 + 5')).toBeTruthy();
    await fireEvent.press(screen.getByText(/^Série faite : 25 kg × /));
    expect(sets().map((s) => s.weight)).toEqual([25, 25]);
    // One tap: the weight and the first set, done at the machine already
    expect(sets().map((s) => !!s.completed)).toEqual([true, false]);
  });

  it('only sets the weight when asked to, the set still to validate', async () => {
    await show(fresh({ plateLoaded: true }));
    await fireEvent.press(screen.getByLabelText('25 kilos'));
    await fireEvent.press(screen.getByRole('button', { name: 'Choisir la charge seulement' }));
    expect(sets().map((s) => s.weight)).toEqual([25, 25]);
    expect(sets().some((s) => s.completed)).toBe(false);
  });

  it('says a dumbbell weight is per dumbbell', async () => {
    await show(fresh({ name: 'Curl', equipment: 'dumbbell' }));
    expect(screen.getByText('Par haltère')).toBeTruthy();
  });

  it('offers weights that fit the exercise', async () => {
    await show(fresh({ name: 'Squat', equipment: 'barbell', muscleGroups: ['legs'] }));
    expect(screen.getByLabelText('120 kilos')).toBeTruthy();
    // The empty bar always comes first: where a beginner starts
    expect(screen.getByLabelText(/^20 kilos/)).toBeTruthy();
  });

  it('says nothing more for a weight stack', async () => {
    await show(fresh({ name: 'Pec deck' }));
    expect(screen.queryByText(/côté|haltère/)).toBeNull();
  });

  it('never goes under the empty bar', async () => {
    await show(fresh({ name: 'Développé couché', equipment: 'barbell' }));
    await fireEvent.press(screen.getByLabelText(/^20 kilos/));
    await fireEvent.press(screen.getByLabelText('Moins 2,5 kg'));
    expect(screen.getByText('Barre à vide')).toBeTruthy();
    expect(screen.getByText(/^Série faite : 20 kg × /)).toBeTruthy();
  });

  it('takes any weight typed off the bar, even under one step', async () => {
    await show(
      fresh({ name: 'Écarté poulie', rule: { kind: 'double', sets: 2, repMin: 8, repMax: 12, increment: 5 } }),
    );
    const input = screen.getByLabelText('Charge de départ en kilos');
    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, '2,9');
    expect(screen.getByText(/^Série faite : 2,9 kg × /)).toBeTruthy();
    await fireEvent(input, 'blur');
    await fireEvent.press(screen.getByLabelText('Moins 5 kg'));
    expect(screen.getByText(/^Série faite : 2,9 kg × /)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Plus 5 kg'));
    expect(screen.getByText(/^Série faite : 7,9 kg × /)).toBeTruthy();
  });

  it('marks the suggested weight', async () => {
    await show(fresh({ name: 'Squat', equipment: 'barbell', muscleGroups: ['legs'] }));
    expect(screen.getByText('conseillé')).toBeOnTheScreen();
  });

  it('steps the weight with the round buttons', async () => {
    await show(fresh({ plateLoaded: true }));
    await fireEvent.press(screen.getByLabelText(/^20 kilos/));
    await fireEvent.press(screen.getByLabelText('Plus 2,5 kg'));
    expect(screen.getByText(/^Série faite : 22,5 kg × /)).toBeTruthy();
  });

  it('takes a weight typed on the keyboard, never under the empty bar', async () => {
    await show(fresh({ name: 'Squat', equipment: 'barbell' }));
    const input = screen.getByLabelText('Charge de départ en kilos');
    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, '72,5');
    expect(screen.getByText(/^Série faite : 72,5 kg × /)).toBeTruthy();
    await fireEvent.changeText(input, '5');
    expect(screen.getByText(/^Série faite : 20 kg × /)).toBeTruthy();
  });
});
