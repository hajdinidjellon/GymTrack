import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, RefreshControl, Image, ImageBackground,
  Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format, isThisWeek } from 'date-fns';
import { useT, useDateLocale } from '@/lib/i18n';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Filter, FeGaussianBlur } from 'react-native-svg';
import { Mascot } from '@/components/mascot/Mascot';
import { StatIcon } from '@/components/ui/StatIcon';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useCelebrationStore } from '@/stores/celebrationStore';
import { getSuggestedSession } from '@/lib/aiPlanner';
import { getNextRank, getProgressToNextRank, MUSCLE_LABELS } from '@/lib/gamification';
import { initialSync } from '@/lib/sync';
import type { Workout } from '@/types';

const LOGO       = require('@/assets/logo.png') as number;
const BG_AURORA  = require('@/assets/images/welcome-background.png') as number;
const BG_SESSION = require('@/assets/images/gym-session-tdy.png') as number;

const ACCENT = '#38bdf8';
const VIOLET = '#a78bfa';
const INK    = '#07090f';

function workoutVolume(w: Workout): number {
  return w.exercises.reduce(
    (tot, ex) => tot + ex.sets.reduce((s, set) => s + (set.completed === false ? 0 : set.weight * set.reps), 0),
    0,
  );
}

export default function DashboardScreen() {
  const { workouts, loadWorkouts, setWorkouts } = useWorkoutStore();
  const { profile, loadProfile, saveProfile, getTotalXP, getCurrentRank, getStreak } = useProfileStore();
  const { activeSession } = useSessionStore();
  const showCelebration  = useCelebrationStore((s) => s.show);
  const goalShownWeekRef = useRef<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
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

  // ── Données dérivées ────────────────────────────────────────────────
  const streak    = getStreak();
  const totalXP   = getTotalXP();
  const rank      = getCurrentRank();
  const nextRank  = rank ? getNextRank(rank.tier, rank.level) : null;
  const progress  = getProgressToNextRank(totalXP);
  const xpToNext  = nextRank ? Math.max(0, nextRank.minXP - totalXP) : 0;
  const level     = Math.floor(totalXP / 200) + 1;
  const suggested = profile ? getSuggestedSession(profile, workouts, null) : null;
  const firstName = profile?.name?.trim().split(' ')[0] ?? '';
  const target    = profile?.trainingFrequency ?? 3;

  const thisWeekCount = useMemo(
    () => workouts.filter((w) => isThisWeek(new Date(w.date), { weekStartsOn: 1 })).length,
    [workouts],
  );

  const weeklyVolumeT = useMemo(() => {
    const total = workouts
      .filter((w) => isThisWeek(new Date(w.date), { weekStartsOn: 1 }))
      .reduce((s, w) => s + workoutVolume(w), 0);
    return total / 1000;
  }, [workouts]);

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

  return (
    <View style={{ flex: 1, backgroundColor: INK }}>

      {/* ─── Hero background (aurores) ─────────────────────────────── */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 540 }}>
        <ImageBackground source={BG_AURORA} style={{ flex: 1 }} resizeMode="cover">
          <LinearGradient
            colors={['rgba(7,9,15,0.0)', 'rgba(7,9,15,0.15)', 'rgba(7,9,15,0.75)', INK]}
            locations={[0, 0.45, 0.82, 1]}
            style={{ flex: 1 }}
          />
        </ImageBackground>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
          >

            {/* ─── HEADER ─────────────────────────────────────────── */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Image source={LOGO} style={{ width: 32, height: 32 }} resizeMode="contain" />
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: -0.2 }}>
                    GYMTRACK
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.8 }}>
                    LIVING COMPANION
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => router.push('/(tabs)/profile')}
                style={({ pressed }) => ({
                  width: 44, height: 44, borderRadius: 22,
                  borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.45)',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(167,139,250,0.10)',
                  alignItems: 'center', justifyContent: 'center',
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                  shadowColor: VIOLET, shadowOpacity: 0.55, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
                })}
              >
                <View style={{ marginTop: 4 }}>
                  <Mascot pose="mimi_goal" height={50} />
                </View>
              </Pressable>
            </View>

            {/* ─── GREETING ───────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 22, marginTop: 6 }}>
              <Text style={{ fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1.5, lineHeight: 42 }}>
                {firstName ? `Bonjour ${firstName}` : 'Bonjour'}{' '}
                <Text style={{ fontSize: 34 }}>👋</Text>
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.55)', marginTop: 6, letterSpacing: 0.3, textTransform: 'capitalize' }}>
                {format(new Date(), "EEEE d MMMM", { locale: dateLocale })}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.45)', marginTop: 10, lineHeight: 20 }}>
                Un pas aujourd'hui,{'\n'}une version meilleure demain.
              </Text>
            </View>

            {/* ─── LEVEL / RANG — ring AAA flottant ───────────────── */}
            {rank && (
              <View style={{ paddingHorizontal: 22, marginTop: 22 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                  <RankRing progress={progress} level={level} size={96} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: VIOLET, letterSpacing: 3.5, textTransform: 'uppercase' }}>
                      {rank.name}
                    </Text>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.8 }}>
                      NIVEAU {level}
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.40)', marginTop: 2 }}>
                      {totalXP.toLocaleString()} XP
                    </Text>
                    <View style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 8 }}>
                      <LinearGradient
                        colors={[VIOLET, ACCENT]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ width: `${Math.min(100, progress)}%`, height: 3 }}
                      />
                    </View>
                    {nextRank && (
                      <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(167,139,250,0.70)', marginTop: 5, letterSpacing: 0.2 }}>
                        +{xpToNext.toLocaleString()} XP → {nextRank.name}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* ─── 4 STATS — HUD flottant ─────────────────────────── */}
            <View style={{
              flexDirection: 'row', alignItems: 'flex-start',
              paddingHorizontal: 24, marginTop: 30,
            }}>
              <FloatStat icon="streak" value={streak}                       label="ACTIFS"   glow="#fb923c" />
              <HUDDivider />
              <FloatStat icon="week"   value={`${thisWeekCount}/${target}`} label="SEMAINE"  glow={ACCENT}  />
              <HUDDivider />
              <FloatStat icon="total"  value={workouts.length}              label="SÉANCES"  glow={VIOLET}  />
              <HUDDivider />
              <FloatStat icon="volume" value={weeklyVolumeT.toFixed(1)} suffix="t" label="VOLUME" glow="#34d399" />
            </View>

            {/* ─── SÉANCE EN COURS (prioritaire) ──────────────────── */}
            {activeSession && (
              <Pressable
                onPress={() => router.push('/(tabs)/session')}
                style={({ pressed }) => ({
                  marginHorizontal: 22, marginTop: 26,
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
                    <Ionicons name="play" size={22} color={INK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#10b981', letterSpacing: 1.6, textTransform: 'uppercase' }}>
                      Séance en cours
                    </Text>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff', marginTop: 2, letterSpacing: -0.3 }}>
                      {activeSession.exercises.length} exercices · {Math.floor(activeSession.elapsedSeconds / 60)} min
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#10b981" />
                </LinearGradient>
              </Pressable>
            )}

            {/* ─── AUJOURD'HUI — séance suggérée ──────────────────── */}
            {suggested && !activeSession && (
              <View style={{ marginLeft: -20, marginRight: 0, marginTop: 28 }}>
                <Pressable
                  onPress={() => router.push('/(tabs)/session')}
                  style={({ pressed }) => ({
                    borderRadius: 28, overflow: 'hidden',
                    borderWidth: 1, borderColor: 'rgba(167,139,250,0.35)',
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                    shadowColor: VIOLET, shadowOpacity: 0.55, shadowRadius: 24, shadowOffset: { width: 0, height: 10 },
                    elevation: 12,
                  })}
                >
                  <ImageBackground
                    source={BG_SESSION}
                    style={{ minHeight: 280 }}
                    resizeMode="cover"
                  >
                    {/* Voile gauche → droite pour lisibilité du texte */}
                    <LinearGradient
                      colors={['rgba(10,4,28,0.82)', 'rgba(10,4,28,0.38)', 'rgba(10,4,28,0.0)']}
                      locations={[0, 0.55, 1]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />

                    <View style={{ padding: 20, paddingLeft: 28, paddingTop: 52, gap: 12, width: '68%' }}>
                      {/* Pill AUJOURD'HUI à l'intérieur */}
                      <View style={{
                        alignSelf: 'flex-start',
                        flexDirection: 'row', alignItems: 'center', gap: 5,
                        paddingHorizontal: 8, paddingVertical: 3,
                        borderRadius: 999,
                        backgroundColor: 'rgba(167,139,250,0.18)',
                      }}>
                        <Text style={{ fontSize: 8, color: VIOLET, fontWeight: '900' }}>✦</Text>
                        <Text style={{ fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 2.2 }}>
                          AUJOURD'HUI
                        </Text>
                        <Text style={{ fontSize: 8, color: VIOLET, fontWeight: '900' }}>✦</Text>
                      </View>

                      {/* Titre */}
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={{
                          fontSize: 34, fontWeight: '900', color: '#fff',
                          letterSpacing: -1.4, lineHeight: 36,
                          textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
                        }}
                      >
                        {suggested.title.toUpperCase()}
                      </Text>

                      {/* Focus */}
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 17 }}>
                        <Text style={{ fontWeight: '800' }}>Focus : </Text>
                        <Text style={{ color: ACCENT, fontWeight: '700' }}>
                          {suggested.focus.map((m) => MUSCLE_LABELS[m]).join(' • ')}
                        </Text>
                      </Text>

                      {/* CTA */}
                      <View style={{
                        alignSelf: 'flex-start',
                        borderRadius: 999, overflow: 'hidden',
                        shadowColor: ACCENT, shadowOpacity: 0.7, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
                        marginTop: 4,
                      }}>
                        <LinearGradient
                          colors={[ACCENT, VIOLET]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{
                            paddingLeft: 20, paddingRight: 16, paddingVertical: 12,
                            flexDirection: 'row', alignItems: 'center', gap: 10,
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '900', color: INK, letterSpacing: 1.6, textTransform: 'uppercase' }}>
                            Démarrer
                          </Text>
                          <Ionicons name="arrow-forward" size={15} color={INK} />
                        </LinearGradient>
                      </View>

                      {/* Méta */}
                      <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
                        <MetaPill icon="time-outline" label={`${suggested.estimatedDuration} MIN`} />
                        <MetaPill icon="barbell-outline" label={`${suggested.exercises.length} EXERCICES`} />
                      </View>
                    </View>
                  </ImageBackground>
                </Pressable>
              </View>
            )}

            {/* ─── SÉANCES RÉCENTES — pills horizontales ──────────── */}
            {workouts.length > 0 && (
              <View style={{ marginTop: 32 }}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 22, marginBottom: 14,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 2.6, textTransform: 'uppercase' }}>
                    Séances récentes
                  </Text>
                  <Pressable onPress={() => router.push('/(tabs)/progress')} hitSlop={8}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: ACCENT, letterSpacing: 0.3 }}>
                      Voir tout →
                    </Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingHorizontal: 22 }}
                >
                  {workouts.slice(0, 8).map((w) => <RecentPill key={w.id} workout={w} locale={dateLocale} />)}
                </ScrollView>
              </View>
            )}

            {/* ─── ZERO STATE ─────────────────────────────────────── */}
            {workouts.length === 0 && !activeSession && !suggested && (
              <View style={{
                marginHorizontal: 22, marginTop: 32,
                alignItems: 'center', paddingVertical: 32, paddingHorizontal: 18,
                borderRadius: 24,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
                backgroundColor: 'rgba(255,255,255,0.03)',
                gap: 20,
              }}>
                <View style={{ position: 'relative' }}>
                  <Animated.View style={{
                    position: 'absolute', width: 180, height: 180, borderRadius: 90,
                    backgroundColor: 'rgba(56,189,248,0.14)',
                    top: -15, left: -15,
                    transform: [{ scale: pulse }],
                  }} />
                  <Mascot pose="mimi_goal" height={150} animate float />
                </View>

                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -1, lineHeight: 30 }}>
                    Prêt pour ta{'\n'}première séance ?
                  </Text>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', textAlign: 'center', fontWeight: '600', lineHeight: 20 }}>
                    On va construire ton historique ensemble.
                  </Text>
                </View>

                <Pressable
                  onPress={() => router.push('/(tabs)/session')}
                  style={({ pressed }) => ({
                    width: '100%', borderRadius: 999, overflow: 'hidden',
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    shadowColor: ACCENT, shadowOpacity: 0.45, shadowRadius: 22, shadowOffset: { width: 0, height: 10 },
                  })}
                >
                  <LinearGradient
                    colors={[ACCENT, VIOLET]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                  >
                    <Ionicons name="flame" size={18} color={INK} />
                    <Text style={{ fontSize: 15, fontWeight: '900', color: INK, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                      Commencer
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ── HUD Stat — icône glowing, pas de boîte ───────────────────────────
function FloatStat({
  icon, value, label, suffix, glow,
}: {
  icon: 'streak' | 'week' | 'total' | 'volume';
  value: number | string;
  label: string;
  suffix?: string;
  glow: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
      <View style={{
        shadowColor: glow, shadowOpacity: 1,
        shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
      }}>
        <StatIcon name={icon} size={22} color={glow} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 24 }}>
          {value}
        </Text>
        {suffix && (
          <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>
            {suffix}
          </Text>
        )}
      </View>
      <Text style={{ fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.28)', letterSpacing: 1.5, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}

function HUDDivider() {
  return (
    <View style={{ width: 1, alignSelf: 'stretch', marginHorizontal: 3, marginVertical: 6, overflow: 'hidden' }}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
        style={{ flex: 1 }}
      />
    </View>
  );
}

function MetaPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Ionicons name={icon} size={12} color="rgba(255,255,255,0.75)" />
      <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.75)', letterSpacing: 1.4 }}>
        {label}
      </Text>
    </View>
  );
}

// ── Ring de rang — arcs SVG segmentés ────────────────────────────────
function RankRing({ progress, level, size }: { progress: number; level: number; size: number }) {
  const TOTAL = 20;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const innerR = outerR - 6;
  const GAP = 4;
  const SEG = 360 / TOTAL - GAP;
  const active = Math.max(1, Math.round((progress / 100) * TOTAL));
  const toRad = (d: number) => (d * Math.PI) / 180;

  function arcPath(i: number) {
    const s = i * (360 / TOTAL) - 90;
    const e = s + SEG;
    const x1 = cx + outerR * Math.cos(toRad(s));
    const y1 = cy + outerR * Math.sin(toRad(s));
    const x2 = cx + outerR * Math.cos(toRad(e));
    const y2 = cy + outerR * Math.sin(toRad(e));
    const x3 = cx + innerR * Math.cos(toRad(e));
    const y3 = cy + innerR * Math.sin(toRad(e));
    const x4 = cx + innerR * Math.cos(toRad(s));
    const y4 = cy + innerR * Math.sin(toRad(s));
    const la = SEG > 180 ? 1 : 0;
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${outerR} ${outerR} 0 ${la} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L${x3.toFixed(2)} ${y3.toFixed(2)} A${innerR} ${innerR} 0 ${la} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}Z`;
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={VIOLET} stopOpacity={1} />
            <Stop offset="1" stopColor={ACCENT} stopOpacity={1} />
          </SvgLinearGradient>
          <Filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
            <FeGaussianBlur stdDeviation={2.5} />
          </Filter>
        </Defs>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <Path key={`bg${i}`} d={arcPath(i)} fill="rgba(255,255,255,0.06)" />
        ))}
        {Array.from({ length: active }).map((_, i) => (
          <Path key={`gw${i}`} d={arcPath(i)} fill={VIOLET} opacity={0.45} filter="url(#glow)" />
        ))}
        {Array.from({ length: active }).map((_, i) => (
          <Path key={`ac${i}`} d={arcPath(i)} fill="url(#arcGrad)" />
        ))}
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -1.5, lineHeight: 28,
          shadowColor: VIOLET, shadowOpacity: 0.8, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
        }}>
          {level}
        </Text>
        <Text style={{ fontSize: 7, fontWeight: '900', color: 'rgba(255,255,255,0.45)', letterSpacing: 2.5, marginTop: 1 }}>
          LVL
        </Text>
      </View>
    </View>
  );
}

// ── Pill historique (scroll horizontal) ──────────────────────────────
function RecentPill({ workout, locale }: { workout: Workout; locale: ReturnType<typeof useDateLocale> }) {
  const vol = workoutVolume(workout) / 1000;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })}
      style={({ pressed }) => ({
        width: 168,
        borderRadius: 20,
        overflow: 'hidden',
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <View style={{
        padding: 14, gap: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
        borderRadius: 20,
      }}>
        <View style={{
          width: 32, height: 32, borderRadius: 11,
          backgroundColor: 'rgba(56,189,248,0.18)',
          borderWidth: 1, borderColor: 'rgba(56,189,248,0.40)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="barbell" size={15} color={ACCENT} />
        </View>
        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: -0.3 }}>
          {workout.name}
        </Text>
        <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.40)', textTransform: 'capitalize' }}>
          {format(new Date(workout.date), 'd MMM', { locale })}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginTop: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
            {vol > 0 ? vol.toFixed(1) : '—'}
          </Text>
          {vol > 0 && (
            <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>
              t
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
