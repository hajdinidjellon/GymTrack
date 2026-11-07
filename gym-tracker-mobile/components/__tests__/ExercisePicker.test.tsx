import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EXERCISES, type ExerciseDef } from '@/domain/programs';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { ExercisePicker } from '@/components/session/ExercisePicker';
import type { MuscleGroup } from '@/types';

const onPick = jest.fn<(def: ExerciseDef) => void>();

function renderPicker(props: { suggested?: ExerciseDef[]; muscle?: MuscleGroup } = {}) {
  return render(<ExercisePicker visible taken={[]} onPick={onPick} onClose={() => null} {...props} />);
}

const choices = () => screen.getAllByRole('button', { name: /^Choisir / }).map((b) => b.props.accessibilityLabel);

beforeEach(() => {
  onPick.mockClear();
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
});

describe('ExercisePicker', () => {
  it('opens on every muscle at once, the most known first', async () => {
    await renderPicker();
    expect(screen.getByRole('tab', { name: 'Tous' }).props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByText("Tous les exercices, les plus connus d'abord")).toBeOnTheScreen();
    expect(choices().slice(0, 4)).toEqual([
      'Choisir Développé couché',
      'Choisir Squat',
      'Choisir Soulevé de terre',
      'Choisir Tirage vertical',
    ]);
  });

  it('shows one muscle at a time, the most known first, and hides the tabs while searching', async () => {
    await renderPicker();
    await fireEvent.press(screen.getByRole('tab', { name: 'Dos' }));
    expect(screen.queryByText("Tous les exercices, les plus connus d'abord")).toBeNull();
    expect(choices().slice(0, 2)).toEqual(['Choisir Soulevé de terre', 'Choisir Tirage vertical']);
    expect(choices()).not.toContain('Choisir Développé couché');
    for (const label of ['Pectoraux', 'Biceps', 'Triceps', 'Jambes', 'Fessiers']) {
      expect(screen.getByRole('tab', { name: label })).toBeOnTheScreen();
    }
    await fireEvent.changeText(screen.getByLabelText('Chercher un exercice'), 'squat');
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('splits a muscle in regions: the upper chest only shows the incline work', async () => {
    await renderPicker();
    // Pas de zones sur « Tous »
    expect(screen.queryByRole('tab', { name: 'Haut des pecs' })).toBeNull();
    await fireEvent.press(screen.getByRole('tab', { name: 'Pectoraux' }));
    expect(screen.getByText('Pectoraux · 34 exercices')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Pectoraux : tous les exercices' }).props.accessibilityState).toEqual({
      selected: true,
    });
    await fireEvent.press(screen.getByRole('tab', { name: 'Haut des pecs' }));
    expect(screen.getByText('Haut des pecs · 7 exercices')).toBeOnTheScreen();
    expect(choices()).toContain('Choisir Développé incliné haltères');
    expect(choices()).not.toContain('Choisir Développé couché');
    // Another muscle starts again on all of it
    await fireEvent.press(screen.getByRole('tab', { name: 'Dos' }));
    expect(screen.getByRole('tab', { name: 'Dos : tous les exercices' }).props.accessibilityState).toEqual({
      selected: true,
    });
    await fireEvent.press(screen.getByRole('tab', { name: 'Trapèzes' }));
    expect(choices()).toEqual([
      'Choisir Shrugs haltères',
      'Choisir Shrugs barre',
      'Choisir Shrugs machine',
      'Choisir Shrugs Smith',
    ]);
  });

  it('shows no regions for a muscle that has none', async () => {
    await renderPicker();
    await fireEvent.press(screen.getByRole('tab', { name: 'Biceps' }));
    expect(screen.queryByRole('tab', { name: 'Biceps : tous les exercices' })).toBeNull();
  });

  it('creates an own exercise in the region on screen', async () => {
    await renderPicker();
    await fireEvent.press(screen.getByRole('tab', { name: 'Pectoraux' }));
    await fireEvent.press(screen.getByRole('tab', { name: 'Haut des pecs' }));
    await fireEvent.press(screen.getByRole('button', { name: /créer/i }));
    expect(screen.getByRole('radio', { name: 'Haut des pecs' })).toBeSelected();
    await fireEvent.changeText(screen.getByLabelText("Nom de l'exercice"), 'Incliné Panatta');
    await fireEvent.press(screen.getByRole('button', { name: "Créer l'exercice" }));
    expect(useSettingsStore.getState().settings.customExercises[0]).toMatchObject({
      name: 'Incliné Panatta',
      muscleGroups: ['chest'],
      region: 'upperChest',
    });
  });

  it('puts the suggestions first, then everything else without them', async () => {
    await renderPicker({ suggested: [EXERCISES.legpress, EXERCISES.squat], muscle: 'chest' });
    expect(screen.getByText('Suggestions')).toBeOnTheScreen();
    expect(choices().slice(0, 3)).toEqual(['Choisir Presse à cuisses', 'Choisir Squat', 'Choisir Développé couché']);
    expect(choices().filter((c) => c === 'Choisir Squat')).toHaveLength(1);
    await fireEvent.press(screen.getByRole('button', { name: `Choisir ${EXERCISES.squat.name}` }));
    expect(onPick).toHaveBeenCalledWith(EXERCISES.squat);
  });

  it('puts the user’s own exercises first', async () => {
    const own = {
      name: 'Écarté Panatta',
      equipment: 'machine' as const,
      category: 'isolation' as const,
      muscleGroups: ['chest' as const],
    };
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, customExercises: [own] } });
    await renderPicker();
    expect(choices()[0]).toBe('Choisir Écarté Panatta');
    expect(screen.getByText('Ton exercice')).toBeOnTheScreen();
  });

  it('searches every name, most known first', async () => {
    await renderPicker();
    await fireEvent.changeText(screen.getByLabelText('Chercher un exercice'), 'squat');
    expect(screen.queryByText("Tous les exercices, les plus connus d'abord")).toBeNull();
    expect(choices()[0]).toBe('Choisir Squat');
    expect(screen.getByText(EXERCISES.hacksquat.name)).toBeOnTheScreen();
  });

  it('shows the other name an exercise was found under, and does not offer to create it again', async () => {
    await renderPicker();
    await fireEvent.changeText(screen.getByLabelText('Chercher un exercice'), 'Lat pulldown');
    expect(screen.getByText(EXERCISES.pulldown.name)).toBeOnTheScreen();
    expect(screen.getAllByText('Aussi appelé Lat pulldown').length).toBeGreaterThan(0);
    expect(screen.queryByText('+ Créer « Lat pulldown »')).toBeNull();
  });

  it('finds an exercise by its English name, and offers to create a name it does not know', async () => {
    await renderPicker();
    await fireEvent.changeText(screen.getByLabelText('Chercher un exercice'), 'butterfly');
    expect(screen.getByText(EXERCISES.pecdeck.name)).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Chercher un exercice'), 'Zercher lesté');
    expect(screen.getByText('+ Créer « Zercher lesté »')).toBeOnTheScreen();
  });
});

describe('ExercisePicker for several exercises', () => {
  it('stays on the list after a pick, with the options on top', async () => {
    const onClose = jest.fn();
    await render(
      <ExercisePicker
        visible
        taken={[]}
        muscle="back"
        options={<Text>Option lue avant</Text>}
        onPick={onPick}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('Option lue avant')).toBeOnTheScreen();
    await fireEvent.press(screen.getAllByRole('button', { name: /Tractions/ })[0]!);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Tous les exercices, les plus connus d'abord")).toBeOnTheScreen();
  });
});
