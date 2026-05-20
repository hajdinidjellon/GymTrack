import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, RefreshControl, Image,
  Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format, startOfWeek, addDays, isSameDay, isThisWeek } from 'date-fns';
import { useT, useDateLocale } from '@/lib/i18n';
import { RankCard } from '@/components/gamification/RankCard';
import { MuscleMapSVG } from '@/components/muscle/MuscleMapSVG';
import { Mascot } from '@/components/mascot/Mascot';
import { ScreenBackground, BG_COLORS } from '@/components/ui/ScreenBackground';
import { WeeklyComparison } from '@/components/charts/WeeklyComparison';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { getMuscleActivity, MUSCLE_LABELS } from '@/lib/gamification';
import { getSuggestedSession } from '@/lib/aiPlanner';
import { useCelebrationStore } from '@/stores/celebrationStore';
import { initialSync } from '@/lib/sync';
import type { MuscleGroup, Workout, PersonalRecord } from '@/types';

const LOGO = require('@/assets/logo.png') as number;

const FEELING_COLOR: Record<number, string> = {
  1: '#ef4444',
  2: '#f87171',
  3: '#fbbf24',
  4: '#a3e635',
  5: '#34d399',
};

function heatColor(v: number): string {
  if (v <= 0) return 'rgba(255,255,255,0.10)';
  if (v < 25) return 'rgba(147,197,253,0.80)';
  if (v < 60) return 'rgba(251,191,36,0.85)';
  if (v < 85) return 'rgba(249,115,22,0.90)';
  return 'rgba(239,68,68,0.95)';
}

function workoutVolume(w: Workout): number {
  return w.exercises.reduce((tot, ex) =>
    tot + ex.sets.reduce((s, set) => s + (set.completed === false ? 0 : set.weight * set.reps), 0)
  , 0);
}

function workoutSets(w: Workout): number {
  return w.exercises.reduce((t, ex) => t + ex.sets.filter((s) => s.completed !== false).length, 0);
}

function workoutMuscles(w: Workout): MuscleGroup[] {
  const set = new Set<MuscleGroup>();
  w.exercises.forEach((ex) => ex.muscleGroups.forEach((m) => set.add(m)));
  return Array.from(set);
}

