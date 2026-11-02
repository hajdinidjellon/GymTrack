import React from 'react';
import { Pressable } from 'react-native';
import { colors } from '@/constants/theme';
import { doLater } from '@/domain/session';
import { useSessionStore } from '@/stores/sessionStore';
import type { ActiveExercise } from '@/types';
import { Text } from '@/components/ui/Text';
import { exerciseName, t } from '@/i18n';

/** "Plus tard" under the exercise name: machine taken, it moves to the end. Hidden when nothing waits behind it. */
export function DoLater({ exercise }: { exercise: ActiveExercise }) {
  const canWait = useSessionStore(
    (s) => !!s.activeSession && doLater(s.activeSession, exercise.id) !== s.activeSession,
  );
  if (!canWait) return null;
  return (
    <Pressable
      onPress={() => useSessionStore.getState().doLater(exercise.id)}
      accessibilityRole="button"
      accessibilityLabel={t('session.doLater.a11y', { name: exerciseName(exercise.name) })}
      hitSlop={12}
    >
      <Text size={15} weight="bold" color={colors.inkMuted} style={{ textDecorationLine: 'underline' }}>
        {t('session.doLater.label')}
      </Text>
    </Pressable>
  );
}
