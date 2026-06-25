import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Brain, Lightning, Flame, ChartLineUp, Pulse, Barbell, Timer,
  StackSimple, CheckCircle, ArrowsClockwise, Minus, Plus, HourglassMedium,
} from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Canvas,
  Path as SkPath,
  Circle as SkCircle,
  Group as SkGroup,
  BlurMask,
  DashPathEffect,
  vec,
  useImage,
  Image as SkImage,
  ColorMatrix,
  Mask,
  RadialGradient as SkRadialGradient,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withRepeat,
  withDelay,
  withSpring,
  withSequence,
  cancelAnimation,
  Easing,
  ReduceMotion,
} from 'react-native-reanimated';
import { useBottomNavPadding } from '@/hooks/useBottomNavPadding';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Mascot } from '@/components/mascot/Mascot';
import {
  HudCard, BevelButton, OctoIcon, HudPill, ProgressRail, AnimatedNumber, PowerOn,
} from '@/components/ui/hud';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getSuggestedSession, generateWarmupSets } from '@/lib/aiPlanner';
import { MUSCLE_LABELS, getRecoveredMuscles } from '@/lib/gamification';
import { hud, hudType, motion } from '@/constants/theme';
import type { MuscleGroup } from '@/types';

const SESSION_BG = require('@/assets/images/background-session.png') as number;
const BODY_HOLO  = require('@/assets/images/body-holo.png') as number;

// Dégradé d'arête HUD : cyan clair ↘ bleu profond → bordure NON-uniforme
// (certaines parties plus intenses / plus bleues), comme la maquette.
const EDGE_CYAN: readonly string[] = ['#AEEFFF', '#26C9FF', '#0B5FD6'];

// ── Détection du type de séance (même logique que l'accueil) ────────
type SessionType = 'push' | 'pull' | 'legs' | 'other';

const SESSION_LABEL: Record<SessionType, string> = {
  push: 'PUSH', pull: 'PULL', legs: 'LEGS', other: 'SESSION',
};

function detectSessionType(name: string): SessionType {
  const n = name.toLowerCase();
  if (n.includes('push') || n.includes('pec') || n.includes('chest') || n.includes('pouss') || n.includes('épaule') || n.includes('tricep') || n.includes('développé')) return 'push';
  if (n.includes('pull') || n.includes('dos') || n.includes('traction') || n.includes('tirage') || n.includes('bicep')) return 'pull';
  if (n.includes('leg') || n.includes('jamb') || n.includes('squat') || n.includes('quad') || n.includes('fess') || n.includes('hinge')) return 'legs';
  return 'other';
}

