import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { isRateable } from '@/domain/session';
import { useSessionStore } from '@/stores/sessionStore';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';
import { Check } from '@/components/ui/icons';
import { Chip } from '@/components/ui/Chip';
import { workingCount } from '@/domain/warmup';
import { CheckRow } from '@/components/ui/CheckRow';
import { dayOfSession, dayUpdateFrom } from '@/domain/dayFromSession';
import { findExerciseDef } from '@/domain/programs';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { EffortPicker } from './EffortPicker';
import { dayName, exerciseName, listOf, t } from '@/i18n';

/**
 * Every set is validated. Before saving: how the last set felt (it steers
 * the next targets), a way back for a mis-tap, or one more set.
 */
export function SessionDone({ onFinish }: { onFinish: () => void }) {
  const rateable = useSessionStore((s) => !!s.activeSession && isRateable(s.activeSession));
  const undoLastSet = useSessionStore((s) => s.undoLastSet);
  const addSet = useSessionStore((s) => s.addSet);
  const lastExerciseId = useSessionStore((s) => s.activeSession?.lastCompleted?.exerciseId);
  const session = useSessionStore((s) => s.activeSession);
  const settings = useSettingsStore((s) => s.settings);
  const split = useProfileStore((s) => s.profile?.program.split);
  const [keep, setKeep] = useState(false);
  // Moved, swapped or added during the session: offered as the day's new list, never by default
  const update =
    session && split
      ? dayUpdateFrom(
          dayOfSession(session.name, split, settings),
          session.exercises.map((e) => e.name),
          session.planned,
          (name) => !!findExerciseDef(name, settings.customExercises),
        )
      : null;
  const finish = () => {
    if (keep && update) useSettingsStore.getState().setDayExercises(update.key, update.names, update.before);
    onFinish();
  };
  const recap = session
    ? {
        name: session.name,
        sets: session.exercises.reduce((n, e) => n + workingCount(e.sets, 'done'), 0),
        exercises: session.exercises.filter((e) => e.sets.some((s) => s.completed)).length,
        // Up to the last set validated (its time is in the session): no clock read while drawing
        minutes: Math.max(
          1,
          Math.round(
            (Math.max(0, ...session.exercises.flatMap((e) => e.sets.map((x) => x.doneAt ?? 0))) -
              new Date(session.startedAt).getTime()) /
              60000,
          ),
        ),
      }
    : null;

  return (
    <View style={{ flex: 1, gap: space.lg }}>
      {/* What was done, at the top where the eye starts; the actions under the thumb */}
      {recap ? (
        <View style={{ gap: space.sm, marginTop: space.md }}>
          <Text size={15} weight="bold" color={colors.inkMuted}>
            {dayName(recap.name)}
          </Text>
          <Text size={32} weight="black" accessibilityRole="header" style={{ lineHeight: 38 }}>
            {t('session.done.allDone')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            <Chip label={t('common.sets', { count: recap.sets })} />
            <Chip label={t('common.exercises', { count: recap.exercises })} />
            <Chip label={t('session.done.minutes', { n: recap.minutes })} />
          </View>
        </View>
      ) : null}
      <StickerCard tone="hero" style={{ gap: space.md }}>
        <Text size={28} weight="black" accessibilityRole="header">
          {t('session.done.title')}
        </Text>
        <Text size={15} color={colors.inkMuted} style={{ lineHeight: 21 }}>
          {t('session.done.text')}
        </Text>
        {rateable ? <EffortPicker /> : null}
      </StickerCard>
      {update ? (
        <CheckRow
          label={t('session.done.keepDay', { day: dayName(update.day.name) })}
          detail={t('session.done.keepDayDetail', { list: listOf(update.names.map(exerciseName)) })}
          checked={keep}
          onChange={setKeep}
        />
      ) : null}
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.xl }}>
        <Link label={t('session.done.undo')} onPress={undoLastSet} />
        {lastExerciseId ? <Link label={t('session.done.oneMore')} onPress={() => addSet(lastExerciseId)} /> : null}
      </View>
      <StickerButton
        label={t('session.done.finish')}
        size="xl"
        icon={<Check size={28} />}
        testID="finish-session"
        onPress={finish}
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
