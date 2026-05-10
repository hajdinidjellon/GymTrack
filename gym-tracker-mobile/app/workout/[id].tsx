import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { SetTypeBadge } from '@/components/ui/Badge';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { calculate1RM } from '@/lib/aiPlanner';
import { MUSCLE_LABELS } from '@/lib/gamification';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getWorkoutById, deleteWorkout } = useWorkoutStore();
  const units = useSettingsStore((s) => s.settings.units);

  const workout = getWorkoutById(id ?? '');

  if (!workout) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary items-center justify-center">
        <Text className="text-text-muted">Séance introuvable</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-brand-primary">← Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const totalVolume = workout.exercises.reduce(
    (t, e) => t + e.sets.reduce((s, set) => s + set.weight * set.reps, 0),
    0,
  );
  const totalSets = workout.exercises.reduce((t, e) => t + e.sets.length, 0);
  const allMuscles = [
    ...new Set(workout.exercises.flatMap((e) => e.muscleGroups)),
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <ScrollView contentContainerClassName="pb-8">
        {/* Header */}
        <View className="px-5 py-4 gap-3">
          <Pressable onPress={() => router.back()}>
            <Text className="text-text-secondary text-sm">← Retour</Text>
          </Pressable>

          <View className="gap-1">
            <Text className="text-2xl font-black text-text-primary">
              {workout.name}
            </Text>
            <Text className="text-sm text-text-muted">
              {format(new Date(workout.date), "EEEE d MMMM yyyy 'à' HH'h'mm", {
                locale: fr,
              })}
            </Text>
          </View>

          {/* Stats résumé */}
          <View className="flex-row gap-3">
            {[
              { label: 'Durée', value: `${workout.duration ?? '—'} min` },
              { label: 'Volume', value: `${(totalVolume / 1000).toFixed(1)}t` },
              { label: 'Séries', value: String(totalSets) },
              { label: 'Feeling', value: workout.feeling ? '⭐'.repeat(workout.feeling) : '—' },
            ].map((s) => (
              <View
                key={s.label}
                className="flex-1 items-center py-2 rounded-xl bg-white/[0.06]"
              >
                <Text className="text-base font-bold text-text-primary">
                  {s.value}
                </Text>
                <Text className="text-xs text-text-muted">{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Muscles */}
          <View className="flex-row flex-wrap gap-1">
            {allMuscles.map((m) => (
              <View
                key={m}
                className="px-2 py-0.5 rounded-full bg-brand-primary/20"
              >
                <Text className="text-xs text-brand-primary">
                  {MUSCLE_LABELS[m]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exercices */}
        <View className="px-5 gap-3">
          {workout.exercises.map((exercise) => {
            const maxWeight = Math.max(...exercise.sets.map((s) => s.weight), 0);
            const maxReps =
              exercise.sets.find((s) => s.weight === maxWeight)?.reps ?? 1;
            const estimated1RM = calculate1RM(maxWeight, maxReps);

            return (
              <Pressable
                key={exercise.id}
                onPress={() =>
                  router.push({
                    pathname: '/exercise/[id]',
                    params: { id: exercise.name },
                  })
                }
              >
                <Card padding="md" className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-text-primary">
                      {exercise.name}
                    </Text>
                    <Text className="text-xs text-brand-secondary">
                      1RM ~{estimated1RM.toFixed(1)}kg
                    </Text>
                  </View>

                  {/* Tableau des séries */}
                  <View className="gap-1">
                    <View className="flex-row gap-2">
                      <Text className="text-xs text-text-muted w-6">#</Text>
                      <Text className="text-xs text-text-muted flex-1">Poids</Text>
                      <Text className="text-xs text-text-muted flex-1">Reps</Text>
                      <Text className="text-xs text-text-muted w-20">Type</Text>
                      {exercise.sets.some((s) => s.rpe) && (
                        <Text className="text-xs text-text-muted w-8">RPE</Text>
                      )}
                    </View>

                    {exercise.sets.map((set, i) => (
                      <View
                        key={i}
                        className="flex-row items-center gap-2 py-1.5 rounded-lg bg-white/[0.04] px-2"
                      >
                        <Text className="text-xs text-text-muted w-6">
                          {i + 1}
                        </Text>
                        <Text className="text-sm font-medium text-text-primary flex-1">
                          {set.weight}{units}
                        </Text>
                        <Text className="text-sm font-medium text-text-primary flex-1">
                          {set.reps}
                        </Text>
                        <View className="w-20">
                          <SetTypeBadge setType={set.setType} />
                        </View>
                        {exercise.sets.some((s) => s.rpe) && (
                          <Text className="text-xs text-text-muted w-8">
                            {set.rpe ?? '—'}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        {/* Supprimer */}
        <View className="px-5 mt-6">
          <Pressable
            onPress={() => {
              deleteWorkout(workout.id);
              router.back();
            }}
            className="py-3 rounded-xl items-center border border-status-danger/40"
          >
            <Text className="text-status-danger text-sm font-semibold">
              Supprimer cette séance
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
