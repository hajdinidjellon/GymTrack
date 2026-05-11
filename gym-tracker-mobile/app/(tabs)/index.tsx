import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RankCard } from '@/components/gamification/RankCard';
import { MuscleMapSVG } from '@/components/muscle/MuscleMapSVG';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { calculateStreakFromWorkouts, getMuscleActivity, MUSCLE_LABELS } from '@/lib/gamification';
import { getSuggestedSession } from '@/lib/aiPlanner';
import { initialSync } from '@/lib/sync';
import { colors } from '@/constants/theme';
import type { MuscleGroup } from '@/types';

const LOGO = require('@/assets/logo.png') as number;

function heatColor(v: number): string {
  if (v <= 0) return 'rgba(255,255,255,0.10)';
  if (v < 25) return 'rgba(147,197,253,0.80)';
  if (v < 60) return 'rgba(251,191,36,0.85)';
  if (v < 85) return 'rgba(249,115,22,0.90)';
  return 'rgba(239,68,68,0.95)';
}

export default function DashboardScreen() {
  const { workouts, loadWorkouts, setWorkouts } = useWorkoutStore();
  const { profile, loadProfile, saveProfile, getTotalXP, getCurrentRank } = useProfileStore();
  const { activeSession } = useSessionStore();
  const [refreshing, setRefreshing]           = useState(false);
  const [selectedMuscle, setSelectedMuscle]   = useState<MuscleGroup | null>(null);
  const [heatPeriod, setHeatPeriod]           = useState<7 | 30>(7);

  useEffect(() => { loadWorkouts(); loadProfile(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const remote = await initialSync();
    if (remote) { setWorkouts(remote.workouts); if (remote.profile) await saveProfile(remote.profile); }
    setRefreshing(false);
  };

  const totalXP  = getTotalXP();
  const rank     = getCurrentRank();
  const activity = getMuscleActivity(workouts, heatPeriod);
  const suggested = profile ? getSuggestedSession(profile, workouts, null) : null;

  const MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'calves'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080810' }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />}
      >

        {/* ─── HEADER minimal ─────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image source={LOGO} style={{ width: 30, height: 30 }} resizeMode="contain" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>GymTrack</Text>
          </View>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: '500', textTransform: 'capitalize' }}>
            {format(new Date(), 'EEEE d MMM', { locale: fr })}
          </Text>
        </View>

        {/* ─── 1. RANG ────────────────────────── */}
        {rank && (
          <View style={{ marginBottom: 24 }}>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 20, borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              padding: 16,
            }}>
              <RankCard rank={rank} totalXP={totalXP} compact />
            </View>
          </View>
        )}

        {/* ─── SÉANCE EN COURS ────────────────── */}
        {activeSession && (
          <Pressable
            onPress={() => router.push('/(tabs)/session')}
            style={{ marginBottom: 24 }}
          >
            <LinearGradient
              colors={['rgba(16,185,129,0.18)', 'rgba(16,185,129,0.06)']}
              style={{ borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.28)' }}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="play" size={20} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#10b981' }}>Séance en cours</Text>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', marginTop: 2 }}>
                  {activeSession.exercises.length} exercices · {Math.floor(activeSession.elapsedSeconds / 60)} min
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#10b981' }}>Reprendre →</Text>
            </LinearGradient>
          </Pressable>
        )}

        {/* ─── 2. SÉANCE DU JOUR ──────────────── */}
        {suggested && !activeSession && (
          <View style={{ marginBottom: 24 }}>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 20, borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>
              {/* Accent top */}
              <LinearGradient colors={['#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />

              <View style={{ padding: 20, gap: 14 }}>
                {/* Label */}
                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.30)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                  Séance du jour
                </Text>

                {/* Titre */}
                <Text style={{ fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.8, lineHeight: 34 }}>
                  {suggested.title}
                </Text>

                {/* Tags muscles */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {suggested.focus.map((m) => (
                    <View key={m} style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                      backgroundColor: 'rgba(124,58,237,0.18)',
                      borderWidth: 1, borderColor: 'rgba(124,58,237,0.35)',
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {MUSCLE_LABELS[m]}
                      </Text>
                    </View>
                  ))}
                  <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.40)' }}>
                      ~{suggested.estimatedDuration} min
                    </Text>
                  </View>
                </View>

                {/* CTA */}
                <Pressable onPress={() => router.push('/(tabs)/session')} style={{ borderRadius: 14, overflow: 'hidden' }}>
                  <LinearGradient colors={['#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <Ionicons name="play-circle" size={20} color="#fff" />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>Démarrer</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* ─── 3. MANNEQUIN ───────────────────── */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 20, borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
          marginBottom: 12,
        }}>
          {/* Header mannequin */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.30)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
              Muscles travaillés
            </Text>
            {/* Sélecteur période */}
            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 2 }}>
              {([7, 30] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setHeatPeriod(p)}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: heatPeriod === p ? '#7c3aed' : 'transparent' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: heatPeriod === p ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                    {p === 7 ? '7j' : '30j'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Corps avant + arrière */}
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <MuscleMapSVG
              activity={activity}
              selected={selectedMuscle}
              onMusclePress={(m) => setSelectedMuscle((p) => p === m ? null : m)}
              size="lg"
              showBoth
              showLegend={false}
            />
          </View>

          {/* Muscle sélectionné */}
          {selectedMuscle && (
            <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14 }}>
              <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: heatColor(activity[selectedMuscle] ?? 0) }} />
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#fff' }}>{MUSCLE_LABELS[selectedMuscle]}</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: heatColor(activity[selectedMuscle] ?? 0) }}>
                {activity[selectedMuscle] ?? 0}%
              </Text>
              <Pressable onPress={() => setSelectedMuscle(null)}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.25)" />
              </Pressable>
            </View>
          )}

          {/* Chips muscles compactes */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 16, paddingTop: selectedMuscle ? 0 : 4 }}>
            {MUSCLES.map((m) => {
              const val  = activity[m] ?? 0;
              const isSel = selectedMuscle === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setSelectedMuscle((p) => p === m ? null : m)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
                    backgroundColor: isSel ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: isSel ? 'rgba(124,58,237,0.40)' : 'rgba(255,255,255,0.07)',
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: heatColor(val) }} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.55)' }}>
                    {MUSCLE_LABELS[m]}
                  </Text>
                  {val > 0 && (
                    <Text style={{ fontSize: 12, fontWeight: '800', color: heatColor(val) }}>{val}%</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ─── HISTORIQUE ─────────────────────── */}
        {workouts.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.30)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                Dernières séances
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/progress')}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.brand.primary }}>Tout voir</Text>
              </Pressable>
            </View>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              {workouts.slice(0, 3).map((w, i) => (
                <Pressable
                  key={w.id}
                  onPress={() => router.push({ pathname: '/workout/[id]', params: { id: w.id } })}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    padding: 16,
                    borderBottomWidth: i < Math.min(workouts.length, 3) - 1 ? 1 : 0,
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <LinearGradient
                    colors={['rgba(124,58,237,0.22)', 'rgba(6,182,212,0.12)']}
                    style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#a78bfa' }}>
                      {w.exercises.length}
                    </Text>
                  </LinearGradient>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>{w.name}</Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                      {format(new Date(w.date), 'EEEE d MMM', { locale: fr })}
                      {w.duration ? ` · ${w.duration} min` : ''}
                      {' · '}{w.exercises.length} exo{w.exercises.length > 1 ? 's' : ''}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ─── ZERO STATE ─────────────────────── */}
        {workouts.length === 0 && !activeSession && (
          <View style={{ alignItems: 'center', paddingVertical: 32, gap: 16 }}>
            <LinearGradient colors={['rgba(124,58,237,0.18)', 'rgba(6,182,212,0.10)']} style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)' }}>
              <Ionicons name="barbell-outline" size={32} color="#a78bfa" />
            </LinearGradient>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.5 }}>
              Prêt pour ta{'\n'}première séance ?
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/session')} style={{ width: '100%', borderRadius: 14, overflow: 'hidden' }}>
              <LinearGradient colors={['#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="play-circle" size={20} color="#fff" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>C'est parti</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
