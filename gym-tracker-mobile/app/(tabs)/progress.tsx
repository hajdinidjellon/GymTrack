import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProgressChart } from '@/components/charts/ProgressChart';
import { VolumeBar, MiniVolumeBar } from '@/components/charts/VolumeBar';
import { MuscleHeatmap } from '@/components/muscle/MuscleHeatmap';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { calculate1RM } from '@/lib/aiPlanner';
import { colors } from '@/constants/theme';
import type { MuscleGroup } from '@/types';

type ProgressTab = 'exercises' | 'volume' | 'muscles';

const TABS: Array<{ id: ProgressTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'exercises', label: 'Exercices',  icon: 'barbell-outline'    },
  { id: 'volume',    label: 'Volume',     icon: 'bar-chart-outline'  },
  { id: 'muscles',   label: 'Muscles',    icon: 'body-outline'       },
];

export default function ProgressScreen() {
  const { workouts }  = useWorkoutStore();
  const { profile }   = useProfileStore();
  const units         = useSettingsStore((s) => s.settings.units);

  const [activeTab, setActiveTab]           = useState<ProgressTab>('exercises');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [heatmapPeriod, setHeatmapPeriod]   = useState<7 | 30>(7);

  const exercises = useMemo(() => {
    const map = new Map<string, { name: string; dataPoints: Array<{ date: string; maxWeight: number; totalVolume: number; estimated1RM: number }> }>();
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        if (!map.has(exercise.name)) map.set(exercise.name, { name: exercise.name, dataPoints: [] });
        const maxWeight  = Math.max(...exercise.sets.map((s) => s.weight), 0);
        const maxReps    = exercise.sets.find((s) => s.weight === maxWeight)?.reps ?? 1;
        const totalVolume = exercise.sets.reduce((t, s) => t + s.weight * s.reps, 0);
        map.get(exercise.name)!.dataPoints.push({ date: workout.date, maxWeight, totalVolume, estimated1RM: calculate1RM(maxWeight, maxReps) });
      }
    }
    return Array.from(map.values())
      .map((e) => ({ ...e, dataPoints: [...e.dataPoints].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) }))
      .filter((e) => e.dataPoints.length >= 2)
      .sort((a, b) => b.dataPoints.length - a.dataPoints.length);
  }, [workouts]);

  const weeklyVolume = useMemo(() => {
    const start = new Date(); start.setDate(start.getDate() - 7);
    const byMuscle = new Map<MuscleGroup, { sets: number; volume: number }>();
    for (const workout of workouts) {
      if (new Date(workout.date) < start) continue;
      for (const exercise of workout.exercises) {
        for (const muscle of exercise.muscleGroups) {
          const prev = byMuscle.get(muscle) ?? { sets: 0, volume: 0 };
          byMuscle.set(muscle, { sets: prev.sets + exercise.sets.length, volume: prev.volume + exercise.sets.reduce((t, s) => t + s.weight * s.reps, 0) });
        }
      }
    }
    return Array.from(byMuscle.entries()).map(([muscle, v]) => ({ muscle, ...v })).sort((a, b) => b.sets - a.sets);
  }, [workouts]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 2.5, textTransform: 'uppercase' }}>
            Analyse
          </Text>
          <Text style={{ fontSize: 36, fontWeight: '900', color: colors.text.primary, letterSpacing: -1, lineHeight: 42 }}>
            Progression
          </Text>
        </View>

        {/* Tab selector */}
        <View style={{ flexDirection: 'row', marginHorizontal: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          {TABS.map((tab) => (
            <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
              {activeTab === tab.id ? (
                <LinearGradient colors={['#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Ionicons name={tab.icon} size={14} color="#fff" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <View style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Ionicons name={tab.icon} size={14} color={colors.text.muted} />
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.muted }}>{tab.label}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* ── Exercices ── */}
        {activeTab === 'exercises' && (
          <View style={{ paddingHorizontal: 24, gap: 12 }}>
            {exercises.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
                <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(124,58,237,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.20)' }}>
                  <Ionicons name="trending-up-outline" size={28} color={colors.brand.primary} />
                </View>
                <Text style={{ fontSize: 15, color: colors.text.muted, textAlign: 'center', lineHeight: 22 }}>
                  Fais au moins 2 séances avec le même exercice pour voir ta progression.
                </Text>
              </View>
            ) : (
              <>
                {exercises.map((ex) => {
                  const first      = ex.dataPoints[0];
                  const latest     = ex.dataPoints[ex.dataPoints.length - 1];
                  // Compare les 1RM estimés — 110kg×5 = 1RM 128kg > 120kg×1 = 1RM 120kg
                  const progression = latest && first && first.estimated1RM > 0
                    ? ((latest.estimated1RM - first.estimated1RM) / first.estimated1RM) * 100
                    : 0;
                  const isSelected = selectedExercise === ex.name;

                  return (
                    <Pressable key={ex.name} onPress={() => setSelectedExercise(isSelected ? null : ex.name)}>
                      <View style={{
                        borderRadius: 18, overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: isSelected ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.08)',
                        backgroundColor: isSelected ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.04)',
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
                          <LinearGradient
                            colors={isSelected ? ['#7c3aed', '#06b6d4'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                            style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Ionicons name="barbell-outline" size={20} color={isSelected ? '#fff' : colors.text.muted} />
                          </LinearGradient>

                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text.primary }}>{ex.name}</Text>
                            <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
                              {ex.dataPoints.length} séances{latest ? ` · PR ${latest.maxWeight}${units}` : ''}
                            </Text>
                          </View>

                          {progression !== 0 && (
                            <View style={{
                              flexDirection: 'row', alignItems: 'center', gap: 4,
                              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
                              backgroundColor: progression > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            }}>
                              <Ionicons name={progression > 0 ? 'trending-up' : 'trending-down'} size={14} color={progression > 0 ? colors.status.success : colors.status.danger} />
                              <Text style={{ fontSize: 13, fontWeight: '800', color: progression > 0 ? colors.status.success : colors.status.danger }}>
                                {Math.abs(progression).toFixed(1)}%
                              </Text>
                            </View>
                          )}
                        </View>

                        {isSelected && (
                          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                            <ProgressChart data={ex.dataPoints} exerciseName={ex.name} metric="estimated1RM" height={180} units={units} />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}

                {/* PRs */}
                {profile?.prs && profile.prs.length > 0 && (
                  <View style={{ gap: 10, marginTop: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 2.5, textTransform: 'uppercase' }}>
                      Records personnels
                    </Text>
                    {profile.prs.map((pr) => (
                      <View key={pr.exercise} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="trophy-outline" size={20} color="#f59e0b" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text.primary }}>{pr.exercise}</Text>
                          <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
                            {format(new Date(pr.date), 'd MMM yyyy', { locale: fr })} · 1RM ~{pr.oneRepMax.toFixed(1)}{units}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 17, fontWeight: '900', color: colors.text.primary }}>
                          {pr.weight}{units} × {pr.reps}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* ── Volume ── */}
        {activeTab === 'volume' && (
          <View style={{ paddingHorizontal: 24, gap: 12 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 2, textTransform: 'uppercase' }}>
                Volume par muscle — 7 jours
              </Text>
              {weeklyVolume.length > 0 ? (
                <>
                  <VolumeBar data={weeklyVolume} metric="sets" height={180} />
                  <View style={{ gap: 6, marginTop: 8 }}>
                    {weeklyVolume.map((d) => (
                      <MiniVolumeBar key={d.muscle} muscle={d.muscle} sets={d.sets} maxSets={Math.max(...weeklyVolume.map((x) => x.sets), 1)} />
                    ))}
                  </View>
                </>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
                  <Ionicons name="bar-chart-outline" size={32} color={colors.text.muted} />
                  <Text style={{ fontSize: 14, color: colors.text.muted }}>Aucune séance cette semaine</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Muscles ── */}
        {activeTab === 'muscles' && (
          <View style={{ paddingHorizontal: 24, gap: 12 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <MuscleHeatmap workouts={workouts} period={heatmapPeriod} onPeriodChange={setHeatmapPeriod} />
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
