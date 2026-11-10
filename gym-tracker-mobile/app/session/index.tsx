import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '@/constants/theme';
import { useLocale } from '@/hooks/useLocale';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { dayName, exerciseName, listOf, t } from '@/i18n';
import { isRateable } from '@/domain/session';
import { findCurrent } from '@/domain/sessionCursor';
import { setNumber, workingCount } from '@/domain/warmup';
import { useSessionStore } from '@/stores/sessionStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { SetView } from '@/components/session/SetView';
import { RestMini, RestView } from '@/components/session/RestView';
import { CalibrationView } from '@/components/session/CalibrationView';
import { SessionProgress } from '@/components/session/SessionProgress';
import { SwapExercise } from '@/components/session/SwapExercise';
import { DoLater } from '@/components/session/DoLater';
import { ExerciseNote } from '@/components/session/ExerciseNote';
import { DemoThumb } from '@/components/exercise/DemoThumb';
import { videoFor } from '@/components/exercise/ExerciseVideo';
import { AddExercise } from '@/components/session/AddExercise';
import { SessionDone } from '@/components/session/SessionDone';

// Pendant qu'on quitte l'écran, la séance est déjà vidée : on ne redirige pas une deuxième fois
let leaving = false;

/** Saves what was done, then opens the summary. Nothing done: nothing saved. A failed save keeps the session. */
async function finish() {
  if (leaving) return;
  leaving = true;
  let workout;
  try {
    workout = await useSessionStore.getState().saveSession();
  } catch {
    leaving = false;
    Alert.alert(t('session.logger.saveFailedTitle'), t('session.logger.saveFailed'));
    return;
  }
  if (!workout) {
    router.dismissTo('/(tabs)');
    return;
  }
  router.replace({ pathname: '/session/summary', params: { id: workout.id } });
}

function confirmFinish(left: number) {
  const message = left > 0 ? t('session.logger.finishLeft', { count: left }) : t('session.logger.finishNoneLeft');
  Alert.alert(t('session.logger.finishTitle'), message, [
    { text: t('common.continue'), style: 'cancel' },
    { text: t('session.logger.abandon'), style: 'destructive', onPress: confirmAbandon },
    { text: t('session.logger.finish'), onPress: () => void finish() },
  ]);
}

/** Abandoning wipes the whole session: asked a second time, never one tap away. */
function confirmAbandon() {
  Alert.alert(t('session.logger.abandonTitle'), t('session.logger.abandonText'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('session.logger.abandonConfirm'),
      style: 'destructive',
      onPress: () => {
        leaving = true;
        useSessionStore.getState().discardSession();
        router.dismissTo('/(tabs)');
      },
    },
  ]);
}

