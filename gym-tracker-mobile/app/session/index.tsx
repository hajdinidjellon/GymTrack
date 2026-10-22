import React, { useEffect } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { findCurrent } from '@/domain/sessionCursor';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { SetView } from '@/components/session/SetView';
import { RestView } from '@/components/session/RestView';
import { CalibrationView } from '@/components/session/CalibrationView';

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

function confirmFinish() {
  Alert.alert('Terminer la séance ?', 'Les séries validées sont enregistrées.', [
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
  const cursor = session ? findCurrent(session.exercises) : null;
  const done = !!session && !cursor;

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

  const resting = session.restEndsAt != null;
  const { exercise, exerciseIndex, setIndex } = cursor;
  const last = session.lastCompleted;

  let header = `Série ${setIndex + 1} / ${exercise.sets.length} · Exercice ${exerciseIndex + 1} / ${session.exercises.length}`;
  if (resting && last) {
    const doneExercise = session.exercises.find((e) => e.id === last.exerciseId);
    header = `${doneExercise?.name ?? ''} · série ${last.setIndex + 1} validée`;
  }

  return (
    <Screen style={{ paddingBottom: 24 }}>
      <View
        style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <Text size={16} weight="semibold" color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>
          {header}
        </Text>
        <Pressable onPress={confirmFinish} accessibilityRole="button" hitSlop={10}>
          <Text size={17} weight="black" style={{ textDecorationLine: 'underline' }}>
            Terminer
          </Text>
        </Pressable>
      </View>

      {resting ? (
        <RestView next={cursor} restEndsAt={session.restEndsAt!} total={session.restDuration ?? 90} />
      ) : (
        <>
          <Text size={34} weight="black" numberOfLines={2} style={{ marginTop: 10 }}>
            {exercise.name}
          </Text>
          {exercise.needsWeight ? (
            <CalibrationView key={exercise.id} exercise={exercise} />
          ) : (
            <SetView cursor={cursor} />
          )}
        </>
      )}
    </Screen>
  );
}
