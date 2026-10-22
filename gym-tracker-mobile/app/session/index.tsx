import React, { useEffect } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '@/constants/theme';
import { findCurrent } from '@/domain/sessionCursor';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { SetView } from '@/components/session/SetView';
import { RestView } from '@/components/session/RestView';
import { CalibrationView } from '@/components/session/CalibrationView';
import { SessionProgress } from '@/components/session/SessionProgress';

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
  const doneExercise = last && session.exercises.find((e) => e.id === last.exerciseId);
  const left = session.exercises.reduce((n, e) => n + e.sets.filter((set) => !set.completed).length, 0);

  return (
    <Screen style={{ paddingBottom: space.xl }}>
      <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text size={15} weight="bold" color={colors.muted}>
          {session.name} · exercice {exerciseIndex + 1} / {session.exercises.length}
        </Text>
        <Pressable onPress={() => confirmFinish(left)} accessibilityRole="button" hitSlop={12}>
          <Text size={17} weight="black" style={{ textDecorationLine: 'underline' }}>
            Terminer
          </Text>
        </Pressable>
      </View>
      <SessionProgress exercises={session.exercises} />

      {resting ? (
        <>
          <View
            style={{
              marginTop: space.lg,
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text size={30} weight="black" accessibilityRole="header">
                Repos
              </Text>
              {doneExercise ? (
                <Text size={14} color={colors.muted} numberOfLines={1}>
                  {doneExercise.name} · série {last.setIndex + 1} validée
                </Text>
              ) : null}
            </View>
            {doneExercise ? (
              <Pressable
                onPress={() => useSessionStore.getState().undoLastSet()}
                accessibilityRole="button"
                accessibilityLabel="Annuler la dernière série"
                hitSlop={10}
                style={({ pressed }) => ({
                  height: 34,
                  paddingHorizontal: 12,
                  borderRadius: 17,
                  justifyContent: 'center',
                  backgroundColor: pressed ? colors.line : colors.surfaceHigh,
                })}
              >
                <Text size={13} weight="black">
                  Annuler la série
                </Text>
              </Pressable>
            ) : null}
          </View>
          <RestView next={cursor} restEndsAt={session.restEndsAt!} total={session.restDuration ?? 90} />
        </>
      ) : (
        <>
          <Text
            size={28}
            weight="black"
            accessibilityRole="header"
            numberOfLines={2}
            style={{ marginTop: space.lg, lineHeight: 32 }}
          >
            {exercise.name}
          </Text>
          <SetDots total={exercise.sets.length} current={setIndex} />
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

/** "Série 2 sur 3" with one dot per set. */
function SetDots({ total, current }: { total: number; current: number }) {
  return (
    <View
      accessible
      accessibilityLabel={`Série ${current + 1} sur ${total}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs }}
    >
      <Text size={15} weight="bold" color={colors.muted}>
        Série {current + 1} sur {total}
      </Text>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={{
              width: 9,
              height: 9,
              borderRadius: 5,
              backgroundColor: i < current ? colors.cream : 'transparent',
              borderWidth: 2,
              borderColor: i === current ? colors.brass : i < current ? colors.cream : colors.line,
            }}
          />
        ))}
      </View>
    </View>
  );
}
