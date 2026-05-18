import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable,
  Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProgressChart } from '@/components/charts/ProgressChart';
import { ScreenBackground, BG_COLORS } from '@/components/ui/ScreenBackground';
import { Mascot } from '@/components/mascot/Mascot';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { calculate1RM } from '@/lib/aiPlanner';

type Metric = 'estimated1RM' | 'maxWeight' | 'totalVolume';

const METRIC_OPTIONS: Array<{ id: Metric; label: string }> = [
  { id: 'estimated1RM', label: '1RM' },
  { id: 'maxWeight',    label: 'Max' },
  { id: 'totalVolume',  label: 'Volume' },
];

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { workouts } = useWorkoutStore();
  const units = useSettingsStore((s) => s.settings.units);

  const exerciseName = decodeURIComponent(id ?? '');
  const [metric, setMetric] = useState<Metric>('estimated1RM');

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const exerciseData = useMemo(() => {
    return workouts
      .filter((w) => w.exercises.some((e) => e.name.toLowerCase() === exerciseName.toLowerCase()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((w) => {
        const ex = w.exercises.find((e) => e.name.toLowerCase() === exerciseName.toLowerCase())!;
        const maxWeight   = Math.max(...ex.sets.map((s) => s.weight), 0);
        const maxReps     = ex.sets.find((s) => s.weight === maxWeight)?.reps ?? 1;
        const totalVolume = ex.sets.reduce((t, s) => t + s.weight * s.reps, 0);
        return {
          date: w.date,
          maxWeight,
          totalVolume,
          estimated1RM: calculate1RM(maxWeight, maxReps),
        };
      });
  }, [workouts, exerciseName]);

  const history = useMemo(() =>
    workouts
      .filter((w) => w.exercises.some((e) => e.name.toLowerCase() === exerciseName.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12)
  , [workouts, exerciseName]);

  const pr        = exerciseData.reduce((max, d) => Math.max(max, d.maxWeight), 0);
  const pr1RM     = exerciseData.reduce((max, d) => Math.max(max, d.estimated1RM), 0);
  const totalVol  = exerciseData.reduce((sum, d) => sum + d.totalVolume, 0);

  // Progression % entre première et dernière séance
  const first = exerciseData[0];
  const last  = exerciseData[exerciseData.length - 1];
  const progression = first && last && first.estimated1RM > 0
    ? ((last.estimated1RM - first.estimated1RM) / first.estimated1RM) * 100
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: BG_COLORS.base }}>
      <ScreenBackground variant="progress" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <View style={{ paddingTop: 6, paddingBottom: 14 }}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={10}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  alignSelf: 'flex-start',
                  paddingVertical: 6, paddingHorizontal: 12, marginLeft: -8,
                  borderRadius: 12,
                  backgroundColor: pressed ? 'rgba(56,189,248,0.10)' : 'transparent',
                })}
              >
                <Ionicons name="chevron-back" size={20} color={BG_COLORS.accent} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: BG_COLORS.accent, letterSpacing: 0.3 }}>
                  Retour
                </Text>
              </Pressable>
            </View>

            {/* Header exercice */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: BG_COLORS.accent, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>
                Exercice
              </Text>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1.3, lineHeight: 36 }}>
                {exerciseName}
              </Text>
              {exerciseData.length > 0 && (
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', fontWeight: '600', marginTop: 6 }}>
                  {exerciseData.length} séance{exerciseData.length > 1 ? 's' : ''} enregistrée{exerciseData.length > 1 ? 's' : ''}
                  {progression !== 0 && (
                    <Text> · <Text style={{
                      color: progression > 0 ? '#34d399' : '#ef4444',
                      fontWeight: '800',
                    }}>
                      {progression > 0 ? '+' : ''}{progression.toFixed(1)}%
                    </Text></Text>
                  )}
                </Text>
              )}
            </View>

            {exerciseData.length === 0 ? (
              <View style={{
                alignItems: 'center', paddingVertical: 32, paddingHorizontal: 18,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 16,
              }}>
                <Mascot pose="mimi_mesure" height={140} animate float />
                <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontWeight: '600', lineHeight: 22 }}>
                  Aucune donnée pour cet exercice.{'\n'}Fais-le dans une séance pour suivre ta progression.
                </Text>
              </View>
            ) : (
              <>
                {/* Stats KPI */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  <DetailStat icon="trophy"           label="Record"    value={`${pr}`}            unit={units} color="#fbbf24" />
                  <DetailStat icon="trending-up"      label="1RM est."  value={pr1RM.toFixed(1)}   unit={units} color={BG_COLORS.accent} />
                  <DetailStat icon="barbell-outline"  label="Volume"    value={`${(totalVol / 1000).toFixed(1)}`} unit="t" color="#a78bfa" />
                </View>

                {/* Chart card */}
                {exerciseData.length >= 2 && (
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 22, borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                    padding: 16, marginBottom: 20, gap: 14,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase' }}>
                        Évolution
                      </Text>
                      <View style={{
                        flexDirection: 'row',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        borderRadius: 10, padding: 3,
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                      }}>
                        {METRIC_OPTIONS.map((m) => {
                          const isActive = metric === m.id;
                          return (
                            <Pressable
                              key={m.id}
                              onPress={() => setMetric(m.id)}
                              style={{
                                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7,
                                backgroundColor: isActive ? BG_COLORS.accent : 'transparent',
                              }}
                            >
                              <Text style={{
                                fontSize: 10, fontWeight: '900',
                                color: isActive ? '#07090f' : 'rgba(255,255,255,0.45)',
                                letterSpacing: 0.5, textTransform: 'uppercase',
                              }}>
                                {m.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                    <ProgressChart
                      data={exerciseData}
                      exerciseName={exerciseName}
                      metric={metric}
                      height={200}
                      units={units}
                    />
                  </View>
                )}

                {/* Historique */}
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12 }}>
                  Historique · {history.length}
                </Text>

                <View style={{ gap: 10 }}>
                  {history.map((workout) => {
                    const ex = workout.exercises.find(
                      (e) => e.name.toLowerCase() === exerciseName.toLowerCase()
                    )!;
                    const topSet = ex.sets.reduce(
                      (best, s) =>
                        calculate1RM(s.weight, s.reps) > calculate1RM(best.weight, best.reps) ? s : best,
                      ex.sets[0]!,
                    );
                    const isPR = topSet.weight === pr && topSet.weight > 0;

                    return (
                      <Pressable
                        key={workout.id}
                        onPress={() => router.push({
                          pathname: '/workout/[id]',
                          params: { id: workout.id },
                        })}
                        style={({ pressed }) => ({
                          borderRadius: 16, overflow: 'hidden',
                          backgroundColor: pressed ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.04)',
                          borderWidth: 1,
                          borderColor: isPR ? 'rgba(251,191,36,0.32)' : 'rgba(255,255,255,0.08)',
                        })}
                      >
                        <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{
                            width: 42, height: 42, borderRadius: 13,
                            backgroundColor: isPR ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.06)',
                            borderWidth: 1,
                            borderColor: isPR ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Ionicons
                              name={isPR ? 'trophy' : 'calendar-outline'}
                              size={18}
                              color={isPR ? '#fbbf24' : 'rgba(255,255,255,0.55)'}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: -0.2, textTransform: 'capitalize' }}>
                                {format(new Date(workout.date), "d MMM yyyy", { locale: fr })}
                              </Text>
                              {isPR && (
                                <View style={{
                                  backgroundColor: 'rgba(251,191,36,0.18)',
                                  borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
                                }}>
                                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#fbbf24', letterSpacing: 0.5 }}>
                                    PR
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '700', marginTop: 2 }}>
                              {ex.sets.length} sets · workout {workout.name}
                            </Text>
                          </View>
                          {topSet && (
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.4 }}>
                                {topSet.weight}<Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '700' }}>{units}</Text>
                                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', fontWeight: '700' }}> ×{topSet.reps}</Text>
                              </Text>
                              <Text style={{ fontSize: 10, fontWeight: '800', color: BG_COLORS.accent, marginTop: 2 }}>
                                1RM ~{calculate1RM(topSet.weight, topSet.reps).toFixed(1)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function DetailStat({
  icon, label, value, unit, color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit?: string;
  color: string;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: `${color}10`,
      borderRadius: 16, borderWidth: 1, borderColor: `${color}28`,
      padding: 14, gap: 6,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Ionicons name={icon} size={13} color={color} />
        <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {label}
        </Text>
      </View>
      <Text style={{ fontSize: 22, fontWeight: '900', color, letterSpacing: -0.7 }}>
        {value}
        {unit && <Text style={{ fontSize: 11, fontWeight: '700', color: `${color}99` }}> {unit}</Text>}
      </Text>
    </View>
  );
}