export default function DashboardScreen() {
  const { workouts, loadWorkouts, setWorkouts } = useWorkoutStore();
  const { profile, loadProfile, saveProfile, getTotalXP, getCurrentRank, getStreak } = useProfileStore();
  const { activeSession } = useSessionStore();
  const [refreshing, setRefreshing]         = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [heatPeriod, setHeatPeriod]         = useState<7 | 30>(7);
  const showCelebration  = useCelebrationStore((s) => s.show);
  const goalShownWeekRef = useRef<string | null>(null);
  const t = useT();
  const dateLocale = useDateLocale();

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadWorkouts();
    loadProfile();
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Pulsation streak fire
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const remote = await initialSync();
    if (remote) {
      setWorkouts(remote.workouts);
      if (remote.profile) await saveProfile(remote.profile);
    }
    setRefreshing(false);
  };

  // ── Stats dérivées ─────────────────────────────────────────────
  const streak        = getStreak();
  const totalXP       = getTotalXP();
  const rank          = getCurrentRank();
  const activity      = getMuscleActivity(workouts, heatPeriod);
  const suggested     = profile ? getSuggestedSession(profile, workouts, null) : null;
  const firstName     = profile?.name?.trim().split(' ')[0] ?? '';
  const target        = profile?.trainingFrequency ?? 3;
  const bodyWeight    = profile?.bodyStats?.[0]?.weight;

  const thisWeekCount = useMemo(
    () => workouts.filter((w) => isThisWeek(new Date(w.date), { weekStartsOn: 1 })).length,
    [workouts],
  );

  // Célébration objectif hebdo — une seule fois par semaine
  useEffect(() => {
    if (thisWeekCount < target || target === 0) return;
    const now  = new Date();
    const week = `${now.getFullYear()}-W${Math.ceil((now.getDate() - now.getDay() + 10) / 7)}`;
    if (goalShownWeekRef.current === week) return;
    goalShownWeekRef.current = week;
    showCelebration({
      type: 'weekly_goal',
      title: t('dashboard.weeklyGoalReached'),
      subtitle: t('dashboard.weeklyGoalSubtitle', { n: target, plural: target > 1 ? 's' : '' }),
    });
  }, [thisWeekCount, target, t]);

  // Dots semaine : lun → dim
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i);
      const trained = workouts.some((w) => isSameDay(new Date(w.date), day));
      return { day, trained, isToday: isSameDay(day, new Date()), isFuture: day.getTime() > Date.now() };
    });
  }, [workouts]);

  const MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'calves'];
  const prs                    = profile?.prs ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: BG_COLORS.base }}>
      <ScreenBackground variant="home" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BG_COLORS.accent} />
            }
          >

            {/* ─── HEADER ─────────────────────────────────── */}
            <View style={{ paddingTop: 12, paddingBottom: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Image source={LOGO} style={{ width: 34, height: 34 }} resizeMode="contain" />
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.3 }}>
                    GYMTRACK
                  </Text>
                </View>

                {streak > 0 && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 12, paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: 'rgba(249,115,22,0.14)',
                    borderWidth: 1, borderColor: 'rgba(249,115,22,0.35)',
                  }}>
                    <Animated.Text style={{ fontSize: 13, transform: [{ scale: pulse }] }}>🔥</Animated.Text>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#fb923c', letterSpacing: 0.3 }}>
                      {streak} j
                    </Text>
                  </View>
                )}
              </View>

              <Text style={{ fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1.4, lineHeight: 38 }}>
                {firstName ? t('dashboard.greeting', { name: firstName }) : t('dashboard.greetingAnon')}
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', fontWeight: '600', marginTop: 6, lineHeight: 19, textTransform: 'capitalize' }}>
                {format(new Date(), "EEEE d MMMM", { locale: dateLocale })}
              </Text>
            </View>

            {/* ─── RANG HERO ──────────────────────────────── */}
            {rank && (
              <View style={{ marginBottom: 16 }}>
                <RankCard rank={rank} totalXP={totalXP} homeHero />
              </View>
            )}

            {/* ─── STATS KPI STRIP ─────────────────────────── */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <StatCard
                icon="flame"
                iconColor="#fb923c"
                value={streak}
                label={t('dashboard.streak')}
                unit={streak === 1 ? t('unit.day') : t('unit.days')}
                accent={streak > 0}
              />
              <StatCard
                icon="checkmark-done"
                iconColor={BG_COLORS.accent}
                value={`${thisWeekCount}/${target}`}
                label={t('dashboard.thisWeek')}
                unit={t('unit.sessions')}
                accent={thisWeekCount >= target}
              />
              <StatCard
                icon="trophy"
                iconColor="#fbbf24"
                value={workouts.length}
                label={t('dashboard.total')}
                unit={workouts.length > 1 ? t('unit.sessions') : t('unit.session')}
              />
            </View>

            {/* ─── COMPARAISON HEBDO ──────────────────── */}
            {workouts.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <WeeklyComparison workouts={workouts} target={target} />
              </View>
            )}

            {/* ─── WEEKLY DOTS ──────────────────────────── */}
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 18, borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              paddingVertical: 14, paddingHorizontal: 14,
              marginBottom: 20,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase' }}>
                  {t('dashboard.myWeek')}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.40)' }}>
                  {t('dashboard.weekGoal', { done: thisWeekCount, target })}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {weekDays.map((d, i) => {
                  const dayLabel = t(`days.${i}` as any);
                  return (
                    <View key={i} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
                      <Text style={{
                        fontSize: 10, fontWeight: '700',
                        color: d.isToday ? BG_COLORS.accent : 'rgba(255,255,255,0.40)',
                        letterSpacing: 0.5,
                      }}>
                        {dayLabel}
                      </Text>
                      <View style={{
                        width: 26, height: 26, borderRadius: 13,
                        backgroundColor: d.trained ? BG_COLORS.accent : 'transparent',
                        borderWidth: d.trained ? 0 : 1.5,
                        borderColor: d.isToday ? BG_COLORS.accent : (d.isFuture ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.20)'),
                        alignItems: 'center', justifyContent: 'center',
                        opacity: d.isFuture && !d.trained ? 0.5 : 1,
                      }}>
                        {d.trained && <Ionicons name="checkmark" size={15} color="#07090f" />}
                        {!d.trained && d.isToday && (
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: BG_COLORS.accent }} />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ─── SÉANCE EN COURS ────────────────────────── */}
            {activeSession && (
              <Pressable
                onPress={() => router.push('/(tabs)/session')}
                style={({ pressed }) => ({
                  marginBottom: 20,
                  borderRadius: 22, overflow: 'hidden',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: '#10b981',
                  shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
                  elevation: 8,
                })}
              >
                <LinearGradient
                  colors={['rgba(16,185,129,0.22)', 'rgba(16,185,129,0.06)']}
                  style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.32)', borderRadius: 22 }}
                >
                  <View style={{
                    width: 48, height: 48, borderRadius: 16, backgroundColor: '#10b981',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="play" size={22} color="#07090f" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#10b981', letterSpacing: 1.6, textTransform: 'uppercase' }}>
                      {t('dashboard.activeSession')}
                    </Text>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff', marginTop: 2, letterSpacing: -0.3 }}>
                      {activeSession.exercises.length} exercices · {Math.floor(activeSession.elapsedSeconds / 60)} min
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#10b981" />
                </LinearGradient>
              </Pressable>
            )}

            {/* ─── SÉANCE DU JOUR ─────────────────────────── */}
            {suggested && !activeSession && (
              <View style={{
                marginBottom: 20,
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 22, borderWidth: 1,
                borderColor: 'rgba(56,189,248,0.20)',
                overflow: 'hidden',
              }}>
                <LinearGradient
                  colors={['rgba(56,189,248,0.14)', 'transparent']}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160 }}
                />

                <View style={{ padding: 22, gap: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: BG_COLORS.accent }} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: BG_COLORS.accent, letterSpacing: 2.5, textTransform: 'uppercase' }}>
                      {t('dashboard.suggestion')}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -1.1, lineHeight: 34 }}>
                    {suggested.title}
                  </Text>

                  {suggested.reason && (
                    <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600', lineHeight: 18 }}>
                      {suggested.reason}
                    </Text>
                  )}

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {suggested.focus.map((m) => (
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
                    <View style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                    }}>
                      <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.55)" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 }}>
                        ~{suggested.estimatedDuration} min
                      </Text>
                    </View>
                    <View style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                    }}>
                      <Ionicons name="barbell-outline" size={11} color="rgba(255,255,255,0.55)" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 }}>
                        {suggested.exercises.length} exo{suggested.exercises.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => router.push('/(tabs)/session')}
                    style={({ pressed }) => ({
                      borderRadius: 18, overflow: 'hidden',
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      shadowColor: BG_COLORS.accent,
                      shadowOpacity: 0.50, shadowRadius: 22, shadowOffset: { width: 0, height: 10 },
                      elevation: 10,
                      marginTop: 4,
                    })}
                  >
                    <View style={{
                      backgroundColor: BG_COLORS.accent, borderRadius: 18, paddingVertical: 18,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                    }}>
                      <Ionicons name="flame" size={18} color="#07090f" />
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#07090f', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                        {t('common.start')}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            )}

            {/* ─── MANNEQUIN ──────────────────────────────── */}
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 22, borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
              marginBottom: 20,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingBottom: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                  {t('dashboard.heatmap')}
                </Text>
                <View style={{
                  flexDirection: 'row',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: 3,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                }}>
                  {([7, 30] as const).map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setHeatPeriod(p)}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 7,
                        backgroundColor: heatPeriod === p ? BG_COLORS.accent : 'transparent',
                      }}
                    >
                      <Text style={{
                        fontSize: 11, fontWeight: '800',
                        color: heatPeriod === p ? '#07090f' : 'rgba(255,255,255,0.45)',
                        letterSpacing: 0.5,
                      }}>
                        {p === 7 ? t('dashboard.period.7') : t('dashboard.period.30')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

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

              {selectedMuscle && (
                <View style={{
                  marginHorizontal: 16, marginBottom: 12,
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: 14, padding: 14,
                }}>
                  <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: heatColor(activity[selectedMuscle] ?? 0) }} />
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: '800', color: '#fff' }}>
                    {MUSCLE_LABELS[selectedMuscle]}
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: heatColor(activity[selectedMuscle] ?? 0) }}>
                    {activity[selectedMuscle] ?? 0}%
                  </Text>
                  <Pressable onPress={() => setSelectedMuscle(null)}>
                    <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.25)" />
                  </Pressable>
                </View>
              )}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 16, paddingTop: selectedMuscle ? 0 : 4 }}>
                {MUSCLES.map((m) => {
                  const val   = activity[m] ?? 0;
                  const isSel = selectedMuscle === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setSelectedMuscle((p) => p === m ? null : m)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10,
                        backgroundColor: isSel ? 'rgba(56,189,248,0.14)' : 'rgba(255,255,255,0.05)',
                        borderWidth: 1,
                        borderColor: isSel ? 'rgba(56,189,248,0.40)' : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: heatColor(val) }} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isSel ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                        {MUSCLE_LABELS[m]}
                      </Text>
                      {val > 0 && (
                        <Text style={{ fontSize: 12, fontWeight: '900', color: heatColor(val) }}>{val}%</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ─── PERSONAL RECORDS (scroll H) ────────────── */}
            {prs.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                    {t('progress.personalRecords')}
                  </Text>
                  <Pressable onPress={() => router.push('/(tabs)/profile')} hitSlop={8}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: BG_COLORS.accent, letterSpacing: 0.3 }}>
                      {t('common.seeMore')} →
                    </Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingRight: 4 }}
                >
                  {prs.slice(0, 6).map((pr, i) => <PRCard key={i} pr={pr} />)}
                </ScrollView>
              </View>
            )}

            {/* ─── HISTORIQUE — cards riches ──────────────── */}
            {workouts.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingHorizontal: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                    {t('dashboard.lastWorkouts')}
                  </Text>
                  <Pressable onPress={() => router.push('/(tabs)/progress')} hitSlop={8}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: BG_COLORS.accent, letterSpacing: 0.3 }}>
                      {t('common.seeMore')} →
                    </Text>
                  </Pressable>
                </View>

                <View style={{ gap: 12 }}>
                  {workouts.slice(0, 3).map((w) => <HistoryCard key={w.id} workout={w} />)}
                </View>
              </View>
            )}

            {/* ─── ZERO STATE ─────────────────────────────── */}
            {workouts.length === 0 && !activeSession && (
              <View style={{
                alignItems: 'center',
                paddingVertical: 32, paddingHorizontal: 18,
                marginTop: 8,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 24, borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)',
                gap: 20,
              }}>
                <Mascot pose="mimi_goal" height={150} animate float />

                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -1, lineHeight: 30 }}>
                    Prêt pour ta{'\n'}première séance ?
                  </Text>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', textAlign: 'center', fontWeight: '600', lineHeight: 20, paddingHorizontal: 12 }}>
                    On va construire ton historique ensemble, set après set.
                  </Text>
                </View>

                <Pressable
                  onPress={() => router.push('/(tabs)/session')}
                  style={({ pressed }) => ({
                    width: '100%', borderRadius: 18, overflow: 'hidden',
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    shadowColor: BG_COLORS.accent,
                    shadowOpacity: 0.45, shadowRadius: 22, shadowOffset: { width: 0, height: 10 },
                    elevation: 10,
                  })}
                >
                  <View style={{
                    backgroundColor: BG_COLORS.accent, borderRadius: 18,
                    paddingVertical: 18, flexDirection: 'row',
                    alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}>
                    <Ionicons name="flame" size={18} color="#07090f" />
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#07090f', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                      {t('common.start')}
                    </Text>
                  </View>
                </Pressable>
              </View>
            )}

          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ── KPI Stat Card ───────────────────────────────────────────────────
