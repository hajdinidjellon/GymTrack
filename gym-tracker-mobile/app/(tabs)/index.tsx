import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, RefreshControl, ImageBackground, Image,
  Animated, Easing, useWindowDimensions, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomNavPadding } from '@/hooks/useBottomNavPadding';
import { router } from 'expo-router';
import { format, isThisWeek, differenceInDays } from 'date-fns';
import { useDateLocale } from '@/lib/i18n';
import { StatIcon } from '@/components/ui/StatIcon';
import { XpRing } from '@/components/ui/XpRing';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useCelebrationStore } from '@/stores/celebrationStore';
import { getSuggestedSession } from '@/lib/aiPlanner';
import { MUSCLE_LABELS } from '@/lib/gamification';
import { initialSync } from '@/lib/sync';
import type { Workout } from '@/types';

// ── Assets ───────────────────────────────────────────────────────────
const BG_SUNNY  = require('@/assets/images/sunny-background.png') as number;
const HUD_FRAME = require('@/assets/images/rankup.png') as number;

// Native aspect ratio of rankup.png — used to size the HUD container so the
// PNG is never stretched (resizeMode 'cover' on a properly-proportioned box).
const HUD_META   = Image.resolveAssetSource(HUD_FRAME);
const HUD_ASPECT = HUD_META.width / HUD_META.height;

// ── Design tokens ────────────────────────────────────────────────────
const CYAN = '#17B8FF';
// BG matches the dark navy that surrounds & fills rankup.png so the HUD
// frame blends seamlessly into the page (no visible seam).
const BG   = '#0A1424';

// ── Helpers ──────────────────────────────────────────────────────────
function workoutVolume(w: Workout): number {
  return w.exercises.reduce(
    (tot, ex) => tot + ex.sets.reduce((s, set) => s + (set.completed === false ? 0 : set.weight * set.reps), 0),
    0,
  );
}

function workoutDuration(w: Workout): number {
  if (w.duration && w.duration > 0) return w.duration;
  const sets = w.exercises.reduce(
    (s, ex) => s + ex.sets.filter((set) => set.completed !== false).length,
    0,
  );
  return Math.max(20, Math.round(sets * 2.5));
}

type SessionType = 'push' | 'pull' | 'legs' | 'other';

const SESSION_LABEL: Record<SessionType, string> = {
  push: 'PUSH', pull: 'PULL', legs: 'LEGS', other: 'SESSION',
};
const SESSION_SUBLABEL: Record<SessionType, string> = {
  push: '(POUSSER)', pull: '(TIRER)', legs: '(JAMBES)', other: '',
};

function detectSessionType(name: string): SessionType {
  const n = name.toLowerCase();
  if (n.includes('push') || n.includes('pec') || n.includes('chest') || n.includes('pouss') || n.includes('épaule') || n.includes('tricep') || n.includes('développé')) return 'push';
  if (n.includes('pull') || n.includes('dos') || n.includes('traction') || n.includes('tirage') || n.includes('bicep')) return 'pull';
  if (n.includes('leg') || n.includes('jamb') || n.includes('squat') || n.includes('quad') || n.includes('fess') || n.includes('hinge')) return 'legs';
  return 'other';
}

// ── Sub-components ───────────────────────────────────────────────────

function GlassIconButton({
  icon, onPress, dot = false,
}: { icon: keyof typeof Ionicons.glyphMap; onPress?: () => void; dot?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: 'rgba(20,30,45,0.65)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
        alignItems: 'center', justifyContent: 'center',
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Ionicons name={icon} size={18} color="rgba(255,255,255,0.85)" />
      {dot && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 7, right: 7,
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: CYAN,
            borderWidth: 1.5,
            borderColor: 'rgba(8,14,28,1)',
            shadowColor: CYAN, shadowOpacity: 0.9, shadowRadius: 5, shadowOffset: { width: 0, height: 0 },
          }}
        />
      )}
    </Pressable>
  );
}

