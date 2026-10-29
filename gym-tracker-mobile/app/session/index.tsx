import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space } from '@/constants/theme';
import { findCurrent } from '@/domain/sessionCursor';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { SetView } from '@/components/session/SetView';
import { RestMini, RestView } from '@/components/session/RestView';
import { CalibrationView } from '@/components/session/CalibrationView';
import { SessionProgress } from '@/components/session/SessionProgress';
import { SwapExercise } from '@/components/session/SwapExercise';
import { DoLater } from '@/components/session/DoLater';

// Pendant qu'on quitte l'écran, la séance est déjà vidée : on ne redirige pas une deuxième fois
let leaving = false;

/** Saves what was done and opens the summary. Nothing done: nothing saved. */
async function finish() {
  leaving = true;
  const workout = useSessionStore.getState().finishSession();
  if (!workout || workout.exercises.length === 0) {
    router.dismissTo('/(tabs)');
    return;
  }
  await useWorkoutStore.getState().addWorkout(workout);
  router.replace({ pathname: '/session/summary', params: { id: workout.id } });
}

function confirmFinish(left: number) {
  const message =
    left > 0
      ? `Il reste ${left} série${left > 1 ? 's' : ''}. Les séries déjà validées sont enregistrées.`
      : 'Les séries validées sont enregistrées.';
  Alert.alert('Terminer la séance ?', message, [
    { text: 'Continuer', style: 'cancel' },
    {
      text: 'Abandonner',
      style: 'destructive',
      onPress: () => {
        leaving = true;
        useSessionStore.getState().discardSession();
        router.dismissTo('/(tabs)');
      },
    },
    { text: 'Terminer', onPress: () => void finish() },
  ]);
}

export default function SessionScreen() {
  const session = useSessionStore((s) => s.activeSession);
  const insets = useSafeAreaInsets();
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

  // Dernière série validée : direction le bilan, sans bouton à chercher
  useEffect(() => {
    if (done) void finish();
  }, [done]);

  useEffect(() => {
    if (!session && !leaving) router.dismissTo('/(tabs)');
  }, [session]);

  if (!session || !cursor)
    return (
      <Screen>
        <View />
      </Screen>
    );

  const { exercise, exerciseIndex, setIndex } = cursor;
  const last = session.lastCompleted;
  const doneExercise = last && session.exercises.find((e) => e.id === last.exerciseId);
  const left = session.exercises.reduce((n, e) => n + e.sets.filter((set) => !set.completed).length, 0);

  // Pendant le repos, le bas de l'écran garde le minuteur en petit ; en grand, il s'ouvre au milieu
  const rest = resting ? <RestMini restEndsAt={session.restEndsAt!} onExpand={() => setMinimized(false)} /> : null;

  return (
    <Screen style={{ paddingBottom: Math.max(insets.bottom, space.lg) + space.sm }}>
      <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text size={16} weight="black" numberOfLines={1} style={{ flex: 1 }}>
          {session.name}
          <Text size={15} weight="bold" color={colors.inkMuted}>
            {'  '}· exercice {exerciseIndex + 1} sur {session.exercises.length}
          </Text>
        </Text>
        <Pressable onPress={() => confirmFinish(left)} accessibilityRole="button" hitSlop={12}>
          <Text size={16} weight="black" style={{ textDecorationLine: 'underline' }}>
            Terminer
          </Text>
        </Pressable>
      </View>
      <SessionProgress
        exercises={session.exercises}
        current={exerciseIndex}
        onPick={(id) => useSessionStore.getState().doNow(id)}
      />

      <View style={{ marginTop: space.xl, flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Text size={30} weight="black" accessibilityRole="header" numberOfLines={2} style={{ flex: 1, lineHeight: 34 }}>
          {exercise.name}
        </Text>
        <SwapExercise exercise={exercise} sessionName={session.name} />
      </View>
      <View
        style={{ marginTop: space.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View
          style={{
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: radius.pill,
            borderWidth: 2,
            borderColor: colors.ink,
            backgroundColor: colors.card,
          }}
        >
          <Text size={14} weight="black">
            {resting ? 'Prochaine série' : 'Série'} {setIndex + 1} sur {exercise.sets.length}
          </Text>
        </View>
        <DoLater exercise={exercise} />
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
        <View style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: space.gutter }}>
          <Pressable
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            onPress={() => setMinimized(true)}
            accessibilityLabel="Réduire le minuteur"
          />
          {resting ? (
            <RestView
              next={cursor}
              restEndsAt={session.restEndsAt!}
              total={session.restDuration ?? 90}
              doneLabel={doneExercise ? `Série ${last.setIndex + 1} validée` : undefined}
              note={doneExercise?.restNote}
              onMinimize={() => setMinimized(true)}
            />
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}
