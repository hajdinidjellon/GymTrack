import React from 'react';
import { Keyboard, View } from 'react-native';
import { colors } from '@/constants/theme';
import { formatClock } from '@/domain/format';
import type { Cursor } from '@/domain/sessionCursor';
import { useHold } from '@/hooks/useHold';
import { useSessionStore } from '@/stores/sessionStore';
import { StickerButton } from '@/components/ui/StickerButton';
import { Text } from '@/components/ui/Text';
import { t } from '@/i18n';

/**
 * The bottom of the screen on a held set: one tap starts a short countdown,
 * then the hold. At the end the set validates itself; "Stop" logs what was held.
 */
export function HoldTimer({ cursor }: { cursor: Cursor }) {
  const { exercise, setIndex, set } = cursor;
  const holdStarted = useSessionStore((s) => s.holdStarted);
  const finishHold = useSessionStore((s) => s.finishHold);
  const completeSet = useSessionStore((s) => s.completeSet);
  const hold = useHold(set.reps, holdStarted, (held, reached) => finishHold(exercise.id, setIndex, held, reached));
  const { state } = hold;

  if (!state || state.phase === 'done') {
    return (
      <>
        <StickerButton
          label={t('session.hold.validateWithout')}
          variant="secondary"
          size="small"
          onPress={() => {
            Keyboard.dismiss();
            completeSet(exercise.id, setIndex);
          }}
        />
        <StickerButton
          label={t('session.hold.start', { s: set.reps })}
          size="xl"
          testID="start-hold"
          onPress={() => {
            Keyboard.dismiss();
            hold.start();
          }}
        />
      </>
    );
  }

  const prep = state.phase === 'prep';
  return (
    <>
      <View
        accessible
        accessibilityRole="timer"
        accessibilityLabel={
          prep ? t('session.hold.prepA11y', { s: state.left }) : t('session.hold.leftA11y', { s: state.left })
        }
        style={{ alignItems: 'center' }}
      >
        <Text size={15} weight="bold" color={colors.inkMuted}>
          {prep ? t('session.hold.prep') : t('session.hold.holding')}
        </Text>
        <Text size={72} weight="black" color={prep ? colors.inkMuted : colors.ink} style={{ lineHeight: 80 }}>
          {prep ? state.left : formatClock(state.left)}
        </Text>
      </View>
      <StickerButton
        label={prep ? t('common.cancel') : t('session.hold.stop')}
        variant="secondary"
        size="xl"
        haptic="medium"
        onPress={hold.stop}
      />
    </>
  );
}