function BevelButton({ onPress, label = 'DÉMARRER' }: {
  onPress: () => void;
  label?: string;
}) {
  const W = 158, H = 42, tip = 20, body = W - tip, r = 14;

  // All corners rounded — tip (r=3), shoulders (rs=6), left (r=14)
  const tipLen = Math.sqrt(tip * tip + (H / 2) * (H / 2));
  const rt = 3,  rs = 6;
  // tip rounding
  const rtx  = Math.round(W  - rt * (tip      / tipLen));
  const rty1 = Math.round(H / 2 - rt * ((H / 2) / tipLen));
  const rty2 = Math.round(H / 2 + rt * ((H / 2) / tipLen));
  // shoulder rounding — points rs before/after the corner along their segments
  const sx  = Math.round(rs * (tip      / tipLen));   // Δx along diagonal
  const sy  = Math.round(rs * ((H / 2)  / tipLen));   // Δy along diagonal
  const d = [
    `M ${r} 0`,
    `L ${body - rs} 0`,
    `Q ${body} 0 ${body + sx} ${sy}`,            // top shoulder
    `L ${rtx} ${rty1}`,
    `Q ${W} ${H / 2} ${rtx} ${rty2}`,            // tip
    `L ${body + sx} ${H - sy}`,
    `Q ${body} ${H} ${body - rs} ${H}`,          // bottom shoulder
    `L ${r} ${H}`,
    `Q 0 ${H} 0 ${H - r}`,                       // bottom-left
    `L 0 ${r}`,
    `Q 0 0 ${r} 0 Z`,                            // top-left
  ].join(' ');

  // Ghost chevrons (2 cascading, same V-shape, decreasing opacity & size)
  const ghosts = [
    { w: 16, gap: -1, stroke: 1.8, opacity: 0.55 },
    { w: 16, gap:  1, stroke: 1.2, opacity: 0.25 },
  ];

  function ghostPath(cw: number) {
    const gl = Math.sqrt(cw * cw + (H / 2) * (H / 2));
    const gx  = Math.round(cw - 2 * (cw / gl));
    const gy1 = Math.round(H / 2 - 2 * ((H / 2) / gl));
    const gy2 = Math.round(H / 2 + 2 * ((H / 2) / gl));
    return `M 0 2 L ${gx} ${gy1} Q ${cw} ${H / 2} ${gx} ${gy2} L 0 ${H - 2}`;
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
          shadowColor: CYAN,
          shadowOpacity: 0.85,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 5 },
          elevation: 14,
        })}
      >
        <View style={{ width: W, height: H }}>
          <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
            <Defs>
              {/* Main diagonal gradient — bright electric blue → dark navy */}
              <SvgGradient id="btnMain" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0"    stopColor="#2196F3" stopOpacity={1} />
                <Stop offset="0.45" stopColor="#1050C0" stopOpacity={1} />
                <Stop offset="1"    stopColor="#061840" stopOpacity={1} />
              </SvgGradient>
              {/* Top edge white highlight */}
              <SvgGradient id="btnShine" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0"    stopColor="#FFFFFF" stopOpacity={0.22} />
                <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
              </SvgGradient>
            </Defs>

            {/* Base fill */}
            <Path d={d} fill="url(#btnMain)" />
            {/* Top shine overlay */}
            <Path d={d} fill="url(#btnShine)" />
            {/* Cyan border */}
            <Path d={d} fill="none" stroke={CYAN} strokeWidth={1.1} strokeLinejoin="round" strokeOpacity={0.85} />
          </Svg>

          <View
            pointerEvents="none"
            style={{
              position: 'absolute', top: 0, left: 0,
              width: body, height: H,
              flexDirection: 'row', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}
          >
            <Text style={styles.bevelText}>{label}</Text>
            <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
          </View>
        </View>
      </Pressable>

      {/* 2 chevrons fantômes en cascade */}
      {ghosts.map((g, i) => (
        <Svg key={i} width={g.w} height={H} style={{ marginLeft: g.gap }}>
          <Path
            d={ghostPath(g.w)}
            fill="none"
            stroke={CYAN}
            strokeWidth={g.stroke}
            strokeOpacity={g.opacity}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      ))}
    </View>
  );
}

