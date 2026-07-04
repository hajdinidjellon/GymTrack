import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert,
  Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScreenBackground, BG_COLORS } from '@/components/ui/ScreenBackground';
import { Mascot } from '@/components/mascot/Mascot';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { calculate1RM } from '@/lib/aiPlanner';
import { MUSCLE_LABELS } from '@/lib/gamification';
import type { SetType } from '@/types';

const FEELING_COLOR: Record<number, string> = {
  1: '#ef4444', 2: '#f87171', 3: '#fbbf24', 4: '#a3e635', 5: '#34d399',
};
const FEELING_LABEL: Record<number, string> = {
  1: 'Difficile', 2: 'Moyen', 3: 'Correct', 4: 'Bien', 5: 'Excellent',
};

const SET_TYPE_LABEL: Record<SetType, string> = {
  warmup: 'CHAUFFE', normal: 'WORK', top: 'TOP',
  backoff: 'BACKOFF', amrap: 'AMRAP', drop: 'DROP', failure: 'ÉCHEC',
};
const SET_TYPE_COLOR: Record<SetType, string> = {
  warmup: '#60a5fa', normal: 'rgba(255,255,255,0.55)', top: '#fbbf24',
  backoff: '#38bdf8', amrap: '#34d399', drop: '#e879f9', failure: '#ef4444',
};

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getWorkoutById, deleteWorkout } = useWorkoutStore();
  const units = useSettingsStore((s) => s.settings.units);
  const workout = getWorkoutById(id ?? '');

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  if (!workout) {
    return (
      <View style={{ flex: 1, backgroundColor: BG_COLORS.base }}>
        <ScreenBackground variant="home" />
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 24 }}>
          <Mascot pose="mimi_target" height={140} animate float />
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.6 }}>
            Séance introuvable
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              borderRadius: 18, overflow: 'hidden',
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: BG_COLORS.accent,
              shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            })}
          >
            <View style={{
              backgroundColor: BG_COLORS.accent, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 28,
              flexDirection: 'row', alignItems: 'center', gap: 8,
            }}>
              <Ionicons name="chevron-back" size={18} color="#07090f" />
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#07090f', letterSpacing: 1, textTransform: 'uppercase' }}>
                Retour
              </Text>
            </View>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const totalVolume = workout.exercises.reduce(
    (t, e) => t + e.sets.reduce((s, set) => s + set.weight * set.reps, 0),
    0,
  );
  const totalSets = workout.exercises.reduce((t, e) => t + e.sets.length, 0);
  const allMuscles = [...new Set(workout.exercises.flatMap((e) => e.muscleGroups))];

  const handleDelete = () => {
    Alert.alert(
      'Supprimer cette séance ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => {
          deleteWorkout(workout.id);
          router.back();
        }},
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG_COLORS.base }}>
      <ScreenBackground variant="home" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Back button */}
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

            {/* Header séance */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: BG_COLORS.accent, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>
                Séance
              </Text>
              <Text style={{ fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1.4, lineHeight: 38 }}>
                {workout.name}
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', fontWeight: '600', marginTop: 6, textTransform: 'capitalize' }}>
                {format(new Date(workout.date), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
              </Text>
            </View>

            {/* Stats KPI */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <DetailStat icon="time-outline"      label="Durée"   value={workout.duration ? `${workout.duration}` : '—'} unit="min" color={BG_COLORS.accent} />
              <DetailStat icon="barbell-outline"   label="Volume"  value={(totalVolume / 1000).toFixed(1)}                   unit="t"   color="#a78bfa" />
              <DetailStat icon="layers-outline"    label="Séries"  value={String(totalSets)}                                  unit="sets" color="#34d399" />
            </View>

            {/* Feeling */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: `${FEELING_COLOR[workout.feeling] ?? '#94a3b8'}10`,
              borderRadius: 16, padding: 14, marginBottom: 20,
              borderWidth: 1, borderColor: `${FEELING_COLOR[workout.feeling] ?? '#94a3b8'}30`,
            }}>
              <View style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: `${FEELING_COLOR[workout.feeling] ?? '#94a3b8'}22`,
                borderWidth: 1, borderColor: `${FEELING_COLOR[workout.feeling] ?? '#94a3b8'}40`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons
                  name={workout.feeling >= 4 ? 'happy' : workout.feeling >= 3 ? 'ellipse-outline' : 'sad-outline'}
                  size={20}
                  color={FEELING_COLOR[workout.feeling] ?? '#94a3b8'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                  Sensation
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.3, marginTop: 2 }}>
                  {FEELING_LABEL[workout.feeling] ?? 'Non noté'} · {workout.feeling}/5
                </Text>
              </View>
            </View>

            {/* Muscles */}
            {allMuscles.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10 }}>
                  Muscles travaillés
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {allMuscles.map((m) => (
                    <View key={m} style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                      backgroundColor: 'rgba(56,189,248,0.14)',
                      borderWidth: 1, borderColor: 'rgba(56,189,248,0.32)',
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {MUSCLE_LABELS[m]}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Exercices */}
            <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12 }}>
              Exercices · {workout.exercises.length}
            </Text>

            <View style={{ gap: 12 }}>
              {workout.exercises.map((exercise) => {
                const maxWeight = Math.max(...exercise.sets.map((s) => s.weight), 0);
                const maxSet    = exercise.sets.find((s) => s.weight === maxWeight) ?? exercise.sets[0]!;
                const estimated1RM = calculate1RM(maxWeight, maxSet?.reps ?? 1);
                const hasRPE = exercise.sets.some((s) => s.rpe != null);

                return (
                  <Pressable
                    key={exercise.id}
                    onPress={() => router.push({
                      pathname: '/exercise/[id]',
                      params: { id: exercise.name },
                    })}
                    style={({ pressed }) => ({
                      borderRadius: 20, overflow: 'hidden',
                      backgroundColor: pressed ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.04)',
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                    })}
                  >
                    <View style={{ padding: 16, gap: 12 }}>
                      {/* Header exo */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{
                          width: 38, height: 38, borderRadius: 11,
                          backgroundColor: 'rgba(56,189,248,0.14)',
                          borderWidth: 1, borderColor: 'rgba(56,189,248,0.28)',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Ionicons name="barbell" size={18} color={BG_COLORS.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: -0.2 }}>
                            {exercise.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '700', marginTop: 2 }}>
                            {exercise.sets.length} sets · 1RM ~{estimated1RM.toFixed(1)}{units}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.30)" />
                      </View>

                      {/* Tableau des sets */}
                      <View style={{
                        backgroundColor: 'rgba(0,0,0,0.20)',
                        borderRadius: 12, overflow: 'hidden',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
                      }}>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8, backgroundColor: 'rgba(255,255,255,0.03)' }}>
                          <Text style={{ width: 22, fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 0.8, textTransform: 'uppercase' }}>#</Text>
                          <Text style={{ flex: 1, fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 0.8, textTransform: 'uppercase' }}>Poids</Text>
                          <Text style={{ flex: 1, fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 0.8, textTransform: 'uppercase' }}>Reps</Text>
                          <Text style={{ width: 60, fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 0.8, textTransform: 'uppercase' }}>Type</Text>
                          {hasRPE && <Text style={{ width: 30, fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 0.8, textTransform: 'uppercase' }}>RPE</Text>}
                        </View>

                        {exercise.sets.map((set, i) => {
                          const isTop = set.weight === maxWeight && set.weight > 0;
                          const typeColor = SET_TYPE_COLOR[set.setType];
                          return (
                            <View
                              key={i}
                              style={{
                                flexDirection: 'row', alignItems: 'center', gap: 8,
                                paddingHorizontal: 12, paddingVertical: 9,
                                borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
                                backgroundColor: isTop ? 'rgba(56,189,248,0.06)' : 'transparent',
                              }}
                            >
                              <Text style={{ width: 22, fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.40)' }}>
                                {i + 1}
                              </Text>
                              <Text style={{ flex: 1, fontSize: 14, fontWeight: '900', color: isTop ? BG_COLORS.accent : '#fff', letterSpacing: -0.2 }}>
                                {set.weight}<Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.45)' }}>{units}</Text>
                              </Text>
                              <Text style={{ flex: 1, fontSize: 14, fontWeight: '900', color: '#fff' }}>
                                {set.reps}
                              </Text>
                              <View style={{
                                width: 60,
                                backgroundColor: `${typeColor}18`,
                                borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3,
                                alignItems: 'center',
                              }}>
                                <Text style={{ fontSize: 9, fontWeight: '900', color: typeColor, letterSpacing: 0.5 }}>
                                  {SET_TYPE_LABEL[set.setType]}
                                </Text>
                              </View>
                              {hasRPE && (
                                <Text style={{ width: 30, fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
                                  {set.rpe ?? '—'}
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>

                      {exercise.notes && (
                        <View style={{
                          flexDirection: 'row', gap: 8, alignItems: 'flex-start',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderRadius: 10, padding: 10,
                        }}>
                          <Ionicons name="document-text-outline" size={13} color="rgba(255,255,255,0.45)" style={{ marginTop: 2 }} />
                          <Text style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600', lineHeight: 17 }}>
                            {exercise.notes}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Notes séance */}
            {workout.notes && (
              <View style={{
                marginTop: 16, padding: 16,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
                gap: 8,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase' }}>
                  Notes
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '600', lineHeight: 20 }}>
                  {workout.notes}
                </Text>
              </View>
            )}

            {/* Supprimer */}
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => ({
                marginTop: 24,
                paddingVertical: 16, paddingHorizontal: 18,
                borderRadius: 16,
                backgroundColor: pressed ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.08)',
                borderWidth: 1, borderColor: 'rgba(239,68,68,0.28)',
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              })}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#ef4444', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Supprimer cette séance
              </Text>
            </Pressable>
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
      borderRadius: 16, borderWidth: 1,
      borderColor: `${color}28`,
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
