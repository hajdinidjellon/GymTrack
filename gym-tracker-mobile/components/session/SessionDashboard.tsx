/**
 * SESSION DASHBOARD (VARIANTE C) — vue d'ensemble de la séance en cours.
 *
 * Layout : SÉANCE EN COURS · titre (ex. LEGS) · sous-titre · ligne stats
 * (silhouette + 3 stat cards octogonales) · grille 3×2 de mini-cartes
 * exercice · CTAs bas (+ EXERCICE / TERMINER LA SÉANCE).
 *
 * DA : tokens HUD #22D3EE, formes octogonales en Skia (clip-path 8/10/12px),
 * glow Skia BlurMask sur l'état actif (jamais elevation/shadow native).
 */
import React, { useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, Image, ImageBackground, useWindowDimensions, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  Canvas,
  Path as SkPath,
  BlurMask,
  Skia,
} from '@shopify/react-native-skia';
import type { ActiveSession, ActiveExercise, MuscleGroup } from '@/types';
import { hud } from '@/constants/theme';
import { PremiumFrame } from '@/components/ui/PremiumFrame';

// ── DA tokens — re-mappés sur la palette `hud` centralisée ───────────
// Conservé sous le nom DA pour ne pas casser les call-sites existants
// (SessionDashboard, ExerciseCard, RestTimer). Toute nouvelle couleur
// doit passer par hud.* directement.
export const DA = {
  bgPrimary:       hud.bg.app,
  bgCard:          hud.bg.surface,
  bgCardElevated:  hud.bg.surfaceElev,
  bgCardDeep:      hud.bg.surfaceDeep,
  borderDefault:   hud.border.subtle,
  borderActive:    hud.border.active,
  borderGlow:      hud.cyan.bright,
  cyanPrimary:     hud.cyan.primary,
  cyanBright:      hud.cyan.bright,
  white:           hud.text.primary,
  textSecondary:   hud.text.secondary,
  textMuted:       hud.text.muted,
} as const;

// ── Octagon path helper (clip-path polygon avec biseau b sur chaque coin) ──
function octagonPathString(w: number, h: number, b: number): string {
  return `M ${b} 0 L ${w - b} 0 L ${w} ${b} L ${w} ${h - b} L ${w - b} ${h} L ${b} ${h} L 0 ${h - b} L 0 ${b} Z`;
}

// ── Base octogonale ──────────────────────────────────────────────────
export function OctagonShape({
  w, h, bevel = 12, fill = DA.bgCard, border = DA.borderDefault, strokeWidth = 1, glow = false,
}: {
  w: number; h: number; bevel?: number;
  fill?: string; border?: string; strokeWidth?: number;
  glow?: boolean;
}) {
  const path = useMemo(
    () => Skia.Path.MakeFromSVGString(octagonPathString(w, h, bevel))!,
    [w, h, bevel],
  );
  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, width: w, height: h }}>
      {glow && (
        <SkPath path={path} color={DA.cyanPrimary} opacity={0.55} style="fill">
          <BlurMask blur={12} style="solid" />
        </SkPath>
      )}
      <SkPath path={path} color={fill} style="fill" />
      <SkPath path={path} color={border} style="stroke" strokeWidth={strokeWidth} />
    </Canvas>
  );
}

// ── Title block ──────────────────────────────────────────────────────
const SESSION_TITLE: Record<string, { title: string; sub: string }> = {
  legs:  { title: 'LEGS',  sub: '(JAMBES)' },
  push:  { title: 'PUSH',  sub: '(POUSSER)' },
  pull:  { title: 'PULL',  sub: '(TIRER)' },
  other: { title: 'SÉANCE', sub: '(LIBRE)' },
};

function deriveTitle(exercises: ActiveExercise[]): { title: string; sub: string } {
  const muscles = new Set<MuscleGroup>(exercises.flatMap((e) => e.muscleGroups));
  if (muscles.has('legs') || muscles.has('glutes') || muscles.has('calves')) return SESSION_TITLE.legs!;
  if (muscles.has('chest') || muscles.has('shoulders'))                       return SESSION_TITLE.push!;
  if (muscles.has('back'))                                                    return SESSION_TITLE.pull!;
  return SESSION_TITLE.other!;
}

// ── Stat card (PremiumFrame neutral subtle, sans corner accents) ─────
function StatCard({ w, h, value, label }: { w: number; h: number; value: string; label: string }) {
  return (
    <PremiumFrame
      width={w} height={h}
      variant="neutral" cornerCut={10} intensity="subtle"
      showCornerAccents={false} contentPadding={6}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.valueLg}>{value}</Text>
        <Text numberOfLines={1} style={styles.micro}>{label}</Text>
      </View>
    </PremiumFrame>
  );
}

// ── Silhouette card (à gauche de la rangée stats) ────────────────────
const SILHOUETTE = require('@/assets/images/body_front.png');
const DASHBOARD_BG = require('@/assets/images/background-dashboard-session.png');

