import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, radius } from '@/constants/theme';
import { dayKey, type ExerciseDef, type ProgramDay } from '@/domain/programs';
import { moveItem } from '@/domain/reorder';
import { useSettingsStore } from '@/stores/settingsStore';
import type { SplitId } from '@/types';
import { Text } from '@/components/ui/Text';
import { DraggableList } from '@/components/ui/DraggableList';
import { ExercisePicker } from '@/components/session/ExercisePicker';

interface Props<T> {
  split: SplitId;
  day: ProgramDay;
  /** One item per exercise of the day, in the same order. */
  items: T[];
  keyOf: (item: T) => string;
  renderRow: (item: T, index: number, remove: () => void) => React.ReactNode;
  onDragChange?: (dragging: boolean) => void;
}

/**
 * The exercises of a program day: add, remove, drag to reorder. Every
 * change is saved for that day, so the next session uses it.
 */
export function DayExercisesEditor<T>({ split, day, items, keyOf, renderRow, onDragChange }: Props<T>) {
  const custom = useSettingsStore((s) => dayKey(split, day.name) in s.settings.customDays);
  const setDayExercises = useSettingsStore((s) => s.setDayExercises);
  const [adding, setAdding] = useState(false);

  const key = dayKey(split, day.name);
  const save = (list: ExerciseDef[]) =>
    setDayExercises(
      key,
      list.map((e) => e.name),
    );

  return (
    <View style={{ gap: 12 }}>
      <DraggableList
        items={items}
        keyOf={keyOf}
        onReorder={(from, to) => save(moveItem(day.exercises, from, to))}
        onDragChange={onDragChange}
        renderItem={(item, i) => renderRow(item, i, () => save(day.exercises.filter((_, index) => index !== i)))}
      />
      <Pressable
        onPress={() => setAdding(true)}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un exercice"
        style={({ pressed }) => ({
          height: 56,
          borderRadius: radius.row,
          borderWidth: border.base,
          borderStyle: 'dashed',
          borderColor: pressed ? colors.ink : colors.line,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Text size={16} weight="bold" color={colors.inkMuted}>
          + Ajouter un exercice
        </Text>
      </Pressable>
      <Text size={13} color={colors.inkFaint} align="center">
        {items.length > 1 ? 'Maintiens un exercice puis glisse-le pour changer l’ordre. ' : ''}
        {custom
          ? `Tes exercices pour ${day.name} sont enregistrés pour les prochaines fois.`
          : `Ajoute, retire ou déplace des exercices : ils seront gardés pour tes prochaines séances ${day.name}.`}
      </Text>
      {custom ? (
        <Pressable
          onPress={() => setDayExercises(key, null)}
          accessibilityRole="button"
          hitSlop={8}
          style={{ alignSelf: 'center' }}
        >
          <Text size={14} weight="bold" color={colors.inkMuted} style={{ textDecorationLine: 'underline' }}>
            Revenir aux exercices du programme
          </Text>
        </Pressable>
      ) : null}

      <ExercisePicker
        visible={adding}
        taken={day.exercises.map((e) => e.name)}
        onPick={(def) => {
          save([...day.exercises, def]);
          setAdding(false);
        }}
        onClose={() => setAdding(false)}
      />
    </View>
  );
}
