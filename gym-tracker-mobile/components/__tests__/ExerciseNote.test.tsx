import { beforeEach, describe, expect, it } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { ExerciseNote } from '@/components/session/ExerciseNote';

const notes = () => useSettingsStore.getState().settings.exerciseNotes;

beforeEach(() => {
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
});

describe('ExerciseNote', () => {
  it('adds a note that comes back next time', async () => {
    await render(<ExerciseNote exerciseName="Presse" />);
    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter une note' }));
    const input = screen.getByLabelText('Note sur Presse');
    await fireEvent.changeText(input, 'siège cran 4');
    await fireEvent(input, 'blur');
    expect(notes()).toEqual({ Presse: 'siège cran 4' });
    expect(screen.getByText('siège cran 4')).toBeOnTheScreen();
  });

  it('edits the note in place, starting from it', async () => {
    useSettingsStore.getState().setExerciseNote('Presse', 'cran 4');
    await render(<ExerciseNote exerciseName="Presse" />);
    await fireEvent.press(screen.getByRole('button', { name: 'Modifier la note : cran 4' }));
    const input = screen.getByLabelText('Note sur Presse');
    expect(input).toHaveDisplayValue('cran 4');
    await fireEvent.changeText(input, 'cran 5');
    await fireEvent(input, 'blur');
    expect(notes()).toEqual({ Presse: 'cran 5' });
  });

  it('removes the note once emptied', async () => {
    useSettingsStore.getState().setExerciseNote('Presse', 'cran 4');
    await render(<ExerciseNote exerciseName="Presse" />);
    await fireEvent.press(screen.getByRole('button', { name: 'Modifier la note : cran 4' }));
    const input = screen.getByLabelText('Note sur Presse');
    await fireEvent.changeText(input, '  ');
    await fireEvent(input, 'blur');
    expect(notes()).toEqual({});
    expect(screen.getByRole('button', { name: 'Ajouter une note' })).toBeOnTheScreen();
  });
});