/** Arc de cercle SVG (degrés, sens horaire). */
function arcPath(c: number, r: number, startDeg: number, sweepDeg: number): string {
  const s = (startDeg * Math.PI) / 180;
  const e = ((startDeg + sweepDeg) * Math.PI) / 180;
  const x1 = c + r * Math.cos(s);
  const y1 = c + r * Math.sin(s);
  const x2 = c + r * Math.cos(e);
  const y2 = c + r * Math.sin(e);
  const large = sweepDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATIONS VIVANTES (Skia + Reanimated, boucles sur le thread UI)
// ═══════════════════════════════════════════════════════════════════

/**
 * AI ORB — le « rond qui bouge » du header : cœur lumineux qui respire,
 * deux arcs en contre-rotation, satellite en orbite, cerveau au centre.
 */
function AIOrb({ size = 46 }: { size?: number }) {
  const PAD = 14;
  const S = size + PAD * 2;
  const c = S / 2;
  const r = size / 2 - 2;

  const rot    = useSharedValue(0);
  const rotInv = useSharedValue(0);
  const breath = useSharedValue(0.30);

  useEffect(() => {
    rot.value    = withRepeat(withTiming(Math.PI * 2,  { duration: 5200, easing: Easing.linear }), -1, false);
    rotInv.value = withRepeat(withTiming(-Math.PI * 2, { duration: 8400, easing: Easing.linear }), -1, false);
    breath.value = withRepeat(withTiming(0.75, { duration: 1700, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      cancelAnimation(rot);
      cancelAnimation(rotInv);
      cancelAnimation(breath);
    };
  }, []);

  const tCW  = useDerivedValue(() => [{ rotate: rot.value }]);
  const tCCW = useDerivedValue(() => [{ rotate: rotInv.value }]);
  const satX = useDerivedValue(() => c + r * Math.cos(rot.value));
  const satY = useDerivedValue(() => c + r * Math.sin(rot.value));

  const arcOuterA = useMemo(() => arcPath(c, r, -30, 110), [c, r]);
  const arcOuterB = useMemo(() => arcPath(c, r, 150, 110), [c, r]);
  const arcInner  = useMemo(() => arcPath(c, r - 5, 60, 150), [c, r]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas
        pointerEvents="none"
        style={{ position: 'absolute', top: -PAD, left: -PAD, width: S, height: S }}
      >
        {/* Cœur lumineux qui respire */}
        <SkCircle cx={c} cy={c} r={r - 7} color={hud.cyan.primary} opacity={breath}>
          <BlurMask blur={10} style="normal" />
        </SkCircle>
        <SkCircle cx={c} cy={c} r={r - 8} color="#06121F" opacity={0.9} />

        {/* Arcs extérieurs en rotation horaire */}
        <SkGroup origin={vec(c, c)} transform={tCW}>
          <SkPath path={arcOuterA} color={hud.cyan.bright} style="stroke" strokeWidth={1.8} strokeCap="round" />
          <SkPath path={arcOuterB} color={hud.cyan.primary} style="stroke" strokeWidth={1.8} strokeCap="round" opacity={0.6} />
        </SkGroup>

        {/* Arc intérieur en contre-rotation */}
        <SkGroup origin={vec(c, c)} transform={tCCW}>
          <SkPath path={arcInner} color={hud.cyan.primary} style="stroke" strokeWidth={1} opacity={0.45}>
            <DashPathEffect intervals={[2, 4]} />
          </SkPath>
        </SkGroup>

        {/* Satellite en orbite */}
        <SkGroup>
          <SkCircle cx={satX} cy={satY} r={2.2} color={hud.cyan.bright}>
            <BlurMask blur={3} style="solid" />
          </SkCircle>
        </SkGroup>
      </Canvas>

      <Brain size={size * 0.42} color={hud.cyan.bright} weight="duotone" />
    </View>
  );
}

/** Anneau circulaire avec glow qui respire + anneau pointillé rotatif.
 *  `tint` permet de colorer l'anneau (cyan par défaut, ou un accent sémantique). */
function RingIcon({ size = 48, spinDuration = 14000, tint = hud.cyan.primary, children }: {
  size?: number;
  spinDuration?: number;
  tint?: string;
  children: React.ReactNode;
}) {
  const PAD = 12;
  const S = size + PAD * 2;
  const c = S / 2;
  const r = size / 2 - 1;

  const rot    = useSharedValue(0);
  const breath = useSharedValue(0.25);

  useEffect(() => {
    rot.value    = withRepeat(withTiming(Math.PI * 2, { duration: spinDuration, easing: Easing.linear }), -1, false);
    breath.value = withRepeat(withTiming(0.6, { duration: 2100, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      cancelAnimation(rot);
      cancelAnimation(breath);
    };
  }, [spinDuration]);

  const t = useDerivedValue(() => [{ rotate: rot.value }]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas
        pointerEvents="none"
        style={{ position: 'absolute', top: -PAD, left: -PAD, width: S, height: S }}
      >
        {/* halo coloré qui respire */}
        <SkCircle cx={c} cy={c} r={r} color={tint} opacity={breath}>
          <BlurMask blur={9} style="normal" />
        </SkCircle>
        <SkCircle cx={c} cy={c} r={r} color="#06121F" />
        <SkCircle cx={c} cy={c} r={r} color={tint} style="stroke" strokeWidth={1.2} opacity={0.85} />
        <SkGroup origin={vec(c, c)} transform={t}>
          <SkCircle cx={c} cy={c} r={r - 4} color={tint} style="stroke" strokeWidth={0.8} opacity={0.4}>
            <DashPathEffect intervals={[3, 5]} />
          </SkCircle>
        </SkGroup>
      </Canvas>
      {children}
    </View>
  );
}

/**
 * HOLO RING — hologramme du hero : l'illustration body-holo.png (qui
 * embarque son propre anneau lumineux) est fondue dans la page par un
 * masque radial Skia, puis surmontée d'un anneau pointillé en rotation
 * continue, d'une particule en orbite et d'une scanline qui balaye le
 * corps de haut en bas.
 */
function HoloRing({ size = 172 }: { size?: number }) {
  const H = size + 26;
  const cx = size / 2;
  const cy = H / 2;
  const rOuter = size / 2 - 2;
  const img = useImage(BODY_HOLO);

  const halo  = useSharedValue(0.06);

  useEffect(() => {
    halo.value  = withRepeat(
      withTiming(0.16, { duration: 2600, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.Never }),
      -1,
      true,
      undefined,
      ReduceMotion.Never,
    );
    return () => {
      cancelAnimation(halo);
    };
  }, []);

  // Centre d'orbite des particules (le torse, un peu au-dessus du centre du canvas).
  const orbitCx = cx;
  const orbitCy = cy - 14;

  return (
    <View style={{ width: size, height: H }}>
      <Canvas style={{ position: 'absolute', width: size, height: H }} pointerEvents="none">
        {/* Mannequin — statique, fondu dans la page par un masque radial */}
        <Mask
          mask={
            <SkCircle cx={cx} cy={cy} r={H / 2}>
              <SkRadialGradient
                c={vec(cx, cy)}
                r={H / 2}
                colors={['white', 'white', 'transparent']}
                positions={[0, 0.58, 0.98]}
              />
            </SkCircle>
          }
        >
          {img && (
            <SkImage image={img} x={0} y={0} width={size} height={H} fit="cover">
              {/* Rend le fond sombre transparent, garde les zones cyan lumineuses */}
              <ColorMatrix matrix={[1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2.0, 0.5, 0, -0.45]} />
            </SkImage>
          )}
        </Mask>

        {/* Halo qui respire par-dessus l'illustration */}
        <SkCircle cx={cx} cy={cy} r={rOuter - 10} color="#00B4F0" opacity={halo}>
          <BlurMask blur={26} style="normal" />
        </SkCircle>
      </Canvas>

      {/* Champ de petites particules cyan qui ORBITENT en cercle autour du mannequin
          (corps fixe). Plusieurs anneaux, tailles / vitesses / sens variés. */}
      {ORBIT_FIELD.map((p) => (
        <OrbitParticle
          key={p.key}
          cx={orbitCx}
          cy={orbitCy}
          radius={rOuter + p.dr}
          startDeg={p.deg}
          duration={p.duration}
          size={p.size}
          dir={p.dir}
          opacity={p.opacity}
        />
      ))}
    </View>
  );
}

// Champ dense de particules : 6 anneaux concentriques (du bord jusqu'au centre, donc
// par-dessus le corps), sens alternés, tailles / vitesses / opacités variées. Couvre la
// zone des étincelles peintes dans le PNG → l'ensemble paraît bouger.
const ORBIT_FIELD = (() => {
  const rings = [
    { dr: 0,   n: 8, duration: 9000,  dir: 1  as 1 | -1 },
    { dr: -16, n: 7, duration: 11000, dir: -1 as 1 | -1 },
    { dr: -32, n: 6, duration: 13000, dir: 1  as 1 | -1 },
    { dr: -48, n: 6, duration: 15000, dir: -1 as 1 | -1 },
    { dr: -64, n: 5, duration: 17000, dir: 1  as 1 | -1 },
    { dr: -80, n: 4, duration: 19000, dir: -1 as 1 | -1 },
  ];
  const out: { key: string; dr: number; deg: number; duration: number; size: number; dir: 1 | -1; opacity: number }[] = [];
  rings.forEach((ring, ri) => {
    for (let i = 0; i < ring.n; i++) {
      const t = (i + ri) % 3;
      out.push({
        key: `${ri}-${i}`,
        dr: ring.dr,
        deg: (360 / ring.n) * i + ri * 23,   // décalage par anneau → réparti, pas aligné
        duration: ring.duration,
        size: 1.4 + t * 0.8,                 // 1.4 / 2.2 / 3.0 px
        dir: ring.dir,
        opacity: 0.5 + t * 0.18,             // 0.5 / 0.68 / 0.86
      });
    }
  });
  return out;
})();

/** Particule cyan en orbite circulaire continue autour de (cx, cy). */
function OrbitParticle({ cx, cy, radius, startDeg, duration, size = 3, dir = 1, opacity = 1 }: {
  cx: number; cy: number; radius: number; startDeg: number; duration: number;
  size?: number; dir?: 1 | -1; opacity?: number;
}) {
  const a = useSharedValue(0);
  useEffect(() => {
    // reduceMotion: Never → l'orbite décorative tourne même si « Réduire les animations » est activé.
    a.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear, reduceMotion: ReduceMotion.Never }),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );
    return () => cancelAnimation(a);
  }, [duration]);
  const style = useAnimatedStyle(() => {
    const ang = (startDeg * Math.PI) / 180 + dir * a.value * Math.PI * 2;
    return {
      transform: [
        { translateX: radius * Math.cos(ang) },
        { translateY: radius * Math.sin(ang) },
      ],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: cx - size / 2,
          top: cy - size / 2,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: hud.cyan.bright,
          opacity,
          shadowColor: hud.cyan.bright,
          shadowOpacity: 0.9,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    />
  );
}

/** Particules qui dérivent vers le haut (fond du hero). */
function Particle({ x, delay, travel }: { x: number; delay: number; travel: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    // reduceMotion: Never → ces particules ambiantes bougent même si « Réduire les animations » est activé.
    p.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 4200, easing: Easing.linear, reduceMotion: ReduceMotion.Never }),
        -1,
        false,
        undefined,
        ReduceMotion.Never,
      ),
    );
    return () => cancelAnimation(p);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -p.value * travel }],
    opacity: p.value < 0.15 ? p.value / 0.15 * 0.7 : (1 - p.value) * 0.7,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute', bottom: 6, left: x,
          width: 3, height: 3, borderRadius: 2,
          backgroundColor: hud.cyan.bright,
          shadowColor: hud.cyan.bright, shadowOpacity: 0.9, shadowRadius: 3,
          shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    />
  );
}

