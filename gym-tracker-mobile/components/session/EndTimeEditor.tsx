import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { formatTime } from '@/domain/format';
import { withEnd, workoutEnd } from '@/domain/sessionTime';
import { t } from '@/i18n';
import type { Workout } from '@/types';
import { StickerButton } from '@/components/ui/StickerButton';
import { Text } from '@/components/ui/Text';

const STEP_MS = 5 * 60_000;

/**
 * "Fin : 19:42 · modifier": the end the app chose, moved by 5 minutes when
 * it looks wrong. Never before the start, never later than now.
 */
export function EndTimeEditor({ workout, onChange }: { workout: Workout; onChange: (w: Workout) => void }) {
  const [open, setOpen] = useState(false);
  const end = workoutEnd(workout);
  if (end == null) return null;
  const now = new Date().getTime();
  const move = (delta: number) => onChange(withEnd(workout, end + delta, now));
  const earliest = Date.parse(workout.date) + 60_000;

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('session.summary.endEditA11y')}
        hitSlop={8}
        style={{ alignSelf: 'center', paddingVertical: space.sm }}
      >
        <Text size={15} color={colors.inkMuted}>
          {t('session.summary.end', { time: formatTime(end) })} ·{' '}
          <Text size={15} weight="black" style={{ textDecorationLine: 'underline' }}>
            {t('session.summary.endEdit')}
          </Text>
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
      <StickerButton
        variant="secondary"
        size="small"
        label={t('session.summary.endEarlier')}
        accessibilityLabel={t('session.summary.endEarlierA11y')}
        disabled={end - STEP_MS < earliest}
        onPress={() => move(-STEP_MS)}
      />
      <Text size={20} weight="black" style={{ flex: 1, textAlign: 'center' }}>
        {formatTime(end)}
      </Text>
      <StickerButton
        variant="secondary"
        size="small"
        label={t('session.summary.endLater')}
        accessibilityLabel={t('session.summary.endLaterA11y')}
        disabled={end + STEP_MS > now}
        onPress={() => move(STEP_MS)}
      />
      <StickerButton variant="ghost" size="small" label={t('session.summary.endDone')} onPress={() => setOpen(false)} />
    </View>
  );
}
