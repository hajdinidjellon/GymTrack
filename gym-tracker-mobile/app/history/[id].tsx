import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, space } from '@/constants/theme';
import { EFFORT_LABELS } from '@/domain/effort';
import { formatDay, formatThousands } from '@/domain/format';
import { loggedExercises, setsDone, type LoggedSet } from '@/domain/history';
import { formatKg } from '@/domain/plates';
import { findExerciseDef } from '@/domain/programs';
import { dayOfSession, dayUpdateFrom, type DayUpdate } from '@/domain/dayFromSession';
import { loadLabel, newRecords, tonnage } from '@/domain/sessionBuilder';
import { timeline } from '@/domain/sessionTime';
import { useLoadFactor } from '@/hooks/useLoadFactor';
import { useLocale } from '@/hooks/useLocale';
import { useProfileStore } from '@/stores/profileStore';
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
import { StickerButton } from '@/components/ui/StickerButton';
import { ChevronRight } from '@/components/ui/icons';
import { SessionTimeline } from '@/components/stats/SessionTimeline';
import { dayName, exerciseName, listOf, t } from '@/i18n';

/** Asked first: a session deleted does not come back. Left before it goes, so "not found" never shows. */
function confirmDelete(id: string) {
  Alert.alert(t('history.detail.deleteTitle'), t('history.detail.deleteText'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('history.detail.deleteConfirm'),
      style: 'destructive',
      onPress: () => {
        router.back();
        void useWorkoutStore.getState().deleteWorkout(id);
      },
    },
  ]);
}

/** The past session becomes the day's list, once asked: the next sessions of that day follow it. */
function confirmKeepDay(update: DayUpdate, onKept: () => void) {
  const day = dayName(update.day.name);
  Alert.alert(
    t('history.detail.keepDayTitle', { day }),
    t('history.detail.keepDayText', { day, list: listOf(update.names.map(exerciseName)) }),
    [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('history.detail.keepDayConfirm'),
        onPress: () => {
          useSettingsStore.getState().setDayExercises(update.key, update.names, update.before);
          onKept();
        },
      },
    ],
  );
}

/** One past session: what was done on each exercise, set by set. */
export default function WorkoutScreen() {
  useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workouts = useWorkoutStore((s) => s.workouts);
  const settings = useSettingsStore((s) => s.settings);
  const own = settings.customExercises;
  const split = useProfileStore((s) => s.profile?.program.split);
  // Name of the day once kept: the button gives way to a line saying so
  const [kept, setKept] = useState<string | null>(null);
  const factor = useLoadFactor();
  const workout = workouts.find((w) => w.id === id);

  if (!workout) {
    return (
      <Screen>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm }}>
          <BackButton />
          <Text size={20} style={{ flex: 1 }}>
            {t('history.detail.notFound')}
          </Text>
        </View>
      </Screen>
    );
  }

  const exercises = loggedExercises(workout);
  const records = newRecords(workout, workouts, own);
  const time = timeline(workout);
  const lifted = tonnage(workout, factor);
  const update = split
    ? dayUpdateFrom(
        dayOfSession(workout.name, split, settings),
        exercises.map((e) => e.name),
        undefined,
        (name) => !!findExerciseDef(name, own),
      )
    : null;

  return (
    <Screen scroll>
      <ScreenHeader back eyebrow={formatDay(workout.date)} title={dayName(workout.name)} />
      <FadeIn>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.lg }}>
          <Chip label={t('common.exercises', { count: exercises.length })} />
          <Chip label={t('common.sets', { count: setsDone(workout) })} />
          {/* Bodyweight, held or assisted only: nothing lifted to show, never "0 kg" */}
          {lifted > 0 ? <Chip label={t('history.detail.lifted', { kg: formatThousands(lifted) })} /> : null}
          {records.map((r) => (
            <Chip
              key={r.name}
              tone="sun"
              label={t('history.detail.record', { name: exerciseName(r.name), kg: formatKg(r.weight) })}
            />
          ))}
        </View>
        {time && time.minutes > 0 ? (
          <View style={{ marginBottom: space.lg }}>
            <SessionTimeline timeline={time} />
          </View>
        ) : null}
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
              <SetLines sets={e.sets} timed={e.timed} assisted={findExerciseDef(e.name, own)?.assisted} />
            </StickerCard>
          </FadeIn>
        ))}
      </View>

      {kept ? (
        <Text size={15} weight="bold" color={colors.inkMuted} style={{ textAlign: 'center', marginTop: space.lg }}>
          {t('history.detail.keptDay', { day: dayName(kept) })}
        </Text>
      ) : update ? (
        <StickerButton
          label={t('history.detail.keepDay', { day: dayName(update.day.name) })}
          variant="secondary"
          testID="keep-day"
          style={{ marginTop: space.lg }}
          onPress={() => confirmKeepDay(update, () => setKept(update.day.name))}
        />
      ) : null}
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
      <Pressable
        onPress={() => confirmDelete(workout.id)}
        accessibilityRole="button"
        hitSlop={8}
        style={{ alignSelf: 'center', marginTop: space.sm, paddingVertical: space.sm }}
      >
        <Text size={15} weight="bold" color={colors.danger} style={{ textDecorationLine: 'underline' }}>
          {t('history.detail.delete')}
        </Text>
      </Pressable>
    </Screen>
  );
}

/** "1   80 kg × 10   Juste bien", warm-ups marked and not numbered. */
function SetLines({ sets, timed, assisted }: { sets: LoggedSet[]; timed?: boolean; assisted?: boolean }) {
  const preciseRpe = useSettingsStore((s) => s.settings.preciseRpe);
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
              {loadLabel(s.weight, s.reps, timed, assisted)}
            </Text>
            {s.effort || s.kind === 'failure' ? (
              <Text size={13} weight="semibold" color={colors.inkMuted}>
                {preciseRpe && s.rpe != null
                  ? t('session.effort.rpe', { rpe: formatKg(s.rpe) })
                  : s.effort
                    ? EFFORT_LABELS[s.effort]
                    : t('history.detail.failure')}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
