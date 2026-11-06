import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, radius } from '@/constants/theme';
import { dayKey, mainMuscle, type ExerciseDef, type ProgramDay } from '@/domain/programs';
import { moveItem } from '@/domain/reorder';
import { useSettingsStore } from '@/stores/settingsStore';
import type { SplitId } from '@/types';
import { Text } from '@/components/ui/Text';
import { DraggableList } from '@/components/ui/DraggableList';
import { ExercisePicker } from '@/components/session/ExercisePicker';
import { dayName, t } from '@/i18n';

interface Props<T> {
  split: SplitId;
  day: ProgramDay;
  /** One item per exercise of the day, in the same order. */
  items: T[];
  keyOf: (item: T) => string;
  renderRow: (item: T, index: number, remove: () => void) => React.ReactNode;
  onDragChange?: (dragging: boolean) => void;
  /** An exercise was taken off: `restore` puts the day back as it was. */
  onRemoved?: (name: string, restore: () => void) => void;
  /** Added or reordered: an older removal can no longer be undone. */
  onEdited?: () => void;
}

/**
 * The exercises of a program day: add, remove, drag to reorder. Every
 * change is saved for that day, so the next session uses it.
 */
export function DayExercisesEditor<T>({
  split,
  day,
  items,
  keyOf,
  renderRow,
  onDragChange,
  onRemoved,
  onEdited,
}: Props<T>) {
  const custom = useSettingsStore((s) => dayKey(split, day.name) in s.settings.customDays);
  const setDayExercises = useSettingsStore((s) => s.setDayExercises);
  const [adding, setAdding] = useState(false);

  const key = dayKey(split, day.name);
  const save = (list: ExerciseDef[]) =>
    setDayExercises(
      key,
      list.map((e) => e.name),
    );
  const edit = (list: ExerciseDef[]) => {
    save(list);
    onEdited?.();
  };
  const remove = (i: number) => {
    const gone = day.exercises[i];
    if (!gone) return;
    // The day as it was: its own list, or the program's when it had none
    const before = useSettingsStore.getState().settings.customDays[key] ?? null;
    const after = day.exercises.filter((_, index) => index !== i).map((e) => e.name);
    setDayExercises(key, after);
    onRemoved?.(gone.name, () => {
      // Changed since: putting the old list back would undo more than the removal
      const now = useSettingsStore.getState().settings.customDays[key];
      if (now && now.join('\n') === after.join('\n')) setDayExercises(key, before);
    });
  };

  return (
    <View style={{ gap: 12 }}>
      <DraggableList
        items={items}
        keyOf={keyOf}
        onReorder={(from, to) => edit(moveItem(day.exercises, from, to))}
        onDragChange={onDragChange}
        renderItem={(item, i) => renderRow(item, i, () => remove(i))}
      />
      <Pressable
        onPress={() => setAdding(true)}
        accessibilityRole="button"
        accessibilityLabel={t('program.editor.add')}
        style={({ pressed }) => ({
          minHeight: 56,
          borderRadius: radius.row,
          borderWidth: border.base,
          borderStyle: 'dashed',
          borderColor: pressed ? colors.outlineStrong : colors.outlineSoft,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Text size={16} weight="bold" color={colors.inkMuted}>
          {t('program.editor.addButton')}
        </Text>
      </Pressable>
      <Text size={13} color={colors.inkFaint} align="center">
        {items.length > 1 ? t('program.editor.dragHint') : ''}
        {t(custom ? 'program.editor.saved' : 'program.editor.howTo', { day: dayName(day.name) })}
      </Text>
      {custom ? (
        <Pressable
          onPress={() => {
            setDayExercises(key, null);
            onEdited?.();
          }}
          accessibilityRole="button"
          hitSlop={8}
          style={{ alignSelf: 'center' }}
        >
          <Text size={14} weight="bold" color={colors.inkMuted} style={{ textDecorationLine: 'underline' }}>
            {t('program.editor.reset')}
          </Text>
        </Pressable>
      ) : null}

      <ExercisePicker
        visible={adding}
        taken={day.exercises.map((e) => e.name)}
        muscle={mainMuscle(day.exercises)}
        onPick={(def) => edit([...day.exercises, def])}
        onClose={() => setAdding(false)}
      />
    </View>
  );
}
