import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProgressChart } from '@/components/charts/ProgressChart';
import { VolumeBar, MiniVolumeBar } from '@/components/charts/VolumeBar';
import { MuscleHeatmap } from '@/components/muscle/MuscleHeatmap';
import { Card } from '@/components/ui/Card';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { calculate1RM } from '@/lib/aiPlanner';
import type { MuscleGroup } from '@/types';

type ProgressTab = 'exercises' | 'volume' | 'muscles';

export default function ProgressScreen() {
  const { workouts } = useWorkoutStore();
  const { profile } = useProfileStore();
  const units = useSettingsStore((s) => s.settings.units);
  const [activeTab, setActiveTab] = useState<ProgressTab>('exercises');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [heatmapPeriod, setHeatmapPeriod] = useState<7 | 30>(7);

  // Exercices uniques avec données de progression
  const exercises = useMemo(() => {
    const map = new Map<
      string,
      { name: string; dataPoints: Array<{ date: string; maxWeight: number; totalVolume: number; estimated1RM: number }> }
    >();

    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        if (!map.has(exercise.name)) {
          map.set(exercise.name, { name: exercise.name, dataPoints: [] });
        }
        const maxWeight = Math.max(...exercise.sets.map((s) => s.weight), 0);
        const maxReps =
          exercise.sets.find((s) => s.weight === maxWeight)?.reps ?? 1;
        const totalVolume = exercise.sets.reduce(
          (t, s) => t + s.weight * s.reps,
          0,
        );

        map.get(exercise.name)!.dataPoints.push({
          date: workout.date,
          maxWeight,
          totalVolume,
          estimated1RM: calculate1RM(maxWeight, maxReps),
        });
      }
    }

    return Array.from(map.values())
      .filter((e) => e.dataPoints.length >= 2)
      .sort((a, b) => b.dataPoints.length - a.dataPoints.length);
  }, [workouts]);

  const selectedData = exercises.find((e) => e.name === selectedExercise);

  // Volume par groupe musculaire cette semaine
  const weeklyVolume = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const data: Array<{ muscle: MuscleGroup; sets: number; volume: number }> = [];

    const byMuscle = new Map<MuscleGroup, { sets: number; volume: number }>();

    for (const workout of workouts) {
      if (new Date(workout.date) < start) continue;
      for (const exercise of workout.exercises) {
        for (const muscle of exercise.muscleGroups) {
          const prev = byMuscle.get(muscle) ?? { sets: 0, volume: 0 };
          byMuscle.set(muscle, {
            sets: prev.sets + exercise.sets.length,
            volume:
              prev.volume +
              exercise.sets.reduce((t, s) => t + s.weight * s.reps, 0),
          });
        }
      }
    }

    byMuscle.forEach((v, muscle) => {
      data.push({ muscle, sets: v.sets, volume: v.volume });
    });

    return data.sort((a, b) => b.sets - a.sets);
  }, [workouts]);

  const TABS: Array<{ id: ProgressTab; label: string }> = [
    { id: 'exercises', label: 'Exercices' },
    { id: 'volume', label: 'Volume' },
    { id: 'muscles', label: 'Muscles' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <ScrollView contentContainerClassName="pb-8">
        {/* Header */}
        <View className="px-5 pt-4 pb-4 gap-2">
          <Text className="text-2xl font-black text-text-primary">
            Progression
          </Text>

          {/* Tabs */}
          <View className="flex-row bg-white/[0.06] rounded-xl p-1 mt-2">
            {TABS.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-lg items-center ${activeTab === tab.id ? 'bg-brand-primary' : ''}`}
              >
                <Text
                  className={`text-sm font-medium ${activeTab === tab.id ? 'text-white' : 'text-text-secondary'}`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Onglet Exercices */}
        {activeTab === 'exercises' && (
          <View className="px-5 gap-4">
            {exercises.length === 0 ? (
              <Card padding="lg" className="items-center gap-2 py-12">
                <Text className="text-4xl">📈</Text>
                <Text className="text-text-muted text-center">
                  Fais au moins 2 séances avec le même exercice pour voir ta progression.
                </Text>
              </Card>
            ) : (
              <>
                {/* Liste exercices */}
                <View className="gap-2">
                  {exercises.map((ex) => {
                    const latest = ex.dataPoints[ex.dataPoints.length - 1];
                    const first = ex.dataPoints[0];
                    const progression =
                      latest && first
                        ? ((latest.estimated1RM - first.estimated1RM) /
                            first.estimated1RM) *
                          100
                        : 0;

                    return (
                      <Pressable
                        key={ex.name}
                        onPress={() =>
                          setSelectedExercise(
                            selectedExercise === ex.name ? null : ex.name,
                          )
                        }
                      >
                        <Card
                          padding="md"
                          className={selectedExercise === ex.name ? 'border-brand-primary' : ''}
                        >
                          <View className="flex-row items-center gap-3">
                            <View
                              className="w-10 h-10 rounded-xl items-center justify-center"
                              style={{ backgroundColor: 'rgba(124,58,237,0.15)' }}
                            >
                              <Text>💪</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-sm font-semibold text-text-primary">
                                {ex.name}
                              </Text>
                              <Text className="text-xs text-text-muted">
                                {ex.dataPoints.length} séances
                                {latest
                                  ? ` · PR: ${latest.maxWeight}kg`
                                  : ''}
                              </Text>
                            </View>
                            {progression !== 0 && (
                              <Text
                                className="text-sm font-bold"
                                style={{
                                  color:
                                    progression > 0
                                      ? '#10b981'
                                      : '#ef4444',
                                }}
                              >
                                {progression > 0 ? '▲' : '▼'}{' '}
                                {Math.abs(progression).toFixed(1)}%
                              </Text>
                            )}
                          </View>

                          {/* Graphique inline */}
                          {selectedExercise === ex.name && (
                            <View className="mt-4">
                              <ProgressChart
                                data={ex.dataPoints}
                                exerciseName={ex.name}
                                metric="estimated1RM"
                                height={180}
                                units={units}
                              />
                            </View>
                          )}
                        </Card>
                      </Pressable>
                    );
                  })}
                </View>

                {/* PRs du profil */}
                {profile?.prs && profile.prs.length > 0 && (
                  <View className="gap-2">
                    <Text className="text-base font-semibold text-text-primary">
                      Records personnels
                    </Text>
                    {profile.prs.map((pr) => (
                      <Card key={pr.exercise} padding="md" className="flex-row items-center gap-3">
                        <Text className="text-2xl">🏆</Text>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-text-primary">
                            {pr.exercise}
                          </Text>
                          <Text className="text-xs text-text-muted">
                            {format(new Date(pr.date), 'd MMM yyyy', { locale: fr })}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-base font-bold text-text-primary">
                            {pr.weight}kg × {pr.reps}
                          </Text>
                          <Text className="text-xs text-brand-secondary">
                            1RM ~{pr.oneRepMax.toFixed(1)}kg
                          </Text>
                        </View>
                      </Card>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Onglet Volume */}
        {activeTab === 'volume' && (
          <View className="px-5 gap-4">
            <Card padding="md">
              <Text className="text-sm font-semibold text-text-secondary mb-3">
                Volume par muscle — 7 derniers jours
              </Text>
              {weeklyVolume.length > 0 ? (
                <>
                  <VolumeBar data={weeklyVolume} metric="sets" height={180} />
                  <View className="gap-1 mt-4">
                    {weeklyVolume.map((d) => (
                      <MiniVolumeBar
                        key={d.muscle}
                        muscle={d.muscle}
                        sets={d.sets}
                        maxSets={
                          Math.max(...weeklyVolume.map((x) => x.sets), 1)
                        }
                      />
                    ))}
                  </View>
                </>
              ) : (
                <Text className="text-text-muted text-center py-8">
                  Aucune séance cette semaine
                </Text>
              )}
            </Card>
          </View>
        )}

        {/* Onglet Muscles */}
        {activeTab === 'muscles' && (
          <View className="px-5 gap-4">
            <Card padding="md">
              <MuscleHeatmap
                workouts={workouts}
                period={heatmapPeriod}
                onPeriodChange={setHeatmapPeriod}
              />
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
