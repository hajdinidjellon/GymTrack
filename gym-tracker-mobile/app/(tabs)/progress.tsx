import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProgressChart } from '@/components/charts/ProgressChart';
import { VolumeBar, MiniVolumeBar } from '@/components/charts/VolumeBar';
import { MuscleHeatmap } from '@/components/muscle/MuscleHeatmap';
import { Mascot } from '@/components/mascot/Mascot';
import { ScreenBackground, BG_COLORS } from '@/components/ui/ScreenBackground';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { calculate1RM } from '@/lib/aiPlanner';
import type { MuscleGroup } from '@/types';

type ProgressTab = 'exercises' | 'volume' | 'muscles';

const TABS: Array<{ id: ProgressTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'exercises', label: 'Exercices', icon: 'barbell-outline'   },
  { id: 'volume',    label: 'Volume',    icon: 'bar-chart-outline' },
  { id: 'muscles',   label: 'Muscles',   icon: 'body-outline'      },
];

export default function ProgressScreen() {
  const { workouts } = useWorkoutStore();
  const { profile }  = useProfileStore();
  const units        = useSettingsStore((s) => s.settings.units);

  const [activeTab, setActiveTab]               = useState<ProgressTab>('exercises');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [heatmapPeriod, setHeatmapPeriod]       = useState<7 | 30>(7);

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const exercises = useMemo(() => {
    const map = new Map<string, { name: string; dataPoints: Array<{ date: string; maxWeight: number; totalVolume: number; estimated1RM: number }> }>();
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        if (!map.has(exercise.name)) map.set(exercise.name, { name: exercise.name, dataPoints: [] });
        const maxWeight   = Math.max(...exercise.sets.map((s) => s.weight), 0);
        const maxReps     = exercise.sets.find((s) => s.weight === maxWeight)?.reps ?? 1;
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
    <View style={{ flex: 1, backgroundColor: BG_COLORS.base }}>
      <ScreenBackground variant="progress" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ── HEADER ── */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: BG_COLORS.accent, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>
                Analyse
              </Text>
              <Text style={{ fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1.6, lineHeight: 42 }}>
                Progression
              </Text>
              <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.50)', fontWeight: '600', marginTop: 8, lineHeight: 20 }}>
                Mesure ton évolution sur chaque exercice et muscle.
              </Text>
            </View>

            {/* ── TABS ── */}
            <View style={{
              flexDirection: 'row', marginHorizontal: 20,
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 14, padding: 4, marginBottom: 22,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            }}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1, borderRadius: 10,
                      backgroundColor: isActive ? BG_COLORS.accent : 'transparent',
                      paddingVertical: 11,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <Ionicons name={tab.icon} size={14} color={isActive ? '#07090f' : 'rgba(255,255,255,0.45)'} />
                    <Text style={{
                      fontSize: 12, fontWeight: '900',
                      color: isActive ? '#07090f' : 'rgba(255,255,255,0.45)',
                      letterSpacing: 0.5, textTransform: 'uppercase',
                    }}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── EXERCICES ── */}
            {activeTab === 'exercises' && (
              <View style={{ paddingHorizontal: 20, gap: 12 }}>
                {exercises.length === 0 ? (
                  <View style={{
                    alignItems: 'center',
                    paddingVertical: 32, paddingHorizontal: 18,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 24, borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.06)', gap: 16,
                  }}>
                    <Mascot pose="mimi_mesure" height={140} animate float />
                    <View style={{ alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.8, lineHeight: 26 }}>
                        Pas encore assez{'\n'}de données
                      </Text>
                      <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', textAlign: 'center', fontWeight: '600', lineHeight: 20, paddingHorizontal: 8 }}>
                        Fais au moins 2 séances avec le même exercice pour voir ta progression.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    {exercises.map((ex) => {
                      const first       = ex.dataPoints[0];
                      const latest      = ex.dataPoints[ex.dataPoints.length - 1];
                      const progression = latest && first && first.estimated1RM > 0
                        ? ((latest.estimated1RM - first.estimated1RM) / first.estimated1RM) * 100
                        : 0;
                      const isSelected = selectedExercise === ex.name;

                      return (
                        <Pressable key={ex.name} onPress={() => setSelectedExercise(isSelected ? null : ex.name)}>
                          <View style={{
                            borderRadius: 18, overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: isSelected ? 'rgba(56,189,248,0.45)' : 'rgba(255,255,255,0.08)',
                            backgroundColor: isSelected ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.04)',
                          }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
                              <View style={{
                                width: 44, height: 44, borderRadius: 14,
                                backgroundColor: isSelected ? `${BG_COLORS.accent}28` : 'rgba(255,255,255,0.06)',
                                borderWidth: 1,
                                borderColor: isSelected ? `${BG_COLORS.accent}45` : 'rgba(255,255,255,0.08)',
                                alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Ionicons
                                  name="barbell"
                                  size={20}
                                  color={isSelected ? BG_COLORS.accent : 'rgba(255,255,255,0.50)'}
                                />
                              </View>

                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }}>
                                  {ex.name}
                                </Text>
                                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '600', marginTop: 2 }}>
                                  {ex.dataPoints.length} séances{latest ? ` · PR ${latest.maxWeight}${units}` : ''}
                                </Text>
                              </View>

                              {progression !== 0 && (
                                <View style={{
                                  flexDirection: 'row', alignItems: 'center', gap: 4,
                                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
                                  backgroundColor: progression > 0 ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
                                  borderWidth: 1,
                                  borderColor: progression > 0 ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)',
                                }}>
                                  <Ionicons
                                    name={progression > 0 ? 'trending-up' : 'trending-down'}
                                    size={13}
                                    color={progression > 0 ? '#10b981' : '#ef4444'}
                                  />
                                  <Text style={{
                                    fontSize: 12, fontWeight: '900',
                                    color: progression > 0 ? '#10b981' : '#ef4444',
                                  }}>
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

                    {profile?.prs && profile.prs.length > 0 && (
                      <View style={{ gap: 10, marginTop: 12 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                          Records personnels
                        </Text>
                        {profile.prs.map((pr) => (
                          <View key={pr.exercise} style={{
                            flexDirection: 'row', alignItems: 'center', gap: 14,
                            padding: 16, borderRadius: 16,
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                          }}>
                            <View style={{
                              width: 44, height: 44, borderRadius: 14,
                              backgroundColor: 'rgba(251,191,36,0.16)',
                              borderWidth: 1, borderColor: 'rgba(251,191,36,0.32)',
                              alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Ionicons name="trophy" size={20} color="#fbbf24" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }}>
                                {pr.exercise}
                              </Text>
                              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '600', marginTop: 2 }}>
                                {format(new Date(pr.date), 'd MMM yyyy', { locale: fr })} · 1RM ~{pr.oneRepMax.toFixed(1)}{units}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
                              {pr.weight}<Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', fontWeight: '700' }}>{units}</Text>
                              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', fontWeight: '700' }}> ×{pr.reps}</Text>
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* ── VOLUME ── */}
            {activeTab === 'volume' && (
              <View style={{ paddingHorizontal: 20, gap: 12 }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 22, padding: 18,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 16,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                    Volume par muscle — 7 jours
                  </Text>
                  {weeklyVolume.length > 0 ? (
                    <>
                      <VolumeBar data={weeklyVolume} metric="sets" height={180} />
                      <View style={{ gap: 6, marginTop: 8 }}>
                        {weeklyVolume.map((d) => (
                          <MiniVolumeBar
                            key={d.muscle} muscle={d.muscle}
                            sets={d.sets}
                            maxSets={Math.max(...weeklyVolume.map((x) => x.sets), 1)}
                          />
                        ))}
                      </View>
                    </>
                  ) : (
                    <View style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
                      <Ionicons name="bar-chart-outline" size={36} color="rgba(255,255,255,0.25)" />
                      <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: '600' }}>
                        Aucune séance cette semaine
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ── MUSCLES ── */}
            {activeTab === 'muscles' && (
              <View style={{ paddingHorizontal: 20, gap: 12 }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 22, padding: 18,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                }}>
                  <MuscleHeatmap workouts={workouts} period={heatmapPeriod} onPeriodChange={setHeatmapPeriod} />
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