function SilhouetteCard({ w, h }: { w: number; h: number }) {
  return (
    <PremiumFrame
      width={w} height={h}
      variant="neutral" cornerCut={10} intensity="subtle"
      showCornerAccents={false} contentPadding={6}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={SILHOUETTE}
          resizeMode="contain"
          style={{ width: '90%', height: '90%', tintColor: DA.cyanPrimary, opacity: 0.85 }}
        />
      </View>
    </PremiumFrame>
  );
}

// ── Mini-card exercice (cellule de la grille 3×2) ────────────────────
function categoryLabel(cat: string): string {
  switch (cat) {
    case 'compound':  return 'COMPOUND';
    case 'isolation': return 'ISOLATION';
    case 'accessory': return 'ACCESSORY';
    default:          return cat.toUpperCase();
  }
}

function iconForMuscles(ex: ActiveExercise): keyof typeof MaterialCommunityIcons.glyphMap {
  const muscles = ex.muscleGroups;
  if (muscles.includes('legs') || muscles.includes('glutes')) return 'human-handsdown';
  if (muscles.includes('chest'))     return 'weight-lifter';
  if (muscles.includes('back'))      return 'arm-flex';
  if (muscles.includes('shoulders')) return 'weight-lifter';
  if (muscles.includes('arms'))      return 'arm-flex';
  if (muscles.includes('core'))      return 'human-handsup';
  return 'dumbbell';
}

function MiniExerciseCard({
  size, index, exercise, active, onPress,
}: {
  size: number;
  index: number;
  exercise: ActiveExercise;
  active: boolean;
  onPress: () => void;
}) {
  const completed = exercise.sets.filter((s) => s.completed).length;
  const total     = exercise.sets.length;
  const icon      = iconForMuscles(exercise);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      <PremiumFrame
        width={size} height={size}
        variant={active ? 'active' : 'neutral'}
        cornerCut={12} intensity="normal"
        showCornerAccents contentPadding={12}
      >
        <View style={{ flex: 1 }}>
          {/* Top row : badge + name/category */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <NumberBadge n={index + 1} active={active} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={2} style={[styles.labelSm, { color: DA.white }]}>
                {exercise.name.toUpperCase()}
              </Text>
              <Text numberOfLines={1} style={[styles.micro, { marginTop: 2 }]}>
                {categoryLabel(exercise.category)}
              </Text>
            </View>
          </View>
          {/* Bottom row : icon + progress */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <MaterialCommunityIcons name={icon} size={28} color={DA.cyanPrimary} />
            <Text style={styles.progress}>
              {completed} <Text style={{ color: DA.textSecondary }}>/ {total}</Text>
            </Text>
          </View>
        </View>
      </PremiumFrame>
    </Pressable>
  );
}

// ── Badge numéroté octogonal ─────────────────────────────────────────
function NumberBadge({ n, active }: { n: number; active: boolean }) {
  const size = 30;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={StyleSheet.absoluteFill}>
        <OctagonShape
          w={size} h={size} bevel={8}
          fill="transparent"
          border={DA.cyanPrimary}
          strokeWidth={1}
        />
      </View>
      <Text style={{
        fontSize: 14, fontWeight: '700',
        color: active ? DA.cyanBright : DA.cyanPrimary,
      }}>
        {n}
      </Text>
    </View>
  );
}