/**
 * HudGrid — rankup.png frame painted full-bleed at its native aspect ratio
 * (no stretching), with 4 stat blocks drawn on top of the corner panels.
 * The central ring is part of the PNG and stays empty.
 */
const RING_SIZE = 124;

function HudGrid({
  width, streak, thisWeek, target, total, volumeT, rank, totalXp,
}: {
  width: number;
  streak: number;
  thisWeek: number;
  target: number;
  total: number;
  volumeT: number;
  rank: import('@/types').Rank;
  totalXp: number;
}) {
  const h = Math.round(width / HUD_ASPECT);

  return (
    <View style={{ width, height: h, alignSelf: 'center' }}>
      {/* HUD frame PNG */}
      <Image
        source={HUD_FRAME}
        style={{ position: 'absolute', top: 0, left: 0, width, height: h }}
        resizeMode="cover"
      />

      {/* Stat blocks */}
      <HudSlot pos="tl" w={width} h={h} dy={8}
        icon={<StatIcon name="streak" size={22} color={CYAN} />}
        value={String(streak)} label={'JOURS\nSTREAK'} />
      <HudSlot pos="tr" w={width} h={h} dx={22} dy={8}
        icon={<StatIcon name="week"   size={22} color={CYAN} />}
        value={`${thisWeek}/${target}`} label={'SÉANCES\nSEMAINE'} />
      <HudSlot pos="bl" w={width} h={h} dy={10}
        icon={<StatIcon name="total"  size={22} color={CYAN} />}
        value={String(total)} label={'SÉANCES\nTOTALES'} />
      <HudSlot pos="br" w={width} h={h} dx={22} dy={10}
        icon={<StatIcon name="volume" size={22} color={CYAN} />}
        value={`${volumeT.toFixed(1)} t`} label={'VOLUME\nTOTAL'} />

      {/* XP Progress Ring — centré dans le cadre */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0, right: 0,
          top: Math.round(h / 2) - RING_SIZE / 2 - 14,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <XpRing rank={rank} totalXp={totalXp} size={RING_SIZE} />
      </View>
    </View>
  );
}

/** Stat block painted inside one of the 4 corner panels of rankup.png.
 *  dx > 0 = nudge toward center (left→right / right→left)
 *  dy > 0 = nudge toward center (top→down / bottom→up)
 */
function HudSlot({
  pos, w, h, icon, value, label, dx = 0, dy = 0,
}: {
  pos: 'tl' | 'tr' | 'bl' | 'br';
  w: number;
  h: number;
  icon: React.ReactNode;
  value: string;
  label: string;
  dx?: number;
  dy?: number;
}) {
  const slotW  = Math.round(w * 0.32);
  const slotH  = Math.round(h * 0.38);
  const offX   = Math.round(w * 0.055);
  const offYT  = Math.round(h * 0.05);
  const offYB  = Math.round(h * 0.14);
  const style: any = {
    position: 'absolute',
    width: slotW, height: slotH,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 8,
  };
  if (pos === 'tl' || pos === 'bl') style.left   = offX + dx;
  if (pos === 'tr' || pos === 'br') style.right  = offX - dx;
  if (pos === 'tl' || pos === 'tr') style.top    = offYT + dy;
  if (pos === 'bl' || pos === 'br') style.bottom = offYB + dy;
  return (
    <View style={style}>
      <View style={{ width: 24, alignItems: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.hudValue}>{value}</Text>
        <Text style={styles.hudLabel}>{label}</Text>
      </View>
    </View>
  );
}

/** Lightning bolt icon — used for "SÉANCE DU JOUR" label. */
function ZapIcon({ color = CYAN, size = 12 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M13 2L4.5 13.5h6L9 22l9.5-12h-6L13 2z" />
    </Svg>
  );
}

/** Tiny session-type glyph rendered inside the OctagonIcon. */
function SessionIcon({ type, color, size = 13 }: { type: SessionType; color: string; size?: number }) {
  if (type === 'legs') {
    return (
      <Svg width={size} height={size} viewBox="0 0 16 16">
        <Path d="M 2 2 L 14 14" stroke={color} strokeWidth={2}   strokeLinecap="round" />
        <Path d="M 14 2 L 2 14" stroke={color} strokeWidth={2}   strokeLinecap="round" />
      </Svg>
    );
  }
  // push / pull / other → horizontal dumbbell
  return (
    <Svg width={size} height={Math.round(size * 0.7)} viewBox="0 0 15 10">
      <Path d="M 4 5 H 11"  stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M 2 2 V 8"   stroke={color} strokeWidth={2}   strokeLinecap="round" />
      <Path d="M 0.5 3 V 7" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M 13 2 V 8"  stroke={color} strokeWidth={2}   strokeLinecap="round" />
      <Path d="M 14.5 3 V 7" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

// ── Octagon icon frame (chamfered, cyan border) ──────────────────────
function OctagonIcon({ type }: { type: SessionType }) {
  return (
    <View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={30} height={30} viewBox="0 0 24 24" style={StyleSheet.absoluteFill}>
        <Path
          d="M 6 0 H 18 L 24 6 V 18 L 18 24 H 6 L 0 18 V 6 Z"
          fill="rgba(0,200,255,0.10)"
          stroke="rgba(93,222,255,0.40)"
          strokeWidth={0.9}
        />
      </Svg>
      <SessionIcon type={type} color={CYAN} size={15} />
    </View>
  );
}

// ── Chevron in chamfered box ─────────────────────────────────────────
function ChevronBox() {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={24} height={24} viewBox="0 0 18 18" style={StyleSheet.absoluteFill}>
        <Path
          d="M 4 0 H 14 L 18 4 V 14 L 14 18 H 4 L 0 14 V 4 Z"
          fill="rgba(0,200,255,0.06)"
          stroke="rgba(93,222,255,0.28)"
          strokeWidth={0.9}
        />
      </Svg>
      <Text style={{ color: CYAN, fontSize: 13, fontFamily: 'Rajdhani-SemiBold', lineHeight: 14 }}>›</Text>
    </View>
  );
}

// ── Recent session row — STRICTLY HORIZONTAL ─────────────────────────
//
// Bulletproof layout: Pressable handles touch + opacity only. The flex-row
// layout lives on an inner <View> with width:'100%'. This decouples the
// touch handler from the layout so nothing can override flexDirection.
function RecentRow({ workout, isLast }: { workout: Workout; isLast: boolean }) {
  const type = detectSessionType(workout.name);
  const dur  = workoutDuration(workout);
  const days = differenceInDays(new Date(), new Date(workout.date));

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 11,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: 'rgba(93,222,255,0.10)',
        }}
      >
        {/* col 1 — icon octogonal */}
        <OctagonIcon type={type} />

        {/* col 2 — name, width fixe */}
        <Text
          numberOfLines={1}
          style={{
            width: 56,
            marginLeft: 12,
            fontFamily: 'Rajdhani-SemiBold',
            fontSize: 14,
            letterSpacing: 0.8,
            color: '#FFFFFF',
          }}
        >
          {SESSION_LABEL[type]}
        </Text>

        {/* col 3 — date, flex:1 pour pousser durée + chevron à droite */}
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            marginLeft: 12,
            fontFamily: 'Rajdhani-Regular',
            fontSize: 12,
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          Il y a {days} jour{days > 1 ? 's' : ''}
        </Text>

        {/* col 4 — duration, auto */}
        <Text
          numberOfLines={1}
          style={{
            marginLeft: 12,
            fontFamily: 'Rajdhani-SemiBold',
            fontSize: 12,
            letterSpacing: 1,
            color: '#FFFFFF',
          }}
        >
          {dur} MIN
        </Text>

        {/* col 5 — chevron box */}
        <View style={{ marginLeft: 12 }}>
          <ChevronBox />
        </View>
      </View>
    </Pressable>
  );
}