/** Éclair qui scintille (carte récupération). */
function FlickerLightning() {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 90 }),
        withTiming(1,    { duration: 140 }),
        withTiming(1,    { duration: 2200 }),
        withTiming(0.55, { duration: 70 }),
        withTiming(1,    { duration: 110 }),
        withTiming(1,    { duration: 1400 }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(o);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={style}>
      <Lightning size={15} color={hud.cyan.bright} weight="duotone" />
    </Animated.View>
  );
}

/** Check qui « pop » une fois le compteur de récupération terminé. */
function PopCheck({ ok }: { ok: boolean }) {
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withDelay(1100, withSpring(1, motion.springCelebration));
    return () => cancelAnimation(s);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={style}>
      {ok
        ? <CheckCircle size={22} color={hud.accent.regen} weight="duotone" />
        : <HourglassMedium size={22} color={hud.accent.warn} weight="duotone" />}
    </Animated.View>
  );
}

/** Pulsation douce (scale) — cerveau du conseil, icône active. */
function Pulsing({ children, amount = 1.10, duration = 1400 }: {
  children: React.ReactNode;
  amount?: number;
  duration?: number;
}) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withRepeat(withTiming(amount, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(s);
  }, [amount, duration]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

// ═══════════════════════════════════════════════════════════════════
// Briques UI
// ═══════════════════════════════════════════════════════════════════

/** En-tête de section : ❙ tick cyan + label + ligne. `align` inverse le sens. */
function SectionTag({ label, align = 'left' }: { label: string; align?: 'left' | 'right' }) {
  const line = (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(93,222,255,0.22)' }} />
      <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: hud.cyan.primary, opacity: 0.7 }} />
    </View>
  );
  const tag = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <View style={{ width: 3, height: 12, backgroundColor: hud.cyan.primary, borderRadius: 1 }} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {align === 'left' ? (<>{tag}{line}</>) : (<>{line}{tag}</>)}
    </View>
  );
}