// ── Bouton CTA HUD (octogone + chevrons optionnels) ──────────────────
function HudCTA({
  flex, height = 60, variant, label, onPress, textOffsetY = 0,
}: {
  flex: number; height?: number;
  variant: 'primary' | 'outline';
  label: string;
  onPress: () => void;
  textOffsetY?: number;
}) {
  const [w, setW] = React.useState(0);
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={({ pressed }) => ({
        flex, height,
        flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingHorizontal: 16,
        position: 'relative',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {w > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <PremiumFrame
            width={w} height={height}
            variant={isPrimary ? 'active' : 'neutral'}
            cornerCut={isPrimary ? 14 : 12}
            intensity={isPrimary ? 'strong' : 'subtle'}
            showCornerAccents={false}
            contentPadding={0}
          />
        </View>
      )}
      <Text style={{
        fontSize: 14, fontWeight: '700',
        color: isPrimary ? DA.white : DA.cyanPrimary,
        letterSpacing: 1, textTransform: 'uppercase',
        flexShrink: 1, textAlign: 'center',
        marginTop: textOffsetY,
      }}>
        {label}
      </Text>
      {isPrimary && (
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {[1, 0.7, 0.4].map((op, i) => (
            <Text key={i} style={{
              fontSize: 14, fontWeight: '900', color: DA.cyanBright, opacity: op,
            }}>
              ›
            </Text>
          ))}
        </View>
      )}
    </Pressable>
  );
}

// ── Dashboard principal ──────────────────────────────────────────────
interface SessionDashboardProps {
  activeSession: ActiveSession;
  bottomPad: number;
  onPressExercise: (exerciseId: string) => void;
  onAddExercise: () => void;
  onFinishSession: () => void;
  onDiscard: () => void;
}

export function SessionDashboard({
  activeSession, bottomPad, onPressExercise, onAddExercise, onFinishSession, onDiscard,
}: SessionDashboardProps) {
  const { width: sw } = useWindowDimensions();
  const padding = 16;
  const gap     = 10;

  // Computes for the stats row : 1 silhouette + 3 stat cards
  const statsRowAvail = sw - padding * 2;
  const silhouetteW   = 88;
  const statCardW     = Math.floor((statsRowAvail - silhouetteW - gap * 3) / 3);
  const statCardH     = 69;

  // Grid 3×2 mini-cards : taille = (W - padding*2 - gap*2) / 3, carré
  const miniSize      = Math.floor((sw - padding * 2 - gap * 2) / 3);

  // Title block
  const { title, sub } = useMemo(() => deriveTitle(activeSession.exercises), [activeSession.exercises]);

  // Derived stats
  const totalSets     = activeSession.exercises.reduce((t, e) => t + e.sets.length, 0);
  const completedSets = activeSession.exercises.reduce((t, e) => t + e.sets.filter((s) => s.completed).length, 0);
  const volumeKg      = activeSession.exercises.reduce(
    (t, e) => t + e.sets.filter((s) => s.completed).reduce((s, set) => s + set.weight * set.reps, 0),
    0,
  );
  const volumeT       = volumeKg / 1000;
  const volumeStr     = volumeT >= 10
    ? `${volumeT.toFixed(1).replace('.', ',')} t`
    : `${volumeT.toFixed(3).replace('.', ',')} t`;

  // Active exercise = first one with at least one incomplete set
  const activeIdx = activeSession.exercises.findIndex((e) => e.sets.some((s) => !s.completed));

  // Limit to 6 exercises in the grid (UX simplification per maquette)
  const gridExercises = activeSession.exercises.slice(0, 6);

  return (
    <ImageBackground
      source={DASHBOARD_BG}
      resizeMode="cover"
      style={{ flex: 1, backgroundColor: DA.bgPrimary }}
      imageStyle={{ transform: [{ scale: 1.35 }] }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: padding, paddingTop: 12, paddingBottom: bottomPad + 16, gap: 16 }}
        >
          {/* Top bar : back/discard (annule la séance avec confirmation) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Pressable
              onPress={onDiscard}
              hitSlop={10}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <View style={{ width: 36, height: 36 }}>
                <OctagonShape w={36} h={36} bevel={8} fill="transparent" border={DA.borderDefault} />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="arrow-back" size={18} color={DA.textSecondary} />
                </View>
              </View>
            </Pressable>
          </View>

          {/* Title block */}
          <View style={{ gap: 2, marginTop: -48, alignSelf: 'center', alignItems: 'center' }}>
            <Text style={[styles.labelSm, { color: DA.cyanPrimary, marginTop: 4 }]}>SÉANCE EN COURS</Text>
            <Text style={styles.displayXl}>{title}</Text>
            <Text style={styles.subtitleLg}>{sub}</Text>
          </View>

          {/* Stats row : silhouette + 3 stat cards */}
          <View style={{ flexDirection: 'row', gap }}>
            <SilhouetteCard w={silhouetteW} h={statCardH} />
            <StatCard w={statCardW} h={statCardH} value={String(activeSession.exercises.length)} label="EXERCICES" />
            <StatCard w={statCardW} h={statCardH} value={`${completedSets} / ${totalSets}`} label="SÉRIES" />
            <StatCard w={statCardW} h={statCardH} value={volumeStr} label="VOLUME" />
          </View>

          {/* Mini-cards grid 3×2 */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
            {gridExercises.map((ex, i) => (
              <MiniExerciseCard
                key={ex.id}
                size={miniSize}
                index={i}
                exercise={ex}
                active={i === activeIdx}
                onPress={() => onPressExercise(ex.id)}
              />
            ))}
          </View>

          {/* CTA row */}
          <View style={{ flexDirection: 'row', gap, marginTop: 16 }}>
            <HudCTA flex={1.1} variant="outline" label="+ EXERCICE" textOffsetY={6} onPress={onAddExercise} />
            <HudCTA flex={1.5} variant="primary" label="TERMINER LA SÉANCE" textOffsetY={6} onPress={onFinishSession} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  displayXl: {
    fontSize: 56, fontWeight: '700',
    color: DA.white, letterSpacing: 1,
    lineHeight: 60, textTransform: 'uppercase',
  },
  subtitleLg: {
    fontSize: 28, fontWeight: '700',
    color: DA.white, letterSpacing: 0,
    lineHeight: 32,
  },
  valueLg: {
    fontSize: 22, fontWeight: '700',
    color: DA.white, letterSpacing: -0.4,
  },
  labelSm: {
    fontSize: 11, fontWeight: '600',
    color: DA.textSecondary, letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  micro: {
    fontSize: 10, fontWeight: '500',
    color: DA.textSecondary, letterSpacing: 1.2,
    textTransform: 'uppercase', marginTop: 4,
  },
  progress: {
    fontSize: 16, fontWeight: '700', color: DA.white,
  },
});
