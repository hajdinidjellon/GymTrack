import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '@/constants/theme';
import { formatShortDay, formatThousands } from '@/domain/format';
import { byDate, setsDone } from '@/domain/history';
import { tonnage, type LoadFactor } from '@/domain/sessionBuilder';
import { useLoadFactor } from '@/hooks/useLoadFactor';
import { useLocale } from '@/hooks/useLocale';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StickerCard } from '@/components/ui/StickerCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { FadeIn } from '@/components/ui/FadeIn';
import { Text } from '@/components/ui/Text';
import { ChevronRight } from '@/components/ui/icons';
import { dayName, t } from '@/i18n';
import type { Workout } from '@/types';

/** One past session in the list. */
function Row({ workout, index, factor }: { workout: Workout; index: number; factor: LoadFactor }) {
  const sets = t('common.sets', { count: setsDone(workout) });
  const lifted = tonnage(workout, factor);
  const kg = formatThousands(lifted);
  const date = formatShortDay(workout.date);
  const meta = workout.duration
    ? t('home.last.meta', { date, sets, minutes: workout.duration })
    : t('history.metaNoTime', { date, sets });
  return (
    // Au-delà de l'écran, pas d'animation d'entrée
    <FadeIn index={Math.min(index + 1, 8)}>
      <PressableScale
        haptic="selection"
        onPress={() => router.push({ pathname: '/history/[id]', params: { id: workout.id } })}
        accessibilityRole="button"
        accessibilityLabel={
          lifted > 0
            ? t('history.rowA11y', { name: dayName(workout.name), date, sets, kg })
            : t('history.rowA11yNoKg', { name: dayName(workout.name), date, sets })
        }
      >
        <StickerCard small style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text size={18} weight="black" numberOfLines={1}>
              {dayName(workout.name)}
            </Text>
            <Text size={13} color={colors.inkMuted} numberOfLines={1}>
              {meta}
            </Text>
          </View>
          {lifted > 0 ? (
            <Text size={16} weight="black">
              {kg} {t('common.kg')}
            </Text>
          ) : null}
          <ChevronRight size={20} />
        </StickerCard>
      </PressableScale>
    </FadeIn>
  );
}

/** Every past session, newest first. One tap for its sets. Only the rows on screen are drawn. */
export default function HistoryScreen() {
  useLocale();
  const workouts = useWorkoutStore((s) => s.workouts);
  const factor = useLoadFactor();
  const list = useMemo(() => byDate(workouts), [workouts]);

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <FlatList
        data={list}
        keyExtractor={(w) => w.id}
        renderItem={({ item, index }) => <Row workout={item} index={index} factor={factor} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        initialNumToRender={10}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: space.xl }}
        ListHeaderComponent={<ScreenHeader back title={t('history.title')} subtitle={t('history.subtitle')} />}
        ListEmptyComponent={
          <Text size={16} color={colors.inkMuted} style={{ lineHeight: 22 }}>
            {t('history.empty')}
          </Text>
        }
      />
    </Screen>
  );
}