function StatCard({
  icon, iconColor, value, label, unit, accent = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: number | string;
  label: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: accent ? `${iconColor}14` : 'rgba(255,255,255,0.04)',
      borderRadius: 16, borderWidth: 1,
      borderColor: accent ? `${iconColor}30` : 'rgba(255,255,255,0.08)',
      paddingVertical: 14, paddingHorizontal: 12,
      gap: 6,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={14} color={iconColor} />
        <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {label}
        </Text>
      </View>
      <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.8 }}>
        {value}
      </Text>
      {unit && (
        <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.40)', letterSpacing: 0.3 }}>
          {unit}
        </Text>
      )}
    </View>
  );
}

// ── Personal Record Card (horizontal scroll) ────────────────────────
function PRCard({ pr }: { pr: PersonalRecord }) {
  return (
    <View style={{
      width: 150,
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 16, borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      padding: 14, gap: 6,
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: 'rgba(251,191,36,0.16)',
        borderWidth: 1, borderColor: 'rgba(251,191,36,0.32)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name="trophy" size={16} color="#fbbf24" />
      </View>
      <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.2, textTransform: 'uppercase' }}>
        {pr.exercise}
      </Text>
      <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.7 }}>
        {pr.weight} <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', fontWeight: '700' }}>kg</Text>
      </Text>
      <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.40)' }}>
        {pr.reps} rep · 1RM ~{pr.oneRepMax.toFixed(0)}
      </Text>
    </View>
  );
}

