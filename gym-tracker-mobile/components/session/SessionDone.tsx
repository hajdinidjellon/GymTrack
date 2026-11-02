import React from 'react';
import { Pressable, View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { isRateable } from '@/domain/session';
import { useSessionStore } from '@/stores/sessionStore';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';
import { Check } from '@/components/ui/icons';
import { EffortPicker } from './EffortPicker';
import { t } from '@/i18n';

/**
 * Every set is validated. Before saving: how the last set felt (it steers
 * the next targets), a way back for a mis-tap, or one more set.
 */
export function SessionDone({ onFinish }: { onFinish: () => void }) {
  const rateable = useSessionStore((s) => !!s.activeSession && isRateable(s.activeSession));
  const undoLastSet = useSessionStore((s) => s.undoLastSet);
  const addSet = useSessionStore((s) => s.addSet);
  const lastExerciseId = useSessionStore((s) => s.activeSession?.lastCompleted?.exerciseId);

  return (
    <View style={{ flex: 1, justifyContent: 'center', gap: space.lg }}>
      <StickerCard tone="hero" style={{ gap: space.md }}>
        <Text size={28} weight="black" accessibilityRole="header">
          {t('session.done.title')}
        </Text>
        <Text size={15} color={colors.inkMuted} style={{ lineHeight: 21 }}>
          {t('session.done.text')}
        </Text>
        {rateable ? <EffortPicker /> : null}
      </StickerCard>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.xl }}>
        <Link label={t('session.done.undo')} onPress={undoLastSet} />
        {lastExerciseId ? <Link label={t('session.done.oneMore')} onPress={() => addSet(lastExerciseId)} /> : null}
      </View>
      <StickerButton
        label={t('session.done.finish')}
        size="xl"
        icon={<Check size={28} />}
        testID="finish-session"
        onPress={onFinish}
      />
    </View>
  );
}

function Link({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8}>
      <Text size={15} weight="bold" style={{ textDecorationLine: 'underline' }}>
        {label}
      </Text>
    </Pressable>
  );
}
