import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { border, colors, space } from '@/constants/theme';
import { programDays, ruleFor, withOverride, type ExerciseDef } from '@/domain/programs';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { BackButton } from '@/components/ui/BackButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { IndexBadge } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { DayExercisesEditor } from '@/components/program/DayExercisesEditor';

const EQUIPMENT = { barbell: 'Barre', dumbbell: 'Haltères', machine: 'Machine', bodyweight: 'Poids du corps' };

/** One session of the program: its exercises, their order, sets and reps. */
export default function DayScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const profile = useProfileStore((s) => s.profile);
  const customDays = useSettingsStore((s) => s.settings.customDays);
  const own = useSettingsStore((s) => s.settings.customExercises);
  const [dragging, setDragging] = useState(false);
  if (!profile) return null;

  const split = profile.program.split;
  const day = programDays(split, customDays, own).find((d) => d.name === name);
  if (!day) {
    return (
      <Screen>
        <BackButton />
        <Text size={20} style={{ marginTop: 20 }}>
          Séance introuvable.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll scrollEnabled={!dragging}>
      <BackButton />
      <ScreenHeader
        eyebrow="Mes séances"
        title={day.name}
        subtitle="Touche un exercice pour régler ses séries, ses reps et la charge ajoutée à chaque palier."
      />
      <DayExercisesEditor
        split={split}
        day={day}
        items={day.exercises}
        keyOf={(def) => def.name}
        onDragChange={setDragging}
        renderRow={(def, i, remove) => <ExerciseRow def={def} index={i} goal={profile.goal} onRemove={remove} />}
      />
    </Screen>
  );
}

function ExerciseRow({
  def,
  index,
  goal,
  onRemove,
}: {
  def: ExerciseDef;
  index: number;
  goal: Parameters<typeof ruleFor>[0];
  onRemove: () => void;
}) {
  const override = useSettingsStore((s) => s.settings.ruleOverrides[def.name]);
  const rule = withOverride(ruleFor(goal, def, 0), override);

  return (
    <PressableScale
      haptic="selection"
      onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: def.name } })}
      accessibilityRole="button"
      accessibilityLabel={`${def.name}, ${rule.sets} séries de ${rule.repMin} à ${rule.repMax} reps`}
    >
      <StickerCard small style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <IndexBadge value={index + 1} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text size={16} weight="black" numberOfLines={1}>
            {def.name}
          </Text>
          <Text size={14} weight="semibold" color={colors.inkMuted} numberOfLines={1}>
            {EQUIPMENT[def.equipment]} · {rule.sets} × {rule.repMin}–{rule.repMax}
            {override ? ' · perso' : ''}
          </Text>
        </View>
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Retirer ${def.name}`}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: border.base - 0.5,
            borderColor: colors.ink,
            backgroundColor: pressed ? colors.coralSoft : colors.card,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text size={14} weight="black">
            ✕
          </Text>
        </Pressable>
      </StickerCard>
    </PressableScale>
  );
}
