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

const tab = (name: string) => screen.getByRole('tab', { name });

beforeEach(() => {
  onPick.mockClear();
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
});

describe('ExercisePicker', () => {
  it('shows one muscle at a time, picked from the tabs', async () => {
    await renderPicker();
    expect(tab('Pectoraux')).toBeSelected();
    expect(screen.getByText(EXERCISES.bench.name)).toBeOnTheScreen();
    expect(screen.queryByText(EXERCISES.squat.name)).toBeNull();

    await fireEvent.press(tab('Jambes'));
    expect(tab('Jambes')).toBeSelected();
    expect(screen.getByText(EXERCISES.squat.name)).toBeOnTheScreen();
    expect(screen.queryByText(EXERCISES.bench.name)).toBeNull();
  });

  it("opens on the exercise's muscle", async () => {
    await renderPicker({ muscle: 'legs' });
    expect(tab('Jambes')).toBeSelected();
  });

  it('opens on the suggestions when there are some', async () => {
    await renderPicker({ suggested: [EXERCISES.squat], muscle: 'chest' });
    expect(tab('Suggestions')).toBeSelected();
    await fireEvent.press(screen.getByRole('button', { name: `Choisir ${EXERCISES.squat.name}` }));
    expect(onPick).toHaveBeenCalledWith(EXERCISES.squat);
  });

  it('searches every muscle at once, without the tabs', async () => {
    await renderPicker();
    await fireEvent.changeText(screen.getByLabelText('Chercher un exercice'), 'squat');
    expect(screen.queryByRole('tab', { name: 'Pectoraux' })).toBeNull();
    expect(screen.getByText(EXERCISES.squat.name)).toBeOnTheScreen();
  });

  it('shows the other name an exercise was found under, and does not offer to create it again', async () => {
    await renderPicker();
    await fireEvent.changeText(screen.getByLabelText('Chercher un exercice'), 'Lat pulldown');
    expect(screen.getByText(EXERCISES.pulldown.name)).toBeOnTheScreen();
    expect(screen.getByText('Aussi appelé Lat pulldown')).toBeOnTheScreen();
    expect(screen.queryByText('+ Créer « Lat pulldown »')).toBeNull();
  });
});

describe('ExercisePicker for several exercises', () => {
  it('stays open on the same tab after a pick, with the options on top', async () => {
    const onClose = jest.fn();
    await render(
      <ExercisePicker
        visible
        taken={[]}
        muscle="back"
        stayOpen
        options={<Text>Option lue avant</Text>}
        onPick={onPick}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('Option lue avant')).toBeOnTheScreen();
    await fireEvent.press(screen.getAllByRole('button', { name: /Tractions/ })[0]!);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(tab('Dos')).toBeSelected();
  });
});
