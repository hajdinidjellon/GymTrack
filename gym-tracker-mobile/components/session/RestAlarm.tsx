import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '@/constants/theme';
import { loadLabel } from '@/domain/sessionBuilder';
import { findCurrent } from '@/domain/sessionCursor';
import { useSessionStore } from '@/stores/sessionStore';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';
import { exerciseName, t } from '@/i18n';

/**
 * The end of the rest while it rings: over every screen, a tap anywhere stops it.
 * A plain overlay, not a Modal: it shows up while the rest popup is still closing.
 */
export function RestAlarm() {
  const ringing = useSessionStore((s) => s.restAlarm);
  const stop = useSessionStore((s) => s.stopRestAlarm);
  const session = useSessionStore((s) => s.activeSession);
  const insets = useSafeAreaInsets();
  if (!ringing) return null;

  const next = session ? findCurrent(session.exercises) : null;
  return (
    // Le tap n'importe où, carte comprise, coupe l'alarme
    <Pressable
      onPress={stop}
      accessibilityViewIsModal
      accessibilityRole="button"
      accessibilityLabel={`${t('session.alarm.title')} ${t('session.alarm.stopA11y')}`}
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.scrim,
          justifyContent: 'center',
          paddingHorizontal: space.gutter,
          paddingTop: insets.top + space.md,
          paddingBottom: insets.bottom + space.md,
        },
      ]}
    >
      <StickerCard tone="hero" style={{ alignItems: 'center', gap: space.md }}>
        <Text size={34} weight="black" align="center" accessibilityRole="header">
          {t('session.alarm.title')}
        </Text>
        {next ? (
          <View style={{ alignItems: 'center' }}>
            <Text size={15} weight="semibold" numberOfLines={1}>
              {exerciseName(next.exercise.name)}
            </Text>
            <Text size={26} weight="black" numberOfLines={1}>
              {next.exercise.needsWeight
                ? t('session.rest.weightToSet')
                : loadLabel(next.set.weight, next.set.reps, next.exercise.timed, next.exercise.assisted)}
            </Text>
          </View>
        ) : null}
        <View style={{ alignSelf: 'stretch' }}>
          <StickerButton label={t('session.alarm.stop')} haptic="medium" onPress={stop} />
        </View>
        <Text size={13} weight="semibold" align="center">
          {t('session.alarm.hint')}
        </Text>
      </StickerCard>
    </Pressable>
  );
}