// ── Main screen ──────────────────────────────────────────────────────

export default function DashboardScreen() {
  const bottomPad   = useBottomNavPadding();
  const { width: sw, height: sh } = useWindowDimensions();
  const HERO_H      = Math.round(sh * 0.50);

  const { workouts, loadWorkouts, setWorkouts } = useWorkoutStore();
  const { profile, loadProfile, saveProfile, getStreak, getCurrentRank, getTotalXP } = useProfileStore();
  const { activeSession } = useSessionStore();
  const showCelebration   = useCelebrationStore((s) => s.show);

  const [refreshing, setRefreshing] = useState(false);
  const dateLocale = useDateLocale();

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    loadWorkouts();
    loadProfile();
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
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

  // ── Données dérivées ─────────────────────────────────────────────
  const streak    = getStreak();
  const rank      = getCurrentRank();
  const totalXp   = getTotalXP();
  const suggested = profile ? getSuggestedSession(profile, workouts, null) : null;
  const target    = profile?.trainingFrequency ?? 4;

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
    showCelebration({
      type: 'weekly_goal',
      title: 'Objectif hebdo atteint !',
      subtitle: `${target} séance${target > 1 ? 's' : ''} cette semaine — chapeau !`,
    });
  }, [thisWeekCount, target]);

  const dateStr = useMemo(() => {
    const raw = format(new Date(), 'EEEE d MMMM', { locale: dateLocale });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [dateLocale]);

  // Session du jour
  const todayType     = suggested ? detectSessionType(suggested.title) : 'other';
  const todayLabel    = suggested ? SESSION_LABEL[todayType]    : '';
  const todaySubLabel = suggested ? SESSION_SUBLABEL[todayType] : '';
  const todayFocus    = suggested
    ? suggested.focus.slice(0, 3).map((m: string) => (MUSCLE_LABELS as Record<string, string>)[m] ?? m).join(' • ')
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>

      {/* ─── HERO background ──────────────────────────────────────── */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HERO_H }}
      >
        <ImageBackground source={BG_SUNNY} style={{ flex: 1 }} resizeMode="cover">
          {/* Sky stays bright, then a hard fade to pure BG at the bottom of the hero */}
          <LinearGradient
            colors={[
              'rgba(2,8,20,0.05)',
              'rgba(2,8,20,0.08)',
              'rgba(2,8,20,0.55)',
              BG,
              BG,
            ]}
            locations={[0, 0.35, 0.65, 0.85, 1]}
            style={{ flex: 1 }}
          />
        </ImageBackground>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomPad }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />}
          >

            {/* ─── HEADER ──────────────────────────────────────────── */}
            <View style={styles.header}>
              <Text style={styles.logoText}>GYMTRACK</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <GlassIconButton icon="notifications-outline" dot />
                <GlassIconButton icon="add-outline" onPress={() => router.push('/(tabs)/session')} />
              </View>
            </View>

            {/* ─── MOTIVATION PHRASE ───────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
              <Text style={styles.motivationText}>
                {'FOCUS AUJOURD\'HUI\nFORCE DEMAIN.'}
              </Text>
              <Text style={styles.dateText}>{dateStr}</Text>
              <View style={styles.dateUnderline} />
            </View>

            {/* ─── SÉANCE DU JOUR ──────────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Text style={styles.sectionMicro}>SÉANCE DU JOUR</Text>
                <ZapIcon color={CYAN} size={12} />
              </View>

              {activeSession ? (
                /* ── Séance en cours ── */
                <Pressable
                  onPress={() => router.push('/(tabs)/session')}
                  style={({ pressed }) => [styles.todayCard, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <Ionicons name="play" size={28} color="#10b981" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sessionTypeBig, { color: '#10b981' }]}>EN COURS</Text>
                      <Text style={styles.sessionMeta}>
                        {activeSession.exercises.length} exercices · {Math.floor(activeSession.elapsedSeconds / 60)} min
                      </Text>
                    </View>
                  </View>
                  <BevelButton
                    onPress={() => router.push('/(tabs)/session')}
                    label="REPRENDRE"
                  />
                </Pressable>

              ) : suggested ? (
                /* ── Séance suggérée ── */
                <View style={styles.todayCard}>
                  <Text style={styles.sessionTypeBig}>{todayLabel}</Text>
                  {todaySubLabel ? (
                    <Text style={styles.sessionSubLabel}>{todaySubLabel}</Text>
                  ) : null}
                  <Text style={[styles.sessionFocus, { marginTop: 8 }]}>{todayFocus}</Text>

                  <View style={{ flexDirection: 'row', gap: 18, marginTop: 12 }}>
                    <View style={styles.metaPill}>
                      <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.75)" />
                      <Text style={styles.metaText}>{suggested.estimatedDuration} MIN</Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Ionicons name="barbell-outline" size={12} color="rgba(255,255,255,0.75)" />
                      <Text style={styles.metaText}>{suggested.exercises.length} EXERCICES</Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 18 }}>
                    <BevelButton onPress={() => router.push('/(tabs)/session')} />
                  </View>
                </View>

              ) : (
                /* ── Zero state ── */
                <Pressable
                  onPress={() => router.push('/(tabs)/session')}
                  style={({ pressed }) => [styles.todayCard, { transform: [{ scale: pressed ? 0.985 : 1 }], alignItems: 'center', paddingVertical: 24 }]}
                >
                  <Text style={{ fontSize: 15, fontWeight: '800', color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>
                    Prêt pour ta première séance ?
                  </Text>
                  <BevelButton onPress={() => router.push('/(tabs)/session')} label="COMMENCER" />
                </Pressable>
              )}
            </View>

            {/* ─── STATS HUD : rankup.png frame, stats sur chaque coin ─── */}
            <View style={styles.hudWrap}>
              <HudGrid
                width={sw}
                streak={streak}
                thisWeek={thisWeekCount}
                target={target}
                total={workouts.length}
                volumeT={weeklyVolumeT}
                rank={rank}
                totalXp={totalXp}
              />
            </View>

            {/* ─── SÉANCES RÉCENTES — inline, double-frame HUD ───────── */}
            {workouts.length > 0 && (
              <View style={{ paddingHorizontal: 18, marginTop: -48 }}>
                {/* Carte extérieure — fond opaque pour ne pas laisser passer le hero */}
                <View
                  style={{
                    backgroundColor: 'rgba(8,14,28,0.98)',
                    borderWidth: 1,
                    borderColor: 'rgba(93,222,255,0.22)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingTop: 14,
                    paddingBottom: 8,
                  }}
                >
                  {/* Header */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ fontFamily: 'Rajdhani-SemiBold', fontSize: 13, letterSpacing: 2, color: 'rgba(255,255,255,0.92)' }}>
                      SÉANCES RÉCENTES
                    </Text>
                    <Pressable onPress={() => router.push('/(tabs)/progress')} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={{ fontFamily: 'Rajdhani-SemiBold', fontSize: 11, letterSpacing: 1.4, color: 'rgba(255,255,255,0.42)' }}>
                        VOIR TOUT
                      </Text>
                      <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>→</Text>
                    </Pressable>
                  </View>

                  {/* 2e encadrement : la liste */}
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: 'rgba(93,222,255,0.20)',
                      borderRadius: 10,
                      backgroundColor: 'rgba(0,200,255,0.035)',
                      paddingHorizontal: 14,
                    }}
                  >
                    {workouts.slice(0, 3).map((w, i, arr) => (
                      <RecentRow key={w.id} workout={w} isLast={i === arr.length - 1} />
                    ))}
                  </View>
                </View>
              </View>
            )}

          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 2,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    color: CYAN,
    letterSpacing: 2,
  },
  motivationText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0A0A0A',
    lineHeight: 26,
    letterSpacing: -0.8,
    maxWidth: '100%',
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(10,10,10,0.85)',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  dateUnderline: {
    height: 2.5,
    width: 32,
    borderRadius: 2,
    backgroundColor: CYAN,
    marginTop: 6,
    shadowColor: CYAN,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  sectionMicro: {
    fontSize: 10,
    fontWeight: '900',
    color: CYAN,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  todayCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 4,
  },
  sessionTypeBig: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  sessionSubLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginTop: 1,
  },
  sessionFocus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  sessionMeta: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
  },
  bevelText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  hudWrap: {
    marginTop: -20,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  hudValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 24,
  },
  hudLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.3,
    marginTop: 3,
    lineHeight: 11,
  },
});
