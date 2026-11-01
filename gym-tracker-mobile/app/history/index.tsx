import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '@/constants/theme';
import { formatShortDay, formatThousands } from '@/domain/format';
import { byDate, setsDone } from '@/domain/history';
import { tonnage } from '@/domain/sessionBuilder';
import { useLoadFactor } from '@/hooks/useLoadFactor';
import { useLocale } from '@/hooks/useLocale';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { BackButton } from '@/components/ui/BackButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { FadeIn } from '@/components/ui/FadeIn';
import { Text } from '@/components/ui/Text';
import { ChevronRight } from '@/components/ui/icons';
import { dayName, t } from '@/i18n';

/** Every past session, newest first. One tap for its sets. */
export default function HistoryScreen() {
  useLocale();
  const workouts = useWorkoutStore((s) => s.workouts);
  const factor = useLoadFactor();
  const list = byDate(workouts);

  return (
    <Screen scroll>
      <BackButton />
      <ScreenHeader title={t('history.title')} subtitle={t('history.subtitle')} />
      {list.length === 0 ? (
        <Text size={16} color={colors.inkMuted} style={{ lineHeight: 22 }}>
          {t('history.empty')}
        </Text>
      ) : null}
      <View style={{ gap: 12 }}>
        {list.map((w, i) => {
          const sets = t('common.sets', { count: setsDone(w) });
          const kg = formatThousands(tonnage(w, factor));
          const date = formatShortDay(w.date);
          return (
            // Au-delà de l'écran, pas d'animation d'entrée
            <FadeIn key={w.id} index={Math.min(i + 1, 8)}>
              <PressableScale
                haptic="selection"
                onPress={() => router.push({ pathname: '/history/[id]', params: { id: w.id } })}
                accessibilityRole="button"
                accessibilityLabel={t('history.rowA11y', { name: dayName(w.name), date, sets, kg })}
              >
                <StickerCard small style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text size={18} weight="black" numberOfLines={1}>
                      {dayName(w.name)}
                    </Text>
                    <Text size={13} color={colors.inkMuted} numberOfLines={1}>
                      {t('home.last.meta', { date, sets, minutes: w.duration ?? 0 })}
                    </Text>
                  </View>
                  <Text size={16} weight="black">
                    {kg} {t('common.kg')}
                  </Text>
                  <ChevronRight size={20} />
                </StickerCard>
              </PressableScale>
            </FadeIn>
          );
        })}
      </View>
    </Screen>
  );
}