/** Pill musculaire : icône + label. */
function MusclePill({ muscle }: { muscle: MuscleGroup }) {
  const SHORT: Partial<Record<MuscleGroup, string>> = { chest: 'Pecs' };
  const label = (SHORT[muscle] ?? MUSCLE_LABELS[muscle]).toUpperCase();
  return (
    <View style={styles.musclePill}>
      <Barbell size={11} color={hud.cyan.bright} weight="duotone" />
      <Text style={styles.musclePillText}>{label}</Text>
    </View>
  );
}

/** Colonne de stat : valeur animée + label. */
function StatCol({ icon, value, label }: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {icon}
        <AnimatedNumber
          value={value}
          duration={900}
          style={[hudType.displayStat, { fontSize: 24 }]}
          animateOnMount
        />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** Carte outil IA (Échauffement / Progression / Analyse).
 *  `accent` colore l'anneau + le glow ; quand `active`, la carte s'illumine
 *  de sa couleur (bordure + halo) au lieu du cyan neutre. */
function ToolCard({ icon, title, sub, accent = hud.cyan.bright, accentGlow = hud.glow.cyan, active, spinDuration, onPress }: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  accent?: string;
  accentGlow?: string;
  active?: boolean;
  spinDuration?: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[{ flex: 1 }, pressStyle]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94, motion.spring); }}
        onPressOut={() => { scale.value = withSpring(1, motion.spring); }}
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        style={{ flex: 1 }}
      >
        <HudCard
          level={active ? 'g2' : 'g1'}
          cut={hud.cut.md}
          cornerTicks
          borderGradient={EDGE_CYAN}
          glowColor={active ? accentGlow : undefined}
          gradientFill
          padding={12}
          style={{ flex: 1 }}
        >
          <View style={{ alignItems: 'center', gap: 8, paddingVertical: 4 }}>
            <RingIcon size={44} spinDuration={spinDuration ?? 14000} tint={accent}>
              {active ? <Pulsing amount={1.15}>{icon}</Pulsing> : icon}
            </RingIcon>
            <View style={{ alignItems: 'center', gap: 1 }}>
              <Text style={styles.toolTitle} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
              <Text style={styles.toolSub} numberOfLines={1} adjustsFontSizeToFit>{sub}</Text>
            </View>
          </View>
        </HudCard>
      </Pressable>
    </Animated.View>
  );
}