export default function SessionScreen() {
  useLocale();
  const session = useSessionStore((s) => s.activeSession);
  const insets = useSafeAreaInsets();
  const listening = useVoiceCommands(!!session);
  const cursor = session ? findCurrent(session.exercises) : null;
  const done = !!session && !cursor;
  const resting = session?.restEndsAt != null;
  // Réduit pour ce repos seulement : il revient en grand après la série suivante
  const restKey = resting ? JSON.stringify(session.lastCompleted) : null;
  const [minimizedKey, setMinimizedKey] = useState<string | null>(null);
  const minimized = resting && minimizedKey === restKey;
  const setMinimized = (on: boolean) => setMinimizedKey(on ? restKey : null);

  useEffect(() => {
    leaving = false;
  }, []);

  useEffect(() => {
    if (!session && !leaving) router.dismissTo('/(tabs)');
  }, [session]);

  // Dernière série validée : le ressenti, une annulation possible, puis le bilan
  if (session && done)
    return (
      <Screen style={{ paddingBottom: Math.max(insets.bottom, space.lg) + space.sm }}>
        <SessionDone onFinish={() => void finish()} />
      </Screen>
    );
  if (!session || !cursor)
    return (
      <Screen>
        <View />
      </Screen>
    );

  const { exercise, exerciseIndex, setIndex } = cursor;
  const last = session.lastCompleted;
  const doneExercise = last && session.exercises.find((e) => e.id === last.exerciseId);
  const left = session.exercises.reduce((n, e) => n + workingCount(e.sets, 'left'), 0);
  const now = setNumber(exercise.sets, setIndex);
  // The movement's video, when the catalog has one: top right of the exercise
  const demo = videoFor(exercise.name);
  const partners = exercise.superset
    ? listOf(
        session.exercises
          .filter((e) => e.superset === exercise.superset && e.id !== exercise.id)
          .map((e) => exerciseName(e.name)),
      )
    : null;
  const lastDone = doneExercise ? setNumber(doneExercise.sets, last.setIndex) : null;
  // "Tout comme prévu" validated several sets at once: the undo says so, and undoes them all
  const batch = last?.batch && last.batch.length > 1 ? last.batch.length : 0;

  // Pendant le repos, le bas de l'écran garde le minuteur en petit ; en grand, il s'ouvre au milieu
  const rest = resting ? <RestMini restEndsAt={session.restEndsAt!} onExpand={() => setMinimized(false)} /> : null;

  return (
    <Screen style={{ paddingBottom: Math.max(insets.bottom, space.lg) + space.sm }}>
      <View
        style={{
          minHeight: 44,
          gap: space.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text size={16} weight="black" numberOfLines={1} style={{ flex: 1 }}>
          {dayName(session.name)}
          <Text size={15} weight="bold" color={colors.inkMuted}>
            {'  '}
            {t('session.logger.exerciseOf', { n: exerciseIndex + 1, total: session.exercises.length })}
          </Text>
        </Text>
        <Pressable onPress={() => confirmFinish(left)} accessibilityRole="button" hitSlop={12}>
          <Text size={16} weight="black" style={{ textDecorationLine: 'underline' }}>
            {t('session.logger.finish')}
          </Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ flex: 1 }}>
          <SessionProgress
            exercises={session.exercises}
            current={exerciseIndex}
            onPick={(id) => useSessionStore.getState().doNow(id)}
          />
        </View>
        <AddExercise current={exercise} sessionName={session.name} />
      </View>

      <View style={{ marginTop: space.xl, flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
        <View style={{ flex: 1, minWidth: 0, gap: space.sm }}>
          {/* The set beside the name; a long name pushes it to the next line */}
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: space.lg, rowGap: 2 }}
          >
            <Pressable
              onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: exercise.name } })}
              accessibilityRole="button"
              accessibilityHint={t('session.logger.exerciseHint')}
              style={{ flexShrink: 1 }}
            >
              <Text size={30} weight="black" accessibilityRole="header" numberOfLines={2} style={{ lineHeight: 34 }}>
                {exerciseName(exercise.name)}
              </Text>
            </Pressable>
            {/* Plain words on the name's line, no frame: the sets table below shows it too */}
            <Text size={15} weight="bold" color={colors.inkMuted}>
              {now.drop
                ? t(resting ? 'session.logger.nextDropSet' : 'session.logger.dropSet')
                : now.warmup
                  ? t(resting ? 'session.logger.nextWarmupOf' : 'session.logger.warmupOf', {
                      n: now.n,
                      total: now.total,
                    })
                  : t(resting ? 'session.logger.nextSetOf' : 'session.logger.setOf', { n: now.n, total: now.total })}
            </Text>
          </View>
          {partners ? (
            <Text size={14} weight="bold" color={colors.inkMuted}>
              {t('session.logger.superset', { name: partners })}
            </Text>
          ) : null}
          {listening ? (
            <Text size={13} weight="bold" color={colors.inkMuted} accessibilityLiveRegion="polite">
              {t('session.logger.listening')}
            </Text>
          ) : null}
          {/* Side by side, always: they shrink rather than stack */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <SwapExercise exercise={exercise} sessionName={session.name} />
            <DoLater exercise={exercise} />
          </View>
          {/* The note under the actions: it stops at the demo, beside it */}
          {exercise.needsWeight ? null : <ExerciseNote exerciseName={exercise.name} />}
        </View>
        {/* The movement's video, when the catalog has one */}
        {demo ? <DemoThumb name={exercise.name} source={demo} /> : null}
      </View>

      {exercise.needsWeight ? (
        rest ? (
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>{rest}</View>
        ) : (
          <CalibrationView key={exercise.id} exercise={exercise} />
        )
      ) : (
        <SetView cursor={cursor} footer={rest ?? undefined} />
      )}

      <Modal visible={resting && !minimized} transparent animationType="fade" onRequestClose={() => setMinimized(true)}>
        <View style={{ flex: 1, backgroundColor: colors.scrim }}>
          {/* Large text on a small phone: the popup scrolls instead of being cut */}
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: space.gutter,
              paddingTop: insets.top + space.md,
              paddingBottom: insets.bottom + space.md,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
              onPress={() => setMinimized(true)}
              accessibilityRole="button"
              accessibilityLabel={t('session.rest.minimizeA11y')}
            />
            {resting ? (
              <RestView
                next={cursor}
                restEndsAt={session.restEndsAt!}
                total={session.restDuration ?? 90}
                doneLabel={
                  batch
                    ? t('session.logger.batchDone', { count: batch })
                    : lastDone
                      ? lastDone.warmup
                        ? t('session.logger.warmupDone')
                        : lastDone.drop
                          ? t('session.logger.dropDone')
                          : t('session.logger.setDone', { n: lastDone.n })
                      : undefined
                }
                undoA11y={batch ? t('session.rest.undoBatchA11y', { count: batch }) : undefined}
                rateable={isRateable(session)}
                note={doneExercise?.restNote}
                doneExerciseId={last?.exerciseId}
                onMinimize={() => setMinimized(true)}
              />
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}