// ── History Card (rich) ─────────────────────────────────────────────
function HistoryCard({ workout }: { workout: Workout }) {
  const vol     = workoutVolume(workout);
  const sets    = workoutSets(workout);
  const muscles = workoutMuscles(workout);
  const feelingColor = FEELING_COLOR[workout.feeling] ?? '#94a3b8';
  const dateLocale = useDateLocale();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })}
      style={({ pressed }) => ({
        borderRadius: 20, overflow: 'hidden',
        backgroundColor: pressed ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View style={{ padding: 16, gap: 12 }}>
        {/* Header : titre + feeling + chevron */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{
            width: 46, height: 46, borderRadius: 14,
            backgroundColor: 'rgba(56,189,248,0.14)',
            borderWidth: 1, borderColor: 'rgba(56,189,248,0.28)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: BG_COLORS.accent, letterSpacing: -0.5 }}>
              {workout.exercises.length}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.3 }}>
                {workout.name}
              </Text>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: feelingColor }} />
            </View>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '600', textTransform: 'capitalize' }}>
              {format(new Date(workout.date), "EEEE d MMMM", { locale: dateLocale })}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.25)" />
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 12, paddingTop: 4 }}>
          <StatMini icon="time-outline"      label={workout.duration ? `${workout.duration} min` : '—'} />
          <StatMini icon="layers-outline"    label={`${sets} sets`} />
          <StatMini icon="barbell-outline"   label={vol > 0 ? `${(vol / 1000).toFixed(1)}t` : '—'} />
        </View>

        {/* Muscles chips */}
        {muscles.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 2 }}>
            {muscles.slice(0, 4).map((m) => (
              <View key={m} style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
              }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.60)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  {MUSCLE_LABELS[m]}
                </Text>
              </View>
            ))}
            {muscles.length > 4 && (
              <View style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.40)' }}>
                  +{muscles.length - 4}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

function StatMini({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Ionicons name={icon} size={13} color="rgba(255,255,255,0.45)" />
      <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.65)' }}>
        {label}
      </Text>
    </View>
  );
}
