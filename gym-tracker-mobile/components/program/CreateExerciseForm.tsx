import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { border, colors, fonts, radius, space } from '@/constants/theme';
import { makeCustomExercise, MUSCLE_CHOICES, MUSCLE_LABELS, NAME_MAX, type ExerciseDef } from '@/domain/programs';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Equipment, ExerciseCategory, MuscleGroup } from '@/types';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { buzz } from '@/components/ui/PressableScale';
import { t } from '@/i18n';

const EQUIPMENTS: Equipment[] = ['barbell', 'dumbbell', 'machine', 'bodyweight'];
const KINDS = ['compound', 'isolation'] as const satisfies readonly ExerciseCategory[];

interface Props {
  /** Pre-selected muscle, e.g. the one of the exercise being swapped. */
  muscle?: MuscleGroup;
  /** What was typed in the search. */
  initialName?: string;
  onCreated: (def: ExerciseDef) => void;
  onCancel: () => void;
}

/** Name, muscle, equipment, kind: a new exercise the app then treats like the others. */
export function CreateExerciseForm({ muscle: initialMuscle, initialName = '', onCreated, onCancel }: Props) {
  const own = useSettingsStore((s) => s.settings.customExercises);
  const addCustomExercise = useSettingsStore((s) => s.addCustomExercise);
  const [name, setName] = useState(initialName);
  const [muscle, setMuscle] = useState<MuscleGroup>(
    initialMuscle && initialMuscle !== 'arms' ? initialMuscle : 'chest',
  );
  const [equipment, setEquipment] = useState<Equipment>('machine');
  const [category, setCategory] = useState<ExerciseCategory>('isolation');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const result = makeCustomExercise({ name, equipment, category, muscle }, own);
    if ('error' in result) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => null);
      setError(result.error);
      return;
    }
    addCustomExercise(result);
    onCreated({ ...result, custom: true });
  };

  return (
    <View style={{ gap: space.md, marginTop: space.lg }}>
      <View style={{ gap: 6 }}>
        <Text size={14} weight="bold" color={colors.inkMuted}>
          {t('program.create.name')}
        </Text>
        <TextInput
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(null);
          }}
          placeholder={t('program.create.namePlaceholder')}
          placeholderTextColor={colors.inkFaint}
          maxLength={NAME_MAX}
          autoFocus={!initialName}
          returnKeyType="done"
          accessibilityLabel={t('program.create.nameA11y')}
          style={{
            height: 54,
            paddingHorizontal: 16,
            paddingVertical: 0,
            borderRadius: radius.row,
            borderWidth: border.base,
            borderColor: error ? colors.coral : colors.ink,
            backgroundColor: colors.card,
            fontFamily: fonts.bold,
            fontSize: 17,
            color: colors.ink,
          }}
        />
        {error ? (
          <Text size={14} weight="bold" color={colors.coral} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </View>

      <Options
        label={t('program.create.muscle')}
        options={MUSCLE_CHOICES.map((id) => ({ id, label: MUSCLE_LABELS[id] }))}
        value={muscle}
        onChange={setMuscle}
      />
      <Options
        label={t('program.create.equipment')}
        options={EQUIPMENTS.map((id) => ({ id, label: t(`program.equipment.${id}`) }))}
        value={equipment}
        onChange={setEquipment}
      />
      <Options
        label={t('program.create.kind')}
        options={KINDS.map((id) => ({ id, label: t(`program.kind.${id}`) }))}
        value={category}
        onChange={setCategory}
      />
      <Text size={13} color={colors.inkMuted} style={{ lineHeight: 18 }}>
        {t('program.create.hint')}
      </Text>

      <View style={{ gap: space.sm }}>
        <StickerButton label={t('program.create.submit')} size="small" onPress={save} />
        <StickerButton label={t('program.create.back')} variant="secondary" size="small" onPress={onCancel} />
      </View>
    </View>
  );
}

function Options<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text size={14} weight="bold" color={colors.inkMuted}>
        {label}
      </Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => {
          const on = o.id === value;
          return (
            <Pressable
              key={o.id}
              onPress={() => {
                buzz('selection');
                onChange(o.id);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={o.label}
              style={{
                minHeight: 44,
                paddingHorizontal: 14,
                justifyContent: 'center',
                borderRadius: radius.pill,
                borderWidth: on ? border.strong : border.base,
                borderColor: on ? colors.ink : colors.line,
                backgroundColor: on ? colors.coralSoft : colors.card,
              }}
            >
              <Text size={15} weight={on ? 'black' : 'bold'} color={on ? colors.ink : colors.inkMuted}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
