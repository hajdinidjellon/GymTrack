import React from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, space } from '@/constants/theme';
import { EFFORT_LABELS } from '@/domain/effort';
import { formatDay, formatThousands } from '@/domain/format';
import { loggedExercises, setsDone, type LoggedSet } from '@/domain/history';
import { formatKg } from '@/domain/plates';
import { loadLabel, newRecords, tonnage } from '@/domain/sessionBuilder';
import { useLoadFactor } from '@/hooks/useLoadFactor';
import { useLocale } from '@/hooks/useLocale';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { BackButton } from '@/components/ui/BackButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { Chip } from '@/components/ui/Chip';
import { FadeIn } from '@/components/ui/FadeIn';
import { Text } from '@/components/ui/Text';
import { ChevronRight } from '@/components/ui/icons';
import { dayName, exerciseName, t } from '@/i18n';

/** One past session: what was done on each exercise, set by set. */
export default function WorkoutScreen() {
  useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workouts = useWorkoutStore((s) => s.workouts);
  const own = useSettingsStore((s) => s.settings.customExercises);
  const factor = useLoadFactor();
  const workout = workouts.find((w) => w.id === id);

  if (!workout) {
    return (
      <Screen>
        <BackButton />
        <Text size={20} style={{ marginTop: 20 }}>
          {t('history.detail.notFound')}
        </Text>
      </Screen>
    );
  }

  const exercises = loggedExercises(workout);
  const records = newRecords(workout, workouts, own);

  return (
    <Screen scroll>
      <BackButton />
      <ScreenHeader eyebrow={formatDay(workout.date)} title={dayName(workout.name)} />
      <FadeIn>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.lg }}>
          <Chip label={t('common.exercises', { count: exercises.length })} />
          <Chip label={t('common.sets', { count: setsDone(workout) })} />
          {workout.duration ? <Chip label={t('history.detail.minutes', { n: workout.duration })} /> : null}
          <Chip label={t('history.detail.lifted', { kg: formatThousands(tonnage(workout, factor)) })} />
          {records.map((r) => (
            <Chip
              key={r.name}
              tone="sun"
              label={t('history.detail.record', { name: exerciseName(r.name), kg: formatKg(r.weight) })}
            />
          ))}
        </View>
      </FadeIn>

      <View style={{ gap: 12 }}>
        {exercises.map((e, i) => (
          <FadeIn key={`${e.name}-${i}`} index={Math.min(i + 1, 8)}>
            <StickerCard small style={{ gap: 4 }}>
              <PressableScale
                haptic="selection"
                onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: e.name } })}
                accessibilityRole="button"
                accessibilityLabel={t('history.detail.exerciseA11y', { name: exerciseName(e.name) })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingBottom: 4 }}
              >
                <Text size={17} weight="black" numberOfLines={2} style={{ flex: 1 }}>
                  {exerciseName(e.name)}
                </Text>
                <ChevronRight size={18} />
              </PressableScale>
              <SetLines sets={e.sets} timed={e.timed} />
            </StickerCard>
          </FadeIn>
        ))}
      </View>

      <Pressable
        onPress={() => router.push('/history')}
        accessibilityRole="button"
        hitSlop={8}
        style={{ alignSelf: 'center', marginTop: space.lg, paddingVertical: space.sm }}
      >
        <Text size={15} weight="black" style={{ textDecorationLine: 'underline' }}>
          {t('history.detail.all')}
        </Text>
      </Pressable>
    </Screen>
  );
}

/** "1   80 kg × 10   Juste bien", warm-ups marked and not numbered. */
function SetLines({ sets, timed }: { sets: LoggedSet[]; timed?: boolean }) {
  let n = 0;
  return (
    <View>
      {sets.map((s, i) => {
        const label = s.warmup
          ? t('history.detail.warmup')
          : s.kind === 'drop'
            ? t('history.detail.drop')
            : String(++n);
        return (
          <View
            key={i}
            style={{
              minHeight: 38,
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              borderTopWidth: 2,
              borderTopColor: colors.line,
            }}
          >
            <Text size={14} weight="bold" color={colors.inkMuted} style={{ width: 56 }}>
              {label}
            </Text>
            <Text size={16} weight="black" color={s.warmup ? colors.inkMuted : colors.ink} style={{ flex: 1 }}>
              {loadLabel(s.weight, s.reps, timed)}
            </Text>
            {s.effort || s.kind === 'failure' ? (
              <Text size={13} weight="semibold" color={colors.inkMuted}>
                {s.effort ? EFFORT_LABELS[s.effort] : t('history.detail.failure')}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
