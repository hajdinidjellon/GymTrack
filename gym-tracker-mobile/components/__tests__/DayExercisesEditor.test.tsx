import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { choosableDays, type ExerciseDef } from '@/domain/programs';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { DayExercisesEditor } from '@/components/program/DayExercisesEditor';
import { useRemovalUndo } from '@/components/program/useRemovalUndo';
import { RemoveButton } from '@/components/ui/RemoveButton';
import { Text } from '@/components/ui/Text';

// The drag needs the native gesture handler: a plain list is enough here
jest.mock('@/components/ui/DraggableList', () => ({
  DraggableList: ({
    items,
    renderItem,
  }: {
    items: unknown[];
    renderItem: (item: unknown, index: number) => React.ReactNode;
  }) => <>{items.map((item, i) => renderItem(item, i))}</>,
}));

/** The Push day of the PPL program, with an undo bar under it like the screens. */
function Harness() {
  const customDays = useSettingsStore((s) => s.settings.customDays);
  const undo = useRemovalUndo();
  const day = choosableDays('ppl', customDays, []).find((d) => d.name === 'Push')!;
  return (
    <View>
      <DayExercisesEditor<ExerciseDef>
        split="ppl"
        day={day}
        items={day.exercises}
        keyOf={(def) => def.name}
        onRemoved={undo.onRemoved}
        onEdited={undo.onEdited}
        renderRow={(def, _i, remove) => (
          <View>
            <Text>{def.name}</Text>
            <RemoveButton onPress={remove} accessibilityLabel={`Retirer ${def.name}`} />
          </View>
        )}
      />
      {undo.bar}
    </View>
  );
}

const names = () =>
  choosableDays('ppl', useSettingsStore.getState().settings.customDays, [])
    .find((d) => d.name === 'Push')!
    .exercises.map((e) => e.name);

beforeEach(() => {
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
});

describe('removing an exercise from a day', () => {
  it('can be undone, back to the program as it was', async () => {
    const before = names();
    const first = before[0]!;
    await render(<Harness />);
    await fireEvent.press(screen.getByRole('button', { name: `Retirer ${first}` }));
    expect(names()).not.toContain(first);
    expect(screen.getByText(`Retiré : ${first}`)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: `Remettre ${first}` }));
    expect(names()).toEqual(before);
    // Nothing of its own was saved: the day follows the program again
    expect(useSettingsStore.getState().settings.customDays).toEqual({});
    expect(screen.queryByText(`Retiré : ${first}`)).toBeNull();
  });

  it('touches nothing when the day changed since', async () => {
    const [first, second] = names();
    await render(<Harness />);
    await fireEvent.press(screen.getByRole('button', { name: `Retirer ${first}` }));
    const undo = screen.getByRole('button', { name: `Remettre ${first}` });
    // Changed elsewhere in the meantime: the old list is not put back over it
    useSettingsStore.getState().setDayExercises('ppl/Push', [second!]);
    await fireEvent.press(undo);
    expect(names()).toEqual([second]);
  });

  it('gives the ✕ a 44 pt touch area', async () => {
    await render(<RemoveButton onPress={() => undefined} accessibilityLabel="Retirer" />);
    expect(screen.getByRole('button', { name: 'Retirer' })).toHaveStyle({ width: 44, height: 44 });
  });
});
