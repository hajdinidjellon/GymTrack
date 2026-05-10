import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ProgressChart } from '@/components/charts/ProgressChart';
import { Card } from '@/components/ui/Card';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { calculate1RM } from '@/lib/aiPlanner';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { workouts } = useWorkoutStore();
  const units = useSettingsStore((s) => s.settings.units);

  const exerciseName = decodeURIComponent(id ?? '');

  const exerciseData = useMemo(() => {
    const dataPoints = workouts
      .filter((w) =>
        w.exercises.some(
          (e) => e.name.toLowerCase() === exerciseName.toLowerCase(),
        ),
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((w) => {
        const ex = w.exercises.find(
          (e) => e.name.toLowerCase() === exerciseName.toLowerCase(),
        )!;
        const maxWeight = Math.max(...ex.sets.map((s) => s.weight), 0);
        const maxReps =
          ex.sets.find((s) => s.weight === maxWeight)?.reps ?? 1;
        const totalVolume = ex.sets.reduce(
          (t, s) => t + s.weight * s.reps,
          0,
        );
        return {
          date: w.date,
          maxWeight,
          totalVolume,
          estimated1RM: calculate1RM(maxWeight, maxReps),
        };
      });

    return dataPoints;
  }, [workouts, exerciseName]);

  // Historique détaillé des séances contenant cet exercice
  const history = workouts
    .filter((w) =>
      w.exercises.some(
        (e) => e.name.toLowerCase() === exerciseName.toLowerCase(),
      ),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const pr = exerciseData.reduce<number>((max, d) => Math.max(max, d.maxWeight), 0);
  const pr1RM = exerciseData.reduce<number>((max, d) => Math.max(max, d.estimated1RM), 0);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <ScrollView contentContainerClassName="pb-8">
        {/* Header */}
        <View className="px-5 py-4 gap-3">
          <Pressable onPress={() => router.back()}>
            <Text className="text-text-secondary text-sm">← Retour</Text>
          </Pressable>

          <Text className="text-2xl font-black text-text-primary">
            {exerciseName}
          </Text>

          {/* Stats */}
          <View className="flex-row gap-3">
            <Card padding="sm" className="flex-1 items-center gap-1">
              <Text className="text-xl font-black text-text-primary">{pr}{units}</Text>
              <Text className="text-xs text-text-muted">Record</Text>
            </Card>
            <Card padding="sm" className="flex-1 items-center gap-1">
              <Text className="text-xl font-black text-brand-secondary">
                {pr1RM.toFixed(1)}{units}
              </Text>
              <Text className="text-xs text-text-muted">1RM estimé</Text>
            </Card>
            <Card padding="sm" className="flex-1 items-center gap-1">
              <Text className="text-xl font-black text-text-primary">
                {exerciseData.length}
              </Text>
              <Text className="text-xs text-text-muted">Séances</Text>
            </Card>
          </View>
        </View>

        {/* Graphique progression */}
        {exerciseData.length >= 2 && (
          <View className="px-5 mb-4">
            <Card padding="md">
              <ProgressChart
                data={exerciseData}
                exerciseName={exerciseName}
                metric="estimated1RM"
                height={200}
              />
            </Card>
          </View>
        )}

        {/* Historique */}
        <View className="px-5 gap-3">
          <Text className="text-base font-semibold text-text-primary">
            Historique
          </Text>
          {history.map((workout) => {
            const ex = workout.exercises.find(
              (e) => e.name.toLowerCase() === exerciseName.toLowerCase(),
            )!;
            const topSet = ex.sets.reduce(
              (best, s) =>
                calculate1RM(s.weight, s.reps) >
                calculate1RM(best.weight, best.reps)
                  ? s
                  : best,
              ex.sets[0]!,
            );

            return (
              <Pressable
                key={workout.id}
                onPress={() =>
                  router.push({
                    pathname: '/workout/[id]',
                    params: { id: workout.id },
                  })
                }
              >
                <Card padding="md" className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-text-primary">
                      {new Date(workout.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text className="text-xs text-text-muted">
                      {ex.sets.length} séries
                    </Text>
                  </View>
                  {topSet && (
                    <View className="items-end">
                      <Text className="text-sm font-bold text-text-primary">
                        {topSet.weight}{units} × {topSet.reps}
                      </Text>
                      <Text className="text-xs text-brand-secondary">
                        ~{calculate1RM(topSet.weight, topSet.reps).toFixed(1)} 1RM
                      </Text>
                    </View>
                  )}
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
