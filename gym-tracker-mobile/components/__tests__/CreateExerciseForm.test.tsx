import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EXERCISES, mainMuscle } from '@/domain/programs';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { CreateExerciseForm } from '@/components/program/CreateExerciseForm';

const press = {
  name: 'Presse Hamer',
  equipment: 'machine' as const,
  category: 'compound' as const,
  muscleGroups: ['legs' as const],
};

beforeEach(() => {
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, customExercises: [press] } });
});

describe('CreateExerciseForm editing an own exercise', () => {
  it('starts from what it is, and saves the fixed name', async () => {
    const onCreated = jest.fn();
    await render(<CreateExerciseForm editing={press} onCreated={onCreated} onCancel={jest.fn()} />);
    expect(screen.getByDisplayValue('Presse Hamer')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Jambes' })).toBeSelected();
    await fireEvent.changeText(screen.getByLabelText("Nom de l'exercice"), 'Presse Hammer');
    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(useSettingsStore.getState().settings.customExercises[0]).toMatchObject({
      name: 'Presse Hammer',
      aliases: ['Presse Hamer'],
    });
    expect(onCreated).toHaveBeenCalled();
  });

  it('can keep its own name', async () => {
    const onCreated = jest.fn();
    await render(<CreateExerciseForm editing={press} onCreated={onCreated} onCancel={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onCreated).toHaveBeenCalled();
  });
});

describe('CreateExerciseForm regions', () => {
  it('offers the regions of the muscle, and forgets one that no longer fits', async () => {
    const onCreated = jest.fn();
    await render(<CreateExerciseForm muscle="chest" onCreated={onCreated} onCancel={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Tout le muscle' })).toBeSelected();
    await fireEvent.press(screen.getByRole('radio', { name: 'Bas des pecs' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Dos' }));
    expect(screen.queryByRole('radio', { name: 'Bas des pecs' })).toBeNull();
    expect(screen.getByRole('radio', { name: 'Tout le muscle' })).toBeSelected();
    await fireEvent.press(screen.getByRole('radio', { name: 'Biceps' }));
    expect(screen.queryByRole('radio', { name: 'Tout le muscle' })).toBeNull();
  });

  it('keeps the region of an own exercise being changed', async () => {
    const mine = { ...press, name: 'Incliné Panatta', muscleGroups: ['chest' as const], region: 'upperChest' as const };
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, customExercises: [mine] } });
    await render(<CreateExerciseForm editing={mine} onCreated={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Haut des pecs' })).toBeSelected();
    await fireEvent.press(screen.getByRole('radio', { name: 'Milieu des pecs' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(useSettingsStore.getState().settings.customExercises[0]).toMatchObject({ region: 'midChest' });
  });
});

describe('mainMuscle', () => {
  it('is the muscle most of the day works', () => {
    expect(mainMuscle([EXERCISES.bench, EXERCISES.ohp, EXERCISES.incline])).toBe('chest');
    expect(mainMuscle([])).toBeUndefined();
  });
});