// ── Stepper numérique HUD (− valeur +) ──────────────────────────────
function HudStepper({ label, value, onChange, min, max, step, suffix }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}) {
  const bump = (dir: 1 | -1) => {
    const next = Math.min(max, Math.max(min, value + dir * step));
    if (next === value) return;
    Haptics.selectionAsync();
    onChange(next);
  };

  return (
    <View style={{ flex: 1, gap: 8 }}>
      <Text style={hudType.labelHud}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable onPress={() => bump(-1)} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <OctoIcon size={36} level="g1">
            <Minus size={15} color={hud.cyan.bright} weight="bold" />
          </OctoIcon>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
          <AnimatedNumber
            value={value}
            decimals={step % 1 !== 0 ? 1 : 0}
            style={[hudType.displayStat, { fontSize: 22 }]}
          />
          {suffix ? <Text style={[hudType.labelHud, { color: hud.text.muted }]}>{suffix}</Text> : null}
        </View>
        <Pressable onPress={() => bump(1)} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <OctoIcon size={36} level="g1">
            <Plus size={15} color={hud.cyan.bright} weight="bold" />
          </OctoIcon>
        </Pressable>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Écran principal
// ═══════════════════════════════════════════════════════════════════

const ALL_MUSCLES_COUNT = 8;

export default function PlannerScreen() {
  const bottomPad = useBottomNavPadding();
  const { workouts } = useWorkoutStore();
  const { profile } = useProfileStore();
  const { startSession, addExercise } = useSessionStore();
  const defaultRestTime = useSettingsStore((s) => s.settings.defaultRestTime);

  const [openTool, setOpenTool] = useState<'warmup' | 'analyse' | null>(null);

  const suggested = profile ? getSuggestedSession(profile, workouts, null) : null;

  // ── Récupération ──────────────────────────────────────────────────
  const recovered = useMemo(() => getRecoveredMuscles(workouts), [workouts]);
  const recoveryPct = Math.round((recovered.length / ALL_MUSCLES_COUNT) * 100);
  const recoveryWord =
    recoveryPct >= 75 ? 'optimal' :
    recoveryPct >= 50 ? 'bon'     : 'en construction';

  const todayType   = suggested ? detectSessionType(suggested.title) : 'other';
  const totalSeries = suggested ? suggested.exercises.reduce((s, e) => s + e.targetSets, 0) : 0;

  // Rotation du bouton refresh (header droit)
  const spin = useSharedValue(0);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    spin.value = 0;
    spin.value = withTiming(360, { duration: 700, easing: Easing.out(Easing.cubic) });
  };

  const handleStartSuggested = () => {
    if (!suggested) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
    startSession(suggested.title, 'strength');
    suggested.exercises.forEach((ex, i) => {
      const targetReps = Array.isArray(ex.targetReps) ? ex.targetReps[0] : ex.targetReps;
      addExercise({
        id: `${ex.name}-${Date.now()}-${i}`,
        name: ex.name,
        category: ex.category,
        muscleGroups: suggested.focus,
        sets: Array.from({ length: ex.targetSets }, () => ({
          weight: ex.targetWeight ?? 0,
          reps: targetReps,
          setType: 'normal' as const,
          restTime: ex.restTime ?? defaultRestTime,
          completed: false,
        })),
        isExpanded: i === 0,
      });
    });
    router.push('/(tabs)/session');
  };

  // Conseil du coach : raison de l'IA, sinon conseil basé récupération
  const advice = suggested?.reason
    ?? (recovered.length > 0
      ? `${MUSCLE_LABELS[recovered[0]!]} bien récupéré${recovered.length > 1 ? 's' : ''}. C'est le moment d'augmenter tes charges.`
      : 'Repos bien mérité — laisse tes muscles récupérer avant la prochaine séance.');

  return (
    <View style={{ flex: 1, backgroundColor: hud.bg.app }}>
      <ExpoImage
        source={SESSION_BG}
        contentFit="cover"
        transition={400}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 6 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER : orbe IA animée + titre + refresh ── */}
          <PowerOn index={0} style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <AIOrb size={46} />
              <View>
                <Text style={styles.headerTitle}>IA COACH</Text>
                <Text style={styles.headerSub}>Ton coach intelligent</Text>
              </View>
            </View>
            <Pressable onPress={handleRefresh} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <OctoIcon size={40} level="g1">
                <Animated.View style={spinStyle}>
                  <ArrowsClockwise size={18} color={hud.cyan.primary} weight="duotone" />
                </Animated.View>
              </OctoIcon>
            </Pressable>
          </PowerOn>

          {/* ── HERO : Prêt à performer + récupération | hologramme ── */}
          <PowerOn index={1} style={styles.heroRow}>
            {/* Particules ambiantes */}
            <Particle x={30}  delay={0}    travel={150} />
            <Particle x={120} delay={1400} travel={120} />
            <Particle x={70}  delay={2600} travel={170} />

            <View style={{ flex: 1, paddingTop: 8 }}>
              <Text style={styles.heroTitle}>Prêt à{'\n'}performer</Text>
              <Text style={styles.heroDesc}>
                Ton niveau de récupération est{' '}
                <Text style={{ color: hud.cyan.bright, fontFamily: 'Rajdhani-SemiBold' }}>{recoveryWord}</Text>
                {' '}aujourd'hui.
              </Text>

              {/* Carte récupération — octogone HUD compact (court en Y, large en X) */}
              <HudCard
                level="g2"
                cut={hud.cut.sm}
                cornerTicks
                borderGradient={EDGE_CYAN}
                glowColor={hud.glow.cyan}
                premium
                premiumIntensity="strong"
                padding={11}
                style={{ marginTop: 12, marginRight: -6 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                  <OctoIcon size={30} level="g0">
                    <FlickerLightning />
                  </OctoIcon>
                  <View style={{ flex: 1, gap: 5 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <Text style={styles.recoveryLabel}>RÉCUPÉRATION</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 1 }}>
                        <AnimatedNumber
                          value={recoveryPct}
                          animateOnMount
                          duration={1100}
                          style={[hudType.displayStat, { fontSize: 21 }]}
                        />
                        <Text style={[hudType.labelHud, { color: hud.text.muted }]}>%</Text>
                      </View>
                    </View>
                    <ProgressRail progress={recoveryPct / 100} height={4} ticks={false} />
                  </View>
                  <PopCheck ok={recoveryPct >= 50} />
                </View>
              </HudCard>
            </View>

            <View style={{ alignSelf: 'flex-end', marginTop: 36, marginBottom: -24 }}>
              <HoloRing size={210} />
            </View>
          </PowerOn>

          {/* ── SUGGESTION DU JOUR ── */}
          <PowerOn index={2} style={{ paddingHorizontal: 16, marginTop: 18, gap: 12 }}>
            <SectionTag label="SUGGESTION DU JOUR" />

            {suggested ? (
              <HudCard level="g3" cut={hud.cut.lg} notched cornerTicks borderGradient={EDGE_CYAN} gradientFill scanline premium premiumIntensity="strong" padding={18}>
                <View style={{ gap: 14 }}>
                  {/* Type + titre + emblème */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <HudPill label={SESSION_LABEL[todayType]} />
                      <Text style={styles.cardTitle}>FORCE</Text>
                      <Text style={styles.cardSub}>Charges lourdes · Faibles reps</Text>
                    </View>
                    <RingIcon size={76} spinDuration={10000}>
                      <Barbell size={32} color={hud.cyan.bright} weight="duotone" />
                    </RingIcon>
                  </View>

                  {/* Muscles ciblés */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {suggested.focus.slice(0, 3).map((m) => (
                      <MusclePill key={m} muscle={m} />
                    ))}
                  </View>

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <StatCol
                      icon={<Barbell size={14} color={hud.cyan.primary} weight="duotone" />}
                      value={suggested.exercises.length}
                      label="EXERCICES"
                    />
                    <View style={styles.statDivider} />
                    <StatCol
                      icon={<StackSimple size={14} color={hud.cyan.primary} weight="duotone" />}
                      value={totalSeries}
                      label="SÉRIES"
                    />
                    <View style={styles.statDivider} />
                    <StatCol
                      icon={<Timer size={14} color={hud.cyan.primary} weight="duotone" />}
                      value={suggested.estimatedDuration}
                      label="MINUTES"
                    />
                  </View>

                  <BevelButton label="DÉMARRER CETTE SÉANCE" heroChevrons onPress={handleStartSuggested} />
                </View>
              </HudCard>
            ) : (
              <HudCard level="g1" cut={hud.cut.lg} gradientFill padding={22}>
                <View style={{ alignItems: 'center', gap: 14 }}>
                  <Mascot pose="mimi_calendar" height={120} animate float />
                  <Text style={[hudType.body, { textAlign: 'center' }]}>
                    Complète ton profil pour recevoir une suggestion du coach.
                  </Text>
                </View>
              </HudCard>
            )}
          </PowerOn>

          {/* ── OUTILS IA ── */}
          <PowerOn index={3} style={{ paddingHorizontal: 16, marginTop: 22, gap: 12 }}>
            <SectionTag label="OUTILS IA" align="right" />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ToolCard
                icon={<Flame size={20} color={hud.accent.ember} weight="duotone" />}
                title="ÉCHAUFFEMENT"
                sub="ADAPTATIF"
                accent={hud.accent.ember}
                accentGlow="rgba(255,122,26,0.28)"
                active={openTool === 'warmup'}
                spinDuration={12000}
                onPress={() => setOpenTool((v) => (v === 'warmup' ? null : 'warmup'))}
              />
              <ToolCard
                icon={<ChartLineUp size={20} color={hud.cyan.bright} weight="duotone" />}
                title="PROGRESSION"
                sub="SUIVI & OBJECTIFS"
                accent={hud.cyan.bright}
                accentGlow={hud.glow.cyan}
                spinDuration={16000}
                onPress={() => router.push('/(tabs)/progress')}
              />
              <ToolCard
                icon={<Pulse size={20} color={hud.accent.regen} weight="duotone" />}
                title="ANALYSE"
                sub="RÉCUPÉRATION"
                accent={hud.accent.regen}
                accentGlow="rgba(43,232,160,0.28)"
                active={openTool === 'analyse'}
                spinDuration={20000}
                onPress={() => setOpenTool((v) => (v === 'analyse' ? null : 'analyse'))}
              />
            </View>

            {openTool === 'warmup' && (
              <PowerOn index={0}>
                <WarmupPanel />
              </PowerOn>
            )}

            {openTool === 'analyse' && (
              <PowerOn index={0}>
                <HudCard level="g1" cut={hud.cut.md} gradientFill padding={16}>
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.recoveryLabel}>ÉTAT DE RÉCUPÉRATION</Text>
                      <Text style={[styles.recoveryLabel, { color: hud.cyan.bright }]}>{recoveryPct}%</Text>
                    </View>
                    <ProgressRail progress={recoveryPct / 100} height={6} ticks={false} />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                      {(Object.keys(MUSCLE_LABELS) as MuscleGroup[]).map((m) => {
                        const ok = recovered.includes(m);
                        return (
                          <HudPill
                            key={m}
                            label={MUSCLE_LABELS[m]}
                            color={ok ? hud.accent.regen : 'rgba(255,255,255,0.35)'}
                          />
                        );
                      })}
                    </View>
                  </View>
                </HudCard>
              </PowerOn>
            )}
          </PowerOn>

          {/* ── CONSEIL DU COACH ── */}
          <PowerOn index={4} style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <HudCard level="g1" cut={hud.cut.md} premium premiumIntensity="strong" padding={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                <OctoIcon size={42} level="g1">
                  <Pulsing amount={1.12} duration={1600}>
                    <Brain size={20} color={hud.cyan.bright} weight="duotone" />
                  </Pulsing>
                </OctoIcon>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.adviceTitle}>Conseil du coach</Text>
                  <Text style={styles.adviceText}>{advice}</Text>
                </View>
              </View>
            </HudCard>
          </PowerOn>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Panneau échauffement (outil dépliable) ──────────────────────────
function WarmupPanel() {
  const [weight, setWeight]         = useState(80);
  const [targetReps, setTargetReps] = useState(5);
  const sets = generateWarmupSets(weight, targetReps);

  return (
    <HudCard level="g1" cut={hud.cut.md} gradientFill padding={16}>
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <HudStepper label="Poids de travail" value={weight} onChange={setWeight} min={0} max={400} step={2.5} suffix="kg" />
          <HudStepper label="Reps cibles" value={targetReps} onChange={setTargetReps} min={1} max={20} step={1} />
        </View>

        <View>
          {sets.map((set, i) => {
            const pct = weight > 0 ? Math.round((set.weight / weight) * 100) : 0;
            return (
              <View key={i} style={[styles.warmupLine, styles.rowDivider]}>
                <Text style={[styles.warmupBadge, { width: 40 }]}>W{i + 1}</Text>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <AnimatedNumber
                    value={set.weight}
                    decimals={set.weight % 1 !== 0 ? 1 : 0}
                    style={styles.warmupValue}
                  />
                </View>
                <Text style={[styles.warmupCell, { width: 52, textAlign: 'right' }]}>× {set.reps}</Text>
                <Text style={[styles.warmupCellDim, { width: 48, textAlign: 'right' }]}>{set.restTime}s</Text>
                <Text style={[styles.warmupPct, { width: 46 }]}>{pct}%</Text>
              </View>
            );
          })}
          <View style={styles.warmupLine}>
            <Text style={[styles.warmupBadge, { width: 40, color: hud.accent.regen }]}>TRV</Text>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
              <AnimatedNumber
                value={weight}
                decimals={weight % 1 !== 0 ? 1 : 0}
                style={[styles.warmupValue, { color: hud.accent.regen }]}
              />
            </View>
            <Text style={[styles.warmupCell, { width: 52, textAlign: 'right' }]}>× {targetReps}</Text>
            <Text style={[styles.warmupCellDim, { width: 48, textAlign: 'right' }]}>—</Text>
            <Text style={[styles.warmupPct, { width: 46, color: hud.accent.regen }]}>100%</Text>
          </View>
        </View>

        <ProgressRail progress={1} height={6} segments={sets.length + 1} />
      </View>
    </HudCard>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  headerTitle: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 20,
    letterSpacing: 1.5,
    color: hud.text.primary,
  },
  headerSub: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 11,
    letterSpacing: 0.5,
    color: hud.text.muted,
    marginTop: -2,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 6,
    marginTop: 10,
    gap: 4,
  },
  heroTitle: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 30,
    lineHeight: 32,
    color: hud.text.primary,
  },
  heroDesc: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: hud.text.secondary,
    marginTop: 8,
  },
  recoveryLabel: {
    fontFamily: 'Rajdhani-SemiBold',
    fontSize: 10,
    letterSpacing: 1.8,
    color: hud.text.secondary,
  },
  sectionLabel: {
    fontFamily: 'Rajdhani-SemiBold',
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: hud.text.primary,
  },
  cardTitle: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: 1,
    color: hud.text.primary,
  },
  cardSub: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 13,
    color: hud.text.secondary,
  },
  musclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: hud.border.subtle,
    borderRadius: 3,
    backgroundColor: hud.glow.cyanFaint,
  },
  musclePillText: {
    fontFamily: 'Rajdhani-SemiBold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: hud.cyan.bright,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: hud.border.hairline,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: hud.border.hairline,
  },
  statLabel: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 9,
    letterSpacing: 1.6,
    color: hud.text.muted,
  },
  toolTitle: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: hud.text.primary,
  },
  toolSub: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 8,
    letterSpacing: 1.2,
    color: hud.text.muted,
  },
  adviceTitle: {
    fontFamily: 'Rajdhani-SemiBold',
    fontSize: 14,
    letterSpacing: 0.5,
    color: hud.cyan.bright,
  },
  adviceText: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12.5,
    lineHeight: 17,
    color: hud.text.secondary,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: hud.border.hairline,
  },
  warmupLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  warmupBadge: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 12,
    letterSpacing: 1,
    color: hud.cyan.bright,
  },
  warmupValue: {
    fontFamily: 'Rajdhani-SemiBold',
    fontSize: 16,
    color: hud.text.primary,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  warmupCell: {
    fontFamily: 'Rajdhani-SemiBold',
    fontSize: 13,
    color: hud.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  warmupCellDim: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 12,
    color: hud.text.muted,
    fontVariant: ['tabular-nums'],
  },
  warmupPct: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 13,
    color: hud.cyan.bright,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
