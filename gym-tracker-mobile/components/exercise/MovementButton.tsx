import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { findExerciseDef } from '@/domain/programs';
import { exerciseHistory } from '@/domain/sessionBuilder';
import { movementHint } from '@/domain/movementHint';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { border, colors, hardShadow, radius, space } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { exerciseName, t } from '@/i18n';
import { ExerciseVideo, videoFor } from './ExerciseVideo';

/**
 * In the logger, under the exercise: the video of the movement in a popup, closed with one tap.
 * Only while it helps (`movementHint`): put forward the first time, then quiet, then gone.
 */
export function MovementButton({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const workouts = useWorkoutStore((s) => s.workouts);
  const experience = useProfileStore((s) => s.profile?.experience);
  const own = useSettingsStore((s) => s.settings.customExercises);
  const def = findExerciseDef(name, own);
  const source = def ? videoFor(def.name) : undefined;
  const hint = source && def ? movementHint(exerciseHistory(def, workouts).length, experience) : 'none';
  if (!source || hint === 'none') return null;
  const isNew = hint === 'new';

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('exercise.video.watchA11y')}
        hitSlop={8}
        style={({ pressed }) => ({
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 4,
          paddingLeft: 5,
          paddingRight: 12,
          borderRadius: 99,
          borderWidth: border.base,
          borderColor: colors.outline,
          backgroundColor: isNew ? colors.sun : colors.card,
          transform: [{ translateY: pressed ? 2 : 0 }],
          ...(pressed ? {} : hardShadow(2)),
        })}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: isNew ? colors.card : colors.sun,
            borderWidth: 2,
            borderColor: colors.drawn,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text size={10} weight="black" color={isNew ? colors.ink : colors.onSun} style={{ marginLeft: 2 }}>
            ▶
          </Text>
        </View>
        <Text size={14} weight="bold" color={isNew ? colors.onSun : colors.ink}>
          {isNew ? t('exercise.video.watchNew') : t('exercise.video.watch')}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          accessibilityLabel={t('exercise.video.close')}
          style={{
            flex: 1,
            backgroundColor: 'rgba(10, 12, 16, 0.55)',
            justifyContent: 'center',
            padding: space.gutter,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: border.strong,
              borderColor: colors.frame,
              borderRadius: radius.card,
              borderCurve: 'continuous',
              padding: space.md,
              gap: space.sm,
              ...hardShadow(5),
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}
            >
              <Text size={18} weight="black" numberOfLines={1} style={{ flexShrink: 1 }}>
                {exerciseName(name)}
              </Text>
              <Text size={14} weight="bold" color={colors.inkMuted} style={{ textDecorationLine: 'underline' }}>
                {t('exercise.video.close')}
              </Text>
            </View>
            <ExerciseVideo source={source} inset />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
