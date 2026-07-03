import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, TextInput, Modal,
  Animated, Easing, Image, StyleSheet, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polygon, Circle, Line, Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg';
import {
  Canvas,
  Path as SkPath,
  Circle as SkCircle,
  Group as SkGroup,
  BlurMask,
  LinearGradient as SkLinearGradient,
  vec,
  Skia,
  Text as SkiaText,
  useFont,
} from '@shopify/react-native-skia';
import { useBottomNavPadding } from '@/hooks/useBottomNavPadding';
import { differenceInDays } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useT } from '@/lib/i18n';
import { ExerciseCard } from '@/components/session/ExerciseCard';
import { RestTimer } from '@/components/session/RestTimer';
import { SessionTimer } from '@/components/session/TimerRing';
import { SessionDashboard } from '@/components/session/SessionDashboard';
import { Mascot } from '@/components/mascot/Mascot';
import { ScreenBackground, BG_COLORS } from '@/components/ui/ScreenBackground';
import { DailySessionCard, TRAINING_MODES, type TrainingMode } from '@/components/workout/DailySessionCard';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { calculate1RM } from '@/lib/aiPlanner';
import { MUSCLE_LABELS } from '@/lib/gamification';
import { useCelebrationStore } from '@/stores/celebrationStore';
import { EXERCISE_GROUPS, filterGroups, type ExerciseDefinition, type ExerciseGroup } from '@/lib/exerciseDatabase';
import type { ActiveExercise, MuscleGroup, Workout, WorkoutSet, WorkoutType } from '@/types';
import { router } from 'expo-router';

const WORKOUT_MODES: Array<{
  type: WorkoutType;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  { type: 'strength',    icon: 'barbell-outline', color: '#38bdf8' },
  { type: 'hypertrophy', icon: 'body-outline',    color: '#818cf8' },
  { type: 'cardio',      icon: 'pulse-outline',   color: '#34d399' },
  { type: 'mobility',    icon: 'leaf-outline',    color: '#fb923c' },
];

// ═══════════════════════════════════════════════════════════════════
// HUD DESIGN — Page Séance (état "pas de séance active")
// ═══════════════════════════════════════════════════════════════════

const HUD_CYAN     = '#1DC4FF';
const HUD_CYAN_HI  = '#5DD8FF';
const HUD_BG       = '#050B16';
const HUD_BG_CARD  = 'rgba(8,20,38,0.85)';
const HUD_BORDER   = 'rgba(29,196,255,0.30)';

// ── Skia path constants (created once, never re-created on render) ──
// Octagon (bell button) — canvas 64x64, octagon 48x48 centered with 8px padding for blur
const SK_OCTAGON_CANVAS = 64;
const SK_OCTAGON_PATH = Skia.Path.MakeFromSVGString(
  'M 20,8 L 44,8 L 56,20 L 56,44 L 44,56 L 20,56 L 8,44 L 8,20 Z'
)!;
// Top highlight stroke of the octagon (subtle reflet sur le bord supérieur)
const SK_OCTAGON_HIGHLIGHT = Skia.Path.MakeFromSVGString(
  'M 20,8 L 44,8 L 56,20'
)!;

// Hexagon (step badge) — canvas 40x40, hex 32x32 centered with 4px padding for blur
const SK_HEX_CANVAS = 40;
const SK_HEX_PATH = Skia.Path.MakeFromSVGString(
  'M 20,5 L 34,13 L 34,27 L 20,35 L 6,27 L 6,13 Z'
)!;

// Mode-selector card — 78x88 (4 cartes × 78 + 3 gaps de 8 = 336 → tient sur iPhone SE)
// L'encadrement est dessiné via PNG (mode-card-active.png / mode-card-inactive.png).
// Le fond intérieur (octogonal) est dessiné en Skia DERRIÈRE le PNG pour donner
// du contraste avec l'arrière-plan sombre de la page.
const SK_MODE_CARD_W = 78;
const SK_MODE_CARD_H = 88;
const SK_MODE_BEVEL  = 17;
const SK_MODE_PAD    = 8;
// Gap fixe garanti entre chaque carte (jamais "space-between" qui peut décaler au pixel près)
const SK_MODE_GAP    = 8;
const SK_MODE_CANVAS_W = SK_MODE_CARD_W + SK_MODE_PAD * 2; // 94
const SK_MODE_CANVAS_H = SK_MODE_CARD_H + SK_MODE_PAD * 2; // 104
// Octogone du fond intérieur, exprimé en coordonnées du canvas (offset par SK_MODE_PAD)
const SK_MODE_FILL_PATH = Skia.Path.MakeFromSVGString(
  `M ${SK_MODE_PAD + SK_MODE_BEVEL},${SK_MODE_PAD} ` +
  `L ${SK_MODE_PAD + SK_MODE_CARD_W - SK_MODE_BEVEL},${SK_MODE_PAD} ` +
  `L ${SK_MODE_PAD + SK_MODE_CARD_W},${SK_MODE_PAD + SK_MODE_BEVEL} ` +
  `L ${SK_MODE_PAD + SK_MODE_CARD_W},${SK_MODE_PAD + SK_MODE_CARD_H - SK_MODE_BEVEL} ` +
  `L ${SK_MODE_PAD + SK_MODE_CARD_W - SK_MODE_BEVEL},${SK_MODE_PAD + SK_MODE_CARD_H} ` +
  `L ${SK_MODE_PAD + SK_MODE_BEVEL},${SK_MODE_PAD + SK_MODE_CARD_H} ` +
  `L ${SK_MODE_PAD},${SK_MODE_PAD + SK_MODE_CARD_H - SK_MODE_BEVEL} ` +
  `L ${SK_MODE_PAD},${SK_MODE_PAD + SK_MODE_BEVEL} Z`
)!;

// Active indicator arrows (▼ above, ▲ below) — 14px wide, 8px tall, drawn in 22x14 canvas
const SK_ARROW_DOWN = Skia.Path.MakeFromSVGString('M 4,2 L 18,2 L 11,10 Z')!;
const SK_ARROW_UP   = Skia.Path.MakeFromSVGString('M 4,10 L 18,10 L 11,2 Z')!;

// Rajdhani Bold TTF — used by Skia for the SÉANCE title & # filigree
const RAJDHANI_BOLD_TTF = require('@expo-google-fonts/rajdhani/700Bold/Rajdhani_700Bold.ttf');

const SESSION_BG   = require('@/assets/images/background-session.png') as number;
const MODE_CARD_ACTIVE   = require('@/assets/images/mode-card-active.png') as number;
const MODE_CARD_INACTIVE = require('@/assets/images/mode-card-inactive.png') as number;

// ── Modes d'entraînement + carte Séance du jour : composant partagé
//    avec la page IA Coach (components/workout/DailySessionCard.tsx).

// ── HUD ambient corner decoration (Skia) ────────────────────────────
function HudCornerDeco({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left';
  const mainPath = isLeft
    ? 'M 0,14 L 32,14 L 42,4 L 78,4'
    : 'M 140,14 L 108,14 L 98,4 L 62,4';
  const tailPath = isLeft
    ? 'M 84,4 L 118,4'
    : 'M 56,4 L 22,4';
  const bigDotCx  = isLeft ? 42 : 98;
  const midDotCx  = isLeft ? 78 : 62;
  const tinyDotCx = isLeft ? 122 : 18;

  return (
    <Canvas style={{ width: 140, height: 28 }} pointerEvents="none">
      <SkPath path={mainPath} color={HUD_CYAN} style="stroke" strokeWidth={1} opacity={0.55} />
      <SkPath path={tailPath} color={HUD_CYAN} style="stroke" strokeWidth={0.8} opacity={0.35} />
      <SkGroup>
        <SkCircle cx={bigDotCx} cy={4} r={2.5} color={HUD_CYAN_HI}>
          <BlurMask blur={3} style="solid" />
        </SkCircle>
      </SkGroup>
      <SkCircle cx={midDotCx} cy={4} r={1.6} color={HUD_CYAN_HI} opacity={0.75} />
      <SkCircle cx={tinyDotCx} cy={4} r={1} color={HUD_CYAN_HI} opacity={0.55} />
    </Canvas>
  );
}

// ── Scan-line decoration (Skia, glow on lumineux points) ───────────
function ScanLines({ width = 140 }: { width?: number }) {
  const p1x = Math.round(width * 0.30);
  const p2x = Math.round(width * 0.36);
  const p3x = Math.round(width * 0.40);
  const p4x = Math.round(width * 0.70);
  const p5x = Math.round(width * 0.76);
  const p6x = Math.round(width * 0.80);
  return (
    <Canvas style={{ width, height: 16 }} pointerEvents="none">
      <SkGroup>
        <SkCircle cx={4} cy={8} r={2.5} color={HUD_CYAN_HI}>
          <BlurMask blur={3} style="solid" />
        </SkCircle>
      </SkGroup>
      <SkPath path={`M 12,8 L ${p1x},8`} color={HUD_CYAN} style="stroke" strokeWidth={1} opacity={0.7} />
      <SkGroup>
        <SkCircle cx={p2x} cy={8} r={1.8} color={HUD_CYAN_HI} opacity={0.85}>
          <BlurMask blur={2} style="solid" />
        </SkCircle>
      </SkGroup>
      <SkPath path={`M ${p3x},8 L ${p4x},8`} color={HUD_CYAN} style="stroke" strokeWidth={1} opacity={0.5} />
      <SkCircle cx={p5x} cy={8} r={1} color={HUD_CYAN_HI} opacity={0.6} />
      <SkPath path={`M ${p6x},8 L ${width - 2},8`} color={HUD_CYAN} style="stroke" strokeWidth={0.8} opacity={0.3} />
    </Canvas>
  );
}

// ── Titre SÉANCE (Skia gradient + glow externe) ────────────────────
function SeanceTitle() {
  const TITLE_SIZE = 38;
  const PAD_X = 16; // marge intérieure pour laisser respirer le glow horizontal
  const PAD_TOP = 8;
  const HEIGHT = 56;

  const font = useFont(RAJDHANI_BOLD_TTF, TITLE_SIZE);
  const text = 'SÉANCE';

  // Fallback natif quand la font Skia n'est pas encore prête (premier frame)
  if (!font) {
    return (
      <View>
        <Text style={{
          position: 'absolute', top: 2, left: 2,
          fontSize: TITLE_SIZE - 2, fontWeight: '900',
          color: '#0090C8',
          letterSpacing: 1.5, textTransform: 'uppercase',
          opacity: 0.85,
        }}>
          {text}
        </Text>
        <Text style={{
          fontSize: TITLE_SIZE - 2, fontWeight: '900',
          color: HUD_CYAN_HI,
          letterSpacing: 1.5, textTransform: 'uppercase',
          textShadowColor: '#00B4F0',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 12,
        }}>
          {text}
        </Text>
      </View>
    );
  }

  const textWidth = font.measureText(text).width;
  const canvasWidth = Math.ceil(textWidth + PAD_X * 2);
  // baseline visuelle ≈ taille × 0.85 + padding top
  const baselineY = PAD_TOP + TITLE_SIZE * 0.85;

  return (
    <Canvas style={{ width: canvasWidth, height: HEIGHT }}>
      {/* Glow externe — texte flou cyan en arrière-plan */}
      <SkGroup>
        <SkiaText
          x={PAD_X}
          y={baselineY}
          text={text}
          font={font}
          color="#00B4F0"
          opacity={0.75}
        >
          <BlurMask blur={12} style="normal" />
        </SkiaText>
      </SkGroup>

      {/* Texte principal avec gradient vertical (clair → cyan → foncé) */}
      <SkiaText
        x={PAD_X}
        y={baselineY}
        text={text}
        font={font}
      >
        <SkLinearGradient
          start={vec(0, PAD_TOP)}
          end={vec(0, PAD_TOP + TITLE_SIZE)}
          colors={['#7FE5FF', '#1DC4FF', '#0090C8']}
        />
      </SkiaText>
    </Canvas>
  );
}

// ── Octagonal bell button (Skia, 4 couches : glow / fond / bordure / highlight) ──
function OctagonalBellButton({ onPress, hasNotification = true }: {
  onPress?: () => void; hasNotification?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: SK_OCTAGON_CANVAS, height: SK_OCTAGON_CANVAS,
        opacity: pressed ? 0.78 : 1,
      })}
    >
      <Canvas style={{ width: SK_OCTAGON_CANVAS, height: SK_OCTAGON_CANVAS }}>
        {/* Couche 1 — Glow externe (octogone flou cyan) */}
        <SkGroup>
          <SkPath path={SK_OCTAGON_PATH} color="#00B4F0" opacity={0.45}>
            <BlurMask blur={10} style="solid" />
          </SkPath>
        </SkGroup>

        {/* Couche 2 — Fond dégradé vertical */}
        <SkPath path={SK_OCTAGON_PATH}>
          <SkLinearGradient
            start={vec(0, 8)}
            end={vec(0, 56)}
            colors={['#0A1828', '#04101D', '#020810']}
          />
        </SkPath>

        {/* Couche 3 — Bordure cyan */}
        <SkPath
          path={SK_OCTAGON_PATH}
          color={HUD_CYAN}
          style="stroke"
          strokeWidth={1.5}
          opacity={0.85}
        />

        {/* Couche 4 — Highlight subtil sur le bord supérieur */}
        <SkPath
          path={SK_OCTAGON_HIGHLIGHT}
          color={HUD_CYAN_HI}
          style="stroke"
          strokeWidth={0.8}
          opacity={0.6}
        />
      </Canvas>

      {/* Icône cloche centrée sur l'octogone (qui est à [8,8]-[56,56] dans le canvas 64x64) */}
      <View style={{
        position: 'absolute',
        top: 8, left: 8, width: 48, height: 48,
        justifyContent: 'center', alignItems: 'center',
      }} pointerEvents="none">
        <Ionicons name="notifications-outline" size={22} color={HUD_CYAN_HI} />
      </View>

      {/* Pastille de notification (avec glow + bord détaché) */}
      {hasNotification && (
        <View style={{
          position: 'absolute',
          top: 12, right: 12,
          width: 10, height: 10, borderRadius: 5,
          backgroundColor: HUD_CYAN_HI,
          borderWidth: 1.5, borderColor: '#020810',
          shadowColor: '#00B4F0', shadowOpacity: 1, shadowRadius: 5,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        }} pointerEvents="none" />
      )}
    </Pressable>
  );
}

// ── Mode indicator arrows (▼ above / ▲ below active card) ──────────
function ModeIndicator({ direction }: { direction: 'down' | 'up' }) {
  const path = direction === 'down' ? SK_ARROW_DOWN : SK_ARROW_UP;
  const positionStyle =
    direction === 'down'
      ? { top: -14 as const }
      : { bottom: -14 as const };
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0, right: 0,
        alignItems: 'center',
        ...positionStyle,
      }}
    >
      <Canvas style={{ width: 22, height: 14 }}>
        <SkGroup>
          <SkPath path={path} color="#00B4F0" opacity={0.75}>
            <BlurMask blur={4} style="solid" />
          </SkPath>
        </SkGroup>
        <SkPath path={path} color="#5DD8FF" />
      </Canvas>
    </View>
  );
}

// ── Mode info bar (Skia HUD bevel + side ◂ ▸ accents) ──────────────
function ModeInfoBar({ text }: { text: string }) {
  const { width: screenWidth } = useWindowDimensions();
  // Barre compacte : largeur réduite (pas pleine largeur), hauteur basse.
  const BAR_W = Math.min(290, screenWidth - 48);
  const BAR_H = 34;
  const BEVEL = 8;
  const ACCENT_REACH = 3;
  const PAD_X = ACCENT_REACH + 2; // espace canvas pour les accents qui sortent

  // Path principal (octogone aplati) + accents — mémoïsés par largeur
  const { mainPath, leftAccent, rightAccent } = useMemo(() => {
    const innerW = BAR_W;
    const ox = PAD_X; // offset x dans le canvas
    const main = Skia.Path.MakeFromSVGString(
      `M ${ox + BEVEL},0 ` +
      `L ${ox + innerW - BEVEL},0 ` +
      `L ${ox + innerW},${BEVEL} ` +
      `L ${ox + innerW},${BAR_H - BEVEL} ` +
      `L ${ox + innerW - BEVEL},${BAR_H} ` +
      `L ${ox + BEVEL},${BAR_H} ` +
      `L ${ox},${BAR_H - BEVEL} ` +
      `L ${ox},${BEVEL} Z`
    )!;
    const left = Skia.Path.MakeFromSVGString(
      `M ${ox},${BAR_H / 2 - 6} L ${ox - ACCENT_REACH},${BAR_H / 2} L ${ox},${BAR_H / 2 + 6}`
    )!;
    const right = Skia.Path.MakeFromSVGString(
      `M ${ox + innerW},${BAR_H / 2 - 6} L ${ox + innerW + ACCENT_REACH},${BAR_H / 2} L ${ox + innerW},${BAR_H / 2 + 6}`
    )!;
    return { mainPath: main, leftAccent: left, rightAccent: right };
  }, [BAR_W]);

  const canvasWidth = BAR_W + PAD_X * 2;

  return (
    <View style={{ height: BAR_H, width: BAR_W, alignSelf: 'center', marginBottom: 12 }}>
      <Canvas style={{
        position: 'absolute',
        width: canvasWidth, height: BAR_H,
        left: -PAD_X,
      }}>
        {/* Fond dégradé */}
        <SkPath path={mainPath}>
          <SkLinearGradient
            start={vec(0, 0)}
            end={vec(0, BAR_H)}
            colors={['#0A1828', '#04101D']}
          />
        </SkPath>
        {/* Bordure cyan */}
        <SkPath path={mainPath} color={HUD_CYAN} style="stroke" strokeWidth={1.5} opacity={0.75} />
        {/* Accents décoratifs ◂ ▸ sur les côtés */}
        <SkPath path={leftAccent} color="#5DD8FF" style="stroke" strokeWidth={1.5} />
        <SkPath path={rightAccent} color="#5DD8FF" style="stroke" strokeWidth={1.5} />
      </Canvas>

      {/* Contenu textuel par-dessus */}
      <View style={{
        flex: 1, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 12,
        gap: 7,
      }} pointerEvents="none">
        <Ionicons name="information-circle-outline" size={14} color={HUD_CYAN} />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: HUD_CYAN, fontSize: 11, fontWeight: '700',
            letterSpacing: 0.9, textTransform: 'uppercase',
            flexShrink: 1,
          }}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

// ── Octogonal Mode Card (Skia, Pressable comme container flex) ──────
function OctagonalModeCard({
  mode, active, onPress,
}: { mode: TrainingMode; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.78 : 1,
        width: SK_MODE_CARD_W, height: SK_MODE_CARD_H,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      })}
    >
      {/* Fond bleu octogonal DERRIÈRE le PNG → contraste avec l'arrière-plan */}
      <Canvas
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: SK_MODE_CANVAS_W, height: SK_MODE_CANVAS_H,
          top: -SK_MODE_PAD, left: -SK_MODE_PAD,
        }}
      >
        <SkPath path={SK_MODE_FILL_PATH}>
          <SkLinearGradient
            start={vec(0, SK_MODE_PAD)}
            end={vec(0, SK_MODE_PAD + SK_MODE_CARD_H)}
            colors={
              active
                ? ['#0F3A5C', '#0A2742', '#06182C']
                : ['#0A1E3A', '#06142A', '#04101F']
            }
          />
        </SkPath>
      </Canvas>

      {/* Encadrement PNG (actif / inactif) — l'Image ne capture pas les touches, la Pressable les reçoit */}
      <Image
        source={active ? MODE_CARD_ACTIVE : MODE_CARD_INACTIVE}
        resizeMode="stretch"
        style={{
          position: 'absolute',
          width: SK_MODE_CANVAS_W, height: SK_MODE_CANVAS_H,
          top: -SK_MODE_PAD, left: -SK_MODE_PAD,
        }}
      />

      {/* Icône + label dans un wrapper en flow flex normal (la Pressable les centre),
          décalé via transform car le PNG n'est pas optiquement centré
          → contenu glissé +15px vers le bas (cartes désormais 78x88). */}
      <View
        style={{
          alignItems: 'center',
          gap: 5,
          transform: [{ translateY: 15 }],
        }}
      >
        {/* Icône SVG custom (style line-art HUD, cohérent avec le dock) +
            glow cyan derrière quand actif → effet "verre lumineux" */}
        <View
          style={
            active
              ? {
                  shadowColor: '#46C6F5',
                  shadowOpacity: 0.85,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 6,
                }
              : undefined
          }
        >
          <mode.Icon color={active ? '#9CE7FF' : HUD_CYAN} />
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={{
            fontSize: 12, fontWeight: '800',
            color: active ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
            letterSpacing: 0.4, textTransform: 'uppercase',
            textAlign: 'center',
            paddingHorizontal: 4,
          }}
        >
          {mode.label}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Hexagonal step badge (Skia) with # filigree ─────────────────────
function StepBadge({ n }: { n: number }) {
  const filigreeFont = useFont(RAJDHANI_BOLD_TTF, 18);
  return (
    <View style={{
      width: SK_HEX_CANVAS, height: SK_HEX_CANVAS,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Canvas style={{ width: SK_HEX_CANVAS, height: SK_HEX_CANVAS, position: 'absolute' }}>
        {/* Glow externe */}
        <SkGroup>
          <SkPath path={SK_HEX_PATH} color="#00B4F0" opacity={0.35}>
            <BlurMask blur={6} style="solid" />
          </SkPath>
        </SkGroup>

        {/* Fond dégradé */}
        <SkPath path={SK_HEX_PATH}>
          <SkLinearGradient
            start={vec(0, 5)}
            end={vec(0, 35)}
            colors={['#0A1828', '#03070F']}
          />
        </SkPath>

        {/* # en filigrane (Skia Text avec Rajdhani Bold) */}
        {filigreeFont && (
          <SkiaText
            x={13}
            y={26}
            text="#"
            font={filigreeFont}
            color={HUD_CYAN}
            opacity={0.22}
          />
        )}

        {/* Bordure cyan */}
        <SkPath
          path={SK_HEX_PATH}
          color={HUD_CYAN}
          style="stroke"
          strokeWidth={1.5}
        />
      </Canvas>

      {/* "1" par-dessus, avec textShadow cyan */}
      <Text style={{
        color: HUD_CYAN_HI,
        fontSize: 14,
        fontWeight: '900',
        textShadowColor: '#00B4F0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 5,
        zIndex: 10,
      }}>{n}</Text>
    </View>
  );
}

// ── Bouton DÉMARRER LA SÉANCE — style chevron HUD ────────────────────
function StartHUDButton({ onPress, label = 'DÉMARRER LA SÉANCE' }: {
  onPress: () => void; label?: string;
}) {
  const W = 300, H = 56, tip = 24, body = W - tip, r = 4;
  const tipLen = Math.sqrt(tip * tip + (H / 2) * (H / 2));
  const rt = 3;
  const rtx  = Math.round(W  - rt * (tip / tipLen));
  const rty1 = Math.round(H / 2 - rt * ((H / 2) / tipLen));
  const rty2 = Math.round(H / 2 + rt * ((H / 2) / tipLen));
  const d = `M ${r} 0 L ${body} 0 L ${rtx} ${rty1} Q ${W} ${H / 2} ${rtx} ${rty2} L ${body} ${H} L ${r} ${H} Q 0 ${H} 0 ${H - r} L 0 ${r} Q 0 0 ${r} 0 Z`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        alignSelf: 'center',
        opacity: pressed ? 0.85 : 1,
        shadowColor: HUD_CYAN, shadowOpacity: 0.85,
        shadowRadius: 24, shadowOffset: { width: 0, height: 6 },
        elevation: 14,
      })}
    >
      <View style={{ width: W, height: H }}>
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgGradient id="startBtnGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0"    stopColor="#2196F3" stopOpacity={1} />
              <Stop offset="0.45" stopColor="#0D5BC8" stopOpacity={1} />
              <Stop offset="1"    stopColor="#072B6A" stopOpacity={1} />
            </SvgGradient>
            <SvgGradient id="startBtnShine" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0"    stopColor="#FFFFFF" stopOpacity={0.25} />
              <Stop offset="0.5"  stopColor="#FFFFFF" stopOpacity={0} />
            </SvgGradient>
          </Defs>
          <Path d={d} fill="url(#startBtnGrad)" />
          <Path d={d} fill="url(#startBtnShine)" />
          <Path d={d} fill="none" stroke={HUD_CYAN_HI} strokeWidth={1.2} strokeLinejoin="round" strokeOpacity={0.85} />
        </Svg>

        <View pointerEvents="none" style={{
          position: 'absolute', top: 0, left: 0,
          width: body, height: H,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          gap: 6,
          // Label descendu de 5px et décalé de 8px vers la droite par rapport au centre du bouton.
          transform: [{ translateX: 8 }, { translateY: 5 }],
        }}>
          <Text style={{
            fontSize: 12, fontWeight: '900', color: '#fff',
            letterSpacing: 1.1, textTransform: 'uppercase',
          }}>
            {label}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '900', color: HUD_CYAN_HI, letterSpacing: -1 }}>›››</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── COPIE EXACTE depuis index.tsx pour la section "SÉANCES RÉCENTES" ──
// Couleur cyan d'index.tsx, légèrement différente du HUD cyan local.
const HOME_CYAN = '#17B8FF';

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

function homeWorkoutDuration(w: Workout): number {
  if (w.duration && w.duration > 0) return w.duration;
  const sets = w.exercises.reduce(
    (s, ex) => s + ex.sets.filter((set) => set.completed !== false).length,
    0,
  );
  return Math.max(20, Math.round(sets * 2.5));
}

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
      <SessionIcon type={type} color={HOME_CYAN} size={15} />
    </View>
  );
}

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
      <Text style={{ color: HOME_CYAN, fontSize: 13, fontFamily: 'Rajdhani-SemiBold', lineHeight: 14 }}>›</Text>
    </View>
  );
}

function RecentRow({ workout, isLast }: { workout: Workout; isLast: boolean }) {
  const type = detectSessionType(workout.name);
  const dur  = homeWorkoutDuration(workout);
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
        <OctagonIcon type={type} />
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
        <View style={{ marginLeft: 12 }}>
          <ChevronBox />
        </View>
      </View>
    </Pressable>
  );
}

// ── Hex-cadred icon (utilisé dans historique) ───────────────────────
function HexIconBox({ icon, size = 38 }: { icon: keyof typeof Ionicons.glyphMap; size?: number }) {
  const W = size, H = size, cut = size * 0.30;
  const d = `M ${cut} 0 L ${W - cut} 0 L ${W} ${H / 2} L ${W - cut} ${H} L ${cut} ${H} L 0 ${H / 2} Z`;
  return (
    <View style={{ width: W, height: H, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Path d={d} fill="rgba(29,196,255,0.10)" stroke={HUD_CYAN} strokeWidth={1} />
      </Svg>
      <Ionicons name={icon} size={size * 0.45} color={HUD_CYAN} />
    </View>
  );
}

// ── Helper: map WorkoutType -> label affiché historique ─────────────
const TYPE_LABEL_FALLBACK: Record<WorkoutType, string> = {
  strength: 'FORCE', hypertrophy: 'HYPERTROPHIE', power: 'PUISSANCE',
  endurance: 'ENDURANCE', cardio: 'CARDIO', mobility: 'MOBILITÉ',
  ppl: 'PPL', fullbody: 'FULL BODY',
};

function workoutDurationMin(w: { duration?: number; exercises: { sets: { completed?: boolean }[] }[] }): number {
  if (w.duration && w.duration > 0) return w.duration;
  const sets = w.exercises.reduce((s, ex) => s + ex.sets.filter((set) => set.completed !== false).length, 0);
  return Math.max(20, Math.round(sets * 2.5));
}

function relativeDay(date: string): string {
  const d = differenceInDays(new Date(), new Date(date));
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Hier';
  return `Il y a ${d} jours`;
}

// ── ExercisePicker — catégories + recherche + custom ────────────────
const MUSCLE_GROUP_OPTIONS: Array<{ id: MuscleGroup; label: string }> = [
  { id: 'chest',     label: 'Pectoraux' },
  { id: 'back',      label: 'Dos' },
  { id: 'shoulders', label: 'Épaules' },
  { id: 'arms',      label: 'Bras' },
  { id: 'legs',      label: 'Jambes' },
  { id: 'glutes',    label: 'Fessiers' },
  { id: 'core',      label: 'Abdos' },
  { id: 'calves',    label: 'Mollets' },
];

// ── Card exercice premium ─────────────────────────────────────────────
function ExerciseCard_Picker({
  ex, group, onPress,
}: {
  ex: ExerciseDefinition;
  group: ExerciseGroup;
  onPress: () => void;
}) {
  const iconName = ex.category === 'compound' ? 'barbell' : ex.category === 'isolation' ? 'fitness' : 'flash';
  const muscles  = ex.muscleGroups.slice(0, 3)
    .map((m) => MUSCLE_GROUP_OPTIONS.find((o) => o.id === m)?.label ?? m)
    .join(' · ');
  const catLabel = ex.category === 'compound' ? 'Compound' : ex.category === 'isolation' ? 'Isolation' : 'Accessoire';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: pressed ? 'rgba(255,255,255,0.07)' : 'rgba(12,12,22,0.90)',
        overflow: 'hidden',
      })}
    >
      {/* Bloc icône gauche avec dégradé */}
      <LinearGradient
        colors={[`${group.color}35`, `${group.color}12`] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: 68, height: 68, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={28} color={group.color} />
      </LinearGradient>

      {/* Séparateur vertical coloré */}
      <View style={{ width: 1, height: 38, backgroundColor: `${group.color}30` }} />

      {/* Texte */}
      <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 15 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2, marginBottom: 4 }}>
          {ex.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.38)' }}>
            {muscles}
          </Text>
          <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.20)' }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: `${group.color}CC` }}>
            {catLabel}
          </Text>
        </View>
      </View>

      {/* Flèche */}
      <View style={{ marginRight: 16 }}>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.22)" />
      </View>
    </Pressable>
  );
}

// ── Picker principal ─────────────────────────────────────────────────
function ExercisePicker({ visible, onSelect, onClose }: {
  visible: boolean;
  onSelect: (exercise: Omit<ActiveExercise, 'isExpanded'>) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [search, setSearch]               = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ExerciseGroup | null>(null);
  const [customMode, setCustomMode]       = useState(false);
  const [customName, setCustomName]       = useState('');
  const [customMuscles, setCustomMuscles] = useState<MuscleGroup[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredGroups = filterGroups(search);
  const searching      = search.trim().length > 0;

  const searchResults: Array<{ ex: ExerciseDefinition; group: ExerciseGroup }> = searching
    ? filteredGroups.flatMap((g) => g.exercises.map((ex) => ({ ex, group: g })))
    : [];

  const handlePick = (ex: ExerciseDefinition) => {
    onSelect({
      id: `${ex.name}-${Date.now()}`,
      name: ex.name,
      category: ex.category,
      muscleGroups: ex.muscleGroups,
      sets: [{ weight: 0, reps: 8, setType: 'normal', completed: false }],
    });
    setSearch('');
    setSelectedGroup(null);
    onClose();
  };

  const handleSaveCustom = () => {
    const name = customName.trim();
    if (name.length < 2 || customMuscles.length === 0) return;
    onSelect({
      id: `custom-${Date.now()}`,
      name,
      category: 'accessory',
      muscleGroups: customMuscles,
      sets: [{ weight: 0, reps: 8, setType: 'normal', completed: false }],
    });
    setCustomMode(false); setCustomName(''); setCustomMuscles([]);
    setSearch(''); setSelectedGroup(null);
    onClose();
  };

  const toggleMuscle = (m: MuscleGroup) =>
    setCustomMuscles((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m]);

  const handleBack = () => {
    if (customMode)     { setCustomMode(false); return; }
    if (selectedGroup)  { setSelectedGroup(null); return; }
    onClose();
  };

  const accentColor = selectedGroup ? selectedGroup.color : BG_COLORS.accent;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onDismiss={() => { setCustomMode(false); setSearch(''); setSelectedGroup(null); }}
    >
      <View style={{ flex: 1, backgroundColor: '#08080f' }}>
        <ScreenBackground variant="session" topHalo={false} />
        <SafeAreaView style={{ flex: 1 }}>

          {/* ══ HEADER PREMIUM ══ */}
          <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>

              {/* Titre + sous-titre */}
              <View style={{ flex: 1 }}>
                {/* Breadcrumb / back */}
                {(customMode || selectedGroup) ? (
                  <Pressable
                    onPress={handleBack}
                    hitSlop={10}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}
                  >
                    <Ionicons name="arrow-back" size={16} color={accentColor} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: accentColor }}>
                      {selectedGroup ? 'Groupes musculaires' : 'Retour'}
                    </Text>
                  </Pressable>
                ) : null}

                <Text style={{
                  fontSize: 32, fontWeight: '900', color: '#fff',
                  letterSpacing: -1, lineHeight: 36,
                }}>
                  {customMode
                    ? t('picker.customTitle')
                    : selectedGroup
                    ? selectedGroup.label.toUpperCase()
                    : 'Exercices'}
                </Text>

                <Text style={{
                  fontSize: 13, fontWeight: '600', marginTop: 5,
                  color: selectedGroup ? `${selectedGroup.color}BB` : 'rgba(255,255,255,0.38)',
                }}>
                  {customMode
                    ? 'Crée ton exercice personnalisé'
                    : selectedGroup
                    ? `${selectedGroup.exercises.length} exercices · ${selectedGroup.hint}`
                    : 'Sélectionne un groupe musculaire'}
                </Text>
              </View>

              {/* Bouton fermer / icône search */}
              {!selectedGroup && !customMode ? (
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  style={({ pressed }) => ({
                    width: 42, height: 42, borderRadius: 21,
                    backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
                    alignItems: 'center', justifyContent: 'center',
                    marginTop: 2,
                  })}
                >
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.75)" />
                </Pressable>
              ) : selectedGroup ? (
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  style={({ pressed }) => ({
                    width: 42, height: 42, borderRadius: 21,
                    backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
                    alignItems: 'center', justifyContent: 'center',
                    marginTop: 2,
                  })}
                >
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.75)" />
                </Pressable>
              ) : null}
            </View>

            {/* Barre de recherche — visible uniquement sur l'écran principal */}
            {!selectedGroup && !customMode && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1.5,
                borderColor: searchFocused || searching ? `${BG_COLORS.accent}70` : 'rgba(255,255,255,0.08)',
                borderRadius: 16, paddingHorizontal: 14, marginTop: 16,
                shadowColor: searchFocused ? BG_COLORS.accent : 'transparent',
                shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
              }}>
                <Ionicons name="search-outline" size={18}
                  color={searchFocused || searching ? BG_COLORS.accent : 'rgba(255,255,255,0.30)'} />
                <TextInput
                  style={{ flex: 1, fontSize: 15, color: '#fff', paddingVertical: 13, fontWeight: '600' }}
                  placeholder="Rechercher un exercice…"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={search}
                  onChangeText={setSearch}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.35)" />
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* ══ MODE CUSTOM ══ */}
          {customMode ? (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 22 }}>
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.8, textTransform: 'uppercase' }}>
                  {t('picker.customNameLabel')}
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderWidth: 1.5,
                  borderColor: customName.trim().length >= 2 ? BG_COLORS.accent : 'rgba(255,255,255,0.09)',
                  borderRadius: 18, paddingHorizontal: 16,
                  shadowColor: customName.trim().length >= 2 ? BG_COLORS.accent : 'transparent',
                  shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
                }}>
                  <Ionicons name="create-outline" size={20}
                    color={customName.trim().length >= 2 ? BG_COLORS.accent : 'rgba(255,255,255,0.30)'} />
                  <TextInput
                    style={{ flex: 1, fontSize: 17, color: '#fff', paddingVertical: 16, fontWeight: '700' }}
                    placeholder={t('picker.customNamePlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.22)"
                    value={customName}
                    onChangeText={setCustomName}
                    autoFocus
                  />
                </View>
              </View>

              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.8, textTransform: 'uppercase' }}>
                  {t('picker.customMusclesLabel')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {MUSCLE_GROUP_OPTIONS.map((m) => {
                    const isSel = customMuscles.includes(m.id);
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => toggleMuscle(m.id)}
                        style={{
                          paddingHorizontal: 16, paddingVertical: 11, borderRadius: 14,
                          backgroundColor: isSel ? `${BG_COLORS.accent}20` : 'rgba(255,255,255,0.05)',
                          borderWidth: 1.5,
                          borderColor: isSel ? `${BG_COLORS.accent}80` : 'rgba(255,255,255,0.09)',
                          flexDirection: 'row', alignItems: 'center', gap: 8,
                          shadowColor: isSel ? BG_COLORS.accent : 'transparent',
                          shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
                        }}
                      >
                        {isSel && <Ionicons name="checkmark" size={14} color={BG_COLORS.accent} />}
                        <Text style={{ fontSize: 14, fontWeight: '800', color: isSel ? BG_COLORS.accent : 'rgba(255,255,255,0.50)' }}>
                          {m.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                onPress={handleSaveCustom}
                disabled={customName.trim().length < 2 || customMuscles.length === 0}
                style={({ pressed }) => ({
                  borderRadius: 20, marginTop: 8,
                  opacity: customName.trim().length < 2 || customMuscles.length === 0 ? 0.35 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  shadowColor: BG_COLORS.accent, shadowOpacity: 0.50, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
                  elevation: 12,
                })}
              >
                <LinearGradient
                  colors={[BG_COLORS.accent, '#0ea5e9'] as [string, string]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 20, paddingVertical: 20,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1 }}>
                    {t('picker.createBtn')}
                  </Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>

          ) : selectedGroup ? (
            /* ══ LISTE EXERCICES ══ */
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
              {/* Container glassmorphism */}
              <View style={{
                borderRadius: 22, overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: `${selectedGroup.color}30`,
                backgroundColor: 'rgba(12,12,22,0.85)',
                shadowColor: selectedGroup.color,
                shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
                elevation: 10,
              }}>
                {selectedGroup.exercises.map((ex, i) => (
                  <React.Fragment key={`${ex.name}-${i}`}>
                    <ExerciseCard_Picker
                      ex={ex}
                      group={selectedGroup}
                      onPress={() => handlePick(ex)}
                    />
                    {i < selectedGroup.exercises.length - 1 && (
                      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 68 }} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </ScrollView>

          ) : (
            /* ══ GRILLE GROUPES + RECHERCHE ══ */
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
              {searching ? (
                /* Résultats de recherche */
                <View>
                  {searchResults.length === 0 ? (
                    <View style={{
                      alignItems: 'center', paddingVertical: 56, gap: 16,
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
                    }}>
                      <Ionicons name="search" size={44} color="rgba(255,255,255,0.15)" />
                      <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', fontWeight: '700' }}>
                        {t('picker.noResults')}
                      </Text>
                    </View>
                  ) : (
                    <View style={{
                      borderRadius: 22, overflow: 'hidden',
                      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.09)',
                      backgroundColor: 'rgba(12,12,22,0.85)',
                    }}>
                      {searchResults.map(({ ex, group }, i) => (
                        <React.Fragment key={`${ex.name}-${i}`}>
                          <ExerciseCard_Picker ex={ex} group={group} onPress={() => handlePick(ex)} />
                          {i < searchResults.length - 1 && (
                            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 68 }} />
                          )}
                        </React.Fragment>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                /* ── Grille groupes musculaires premium ── */
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {EXERCISE_GROUPS.map((group) => (
                      <Pressable
                        key={group.id}
                        onPress={() => setSelectedGroup(group)}
                        style={({ pressed }) => ({
                          width: '47.5%',
                          borderRadius: 22,
                          overflow: 'hidden',
                          borderWidth: 1.5,
                          borderColor: pressed ? group.color : `${group.color}45`,
                          transform: [{ scale: pressed ? 0.95 : 1 }],
                          shadowColor: group.color,
                          shadowOpacity: pressed ? 0.55 : 0.20,
                          shadowRadius: pressed ? 22 : 14,
                          shadowOffset: { width: 0, height: 6 },
                          elevation: 10,
                        })}
                      >
                        <LinearGradient
                          colors={[`${group.color}28`, `${group.color}08`, '#0a0a15'] as [string, string, string]}
                          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                          style={{ paddingTop: 24, paddingBottom: 20, paddingHorizontal: 16, alignItems: 'center', gap: 14 }}
                        >
                          {/* Icône avec glow */}
                          <View style={{
                            width: 62, height: 62, borderRadius: 20,
                            backgroundColor: `${group.color}20`,
                            borderWidth: 1.5, borderColor: `${group.color}55`,
                            alignItems: 'center', justifyContent: 'center',
                            shadowColor: group.color, shadowOpacity: 0.60,
                            shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
                            elevation: 8,
                          }}>
                            <Ionicons name={group.icon as keyof typeof Ionicons.glyphMap} size={28} color={group.color} />
                          </View>

                          {/* Texte */}
                          <View style={{ alignItems: 'center', gap: 5 }}>
                            <Text style={{
                              fontSize: 13, fontWeight: '900', color: '#fff',
                              letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center',
                            }}>
                              {group.label}
                            </Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.40)', textAlign: 'center' }}>
                              {group.exercises.length} exercices
                            </Text>
                          </View>
                        </LinearGradient>
                      </Pressable>
                    ))}
                  </View>

                  {/* CTA exercice perso */}
                  <Pressable
                    onPress={() => setCustomMode(true)}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', gap: 16,
                      paddingVertical: 20, paddingHorizontal: 20, marginTop: 4,
                      borderRadius: 22, borderWidth: 1.5, borderStyle: 'dashed',
                      borderColor: pressed ? BG_COLORS.accent : `${BG_COLORS.accent}50`,
                      backgroundColor: pressed ? 'rgba(56,189,248,0.08)' : 'transparent',
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                  >
                    <View style={{
                      width: 50, height: 50, borderRadius: 16,
                      backgroundColor: 'rgba(56,189,248,0.12)',
                      borderWidth: 1.5, borderColor: `${BG_COLORS.accent}45`,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons name="add" size={24} color={BG_COLORS.accent} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: BG_COLORS.accent, letterSpacing: -0.2 }}>
                        {t('picker.customCta')}
                      </Text>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', fontWeight: '600' }}>
                        {t('picker.customCtaSub')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.28)" />
                  </Pressable>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ── Écran principal ─────────────────────────────────────────────────
export default function SessionScreen() {
  const bottomPad = useBottomNavPadding();
  const {
    activeSession, startSession, addExercise,
    finishSession, discardSession, startRestTimer, stopRestTimer,
  } = useSessionStore();

  const { addWorkout, getLastWorkoutForExercise } = useWorkoutStore();
  const { profile } = useProfileStore();
  const showCelebration = useCelebrationStore((s) => s.show);
  const workouts = useWorkoutStore((s) => s.workouts);
  const defaultRestTime = useSettingsStore((s) => s.settings.defaultRestTime);
  const t = useT();

  const QUICK_STARTS = WORKOUT_MODES.map((m) => ({
    ...m,
    title:    t(`session.type.${m.type}.title` as any),
    subtitle: t(`session.type.${m.type}.subtitle` as any),
    hint:     t(`session.type.${m.type}.hint` as any),
  }));

  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const persistedMode = useSettingsStore((s) => s.settings.trainingMode);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [selectedType, _setSelectedType] = useState<WorkoutType>(persistedMode ?? 'hypertrophy');
  const setSelectedType = useCallback((t: WorkoutType) => {
    _setSelectedType(t);
    updateSettings({ trainingMode: t });
  }, [updateSettings]);
  // Si le mode persisté n'est plus dans TRAINING_MODES (ex. ancien 'power'/'ppl' retirés), fallback
  useEffect(() => {
    if (!TRAINING_MODES.some((m) => m.type === selectedType)) {
      setSelectedType('hypertrophy');
    }
  }, [selectedType, setSelectedType]);
  const [feeling, setFeeling] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [focusedExerciseId, setFocusedExerciseId] = useState<string | null>(null);

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleStart = useCallback((name: string, type: WorkoutType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
    startSession(name || 'Séance', type);
  }, [startSession]);

  const handleAddExercise = useCallback((exercise: Omit<ActiveExercise, 'isExpanded'>) => {
    const lastWorkout = getLastWorkoutForExercise(exercise.name);
    const lastExercise = lastWorkout?.exercises.find(
      (e) => e.name.toLowerCase() === exercise.name.toLowerCase(),
    );
    const sets: WorkoutSet[] = lastExercise?.sets.length
      ? lastExercise.sets.map((s) => ({
          weight: s.weight, reps: s.reps, setType: s.setType,
          restTime: defaultRestTime, completed: false,
        }))
      : [{ weight: 0, reps: 8, setType: 'normal' as const, restTime: defaultRestTime, completed: false }];
    addExercise({ ...exercise, sets, isExpanded: true });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
  }, [addExercise, getLastWorkoutForExercise, defaultRestTime]);

  const handleFinish = async () => {
    const workout = finishSession();
    if (!workout) return;
    const finalWorkout = { ...workout, feeling, name: workoutName || 'Séance' };
    await addWorkout(finalWorkout);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    setShowFinishModal(false);

    // Détection PR — compare chaque exercice avec les PRs du profil
    const currentPRs = profile?.prs ?? [];
    for (const exercise of workout.exercises) {
      if (exercise.sets.length === 0) continue;
      const best1RM = Math.max(...exercise.sets.map((s) => calculate1RM(s.weight, s.reps)));
      const existing = currentPRs.find((pr) => pr.exercise === exercise.name);
      if (best1RM > (existing?.oneRepMax ?? 0) + 0.5) {
        showCelebration({
          type: 'pr',
          title: t('dashboard.prTitle'),
          subtitle: t('dashboard.prSubtitle', { exercise: exercise.name }),
          exercise: exercise.name,
          prevValue: existing?.oneRepMax ?? 0,
          newValue: best1RM,
        });
        break; // Une seule célébration par séance
      }
    }
  };

  const handleDiscard = () => {
    Alert.alert(t('session.discardTitle'), t('session.discardMessage'), [
      { text: t('session.discardCancel'), style: 'cancel' },
      { text: t('session.discardConfirm'), style: 'destructive', onPress: () => discardSession() },
    ]);
  };

  // ── PAS DE SÉANCE ACTIVE ─────────────────────────────────────────
  if (!activeSession) {
    const mode = TRAINING_MODES.find((m) => m.type === selectedType) ?? TRAINING_MODES[0]!;
    const recent = workouts.slice(0, 3);

    return (
      <View style={{ flex: 1, backgroundColor: HUD_BG }}>
        {/* Background PNG plein écran, derrière tout le contenu */}
        <Image
          source={SESSION_BG}
          resizeMode="cover"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 12 }}
              showsVerticalScrollIndicator={false}
            >
              {/* ═══ HEADER ═══ */}
              <View style={{ paddingTop: 4, paddingBottom: 6 }}>
                {/* Ligne 1 : SÉANCE (profondeur + glow) + bouton cloche octogonal */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  {/* Titre SÉANCE — Skia gradient + glow externe */}
                  <SeanceTitle />

                  {/* Bouton cloche OCTOGONAL */}
                  <OctagonalBellButton
                    onPress={() => Haptics.selectionAsync().catch(() => null)}
                  />
                </View>
              </View>

              {/* ═══ (1) CHOISIS TON MODE D'ENTRAÎNEMENT ═══ */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <StepBadge n={1} />
                <Text style={{
                  marginHorizontal: 10,
                  color: HUD_CYAN,
                  fontSize: 18, fontWeight: '900',
                  textShadowColor: '#00B4F0',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 4,
                }}>·</Text>
                <Text style={{
                  fontSize: 12, fontWeight: '800',
                  color: '#FFFFFF',
                  letterSpacing: 0.8, textTransform: 'uppercase',
                  flexShrink: 1,
                }}>
                  CHOISIS TON MODE D'ENTRAÎNEMENT
                </Text>
              </View>

              {/* ═══ SÉLECTEUR DE MODE — cartes larges (chevrons décoratifs supprimés
                  pour laisser plus d'espace aux cartes) ═══ */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                marginBottom: 6,
                paddingVertical: 14, // = hauteur des indicateurs ▼▲ qui dépassent (jamais clippé)
                gap: SK_MODE_GAP,    // ← gap FIXE entre cartes
              }}>
                {TRAINING_MODES.map((m) => {
                  const active = selectedType === m.type;
                  return (
                    <View
                      key={m.type}
                      style={{
                        position: 'relative',
                        // width/height EXPLICITES → wrappers strictement identiques (pas de variation au pixel)
                        width: SK_MODE_CARD_W,
                        height: SK_MODE_CARD_H,
                        overflow: 'visible', // glow Canvas + indicateurs ▼▲ qui dépassent
                      }}
                    >
                      {active && <ModeIndicator direction="down" />}
                      <OctagonalModeCard
                        mode={m}
                        active={active}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => null);
                          setSelectedType(m.type);
                        }}
                      />
                      {active && <ModeIndicator direction="up" />}
                    </View>
                  );
                })}
              </View>

              {/* ═══ BARRE INFO MODE (Skia HUD bevel + accents) ═══ */}
              <ModeInfoBar text={mode.info} />

              {/* ═══ CARTE SÉANCE DU JOUR — composant partagé avec IA Coach ═══ */}
              {/* zIndex + pointerEvents="box-none" (dans le composant) → la frame
                  est au-dessus de la carte SÉANCE LIBRE (rendue ensuite avec
                  marginTop: -80) pour la capture des touches, mais les zones
                  décoratives laissent passer les clics qui ne touchent pas le
                  bouton DÉMARRER LA SÉANCE. */}
              <DailySessionCard
                style={{
                  // Asymétrique : décalée encore plus à gauche par rapport au centre
                  // (marge gauche négative + marge droite plus grande).
                  marginLeft: -8,
                  marginRight: 26,
                  marginTop: -50,
                  marginBottom: 20,
                }}
              />

              {/* ═══ SÉPARATEUR "ou" — juste sous SÉANCE DU JOUR ═══ */}
              <Text style={{
                textAlign: 'center', color: 'rgba(255,255,255,0.40)',
                fontStyle: 'italic', fontSize: 14,
                marginTop: -16,
                marginBottom: 6,
              }}>
                ou
              </Text>

              {/* ═══ CARTE SÉANCE LIBRE — bannière fortement remontée ═══ */}
              {/* Wrapper View qui porte les marges — Pressable seul ignore parfois
                  marginTop/transform via sa fonction style (voir le bouton
                  "DÉMARRER LA SÉANCE" ci-dessus pour le même pattern). */}
              <View
                style={{
                  marginTop: -80,
                  marginHorizontal: -10,
                  marginBottom: -80,
                }}
              >
                <Pressable
                  onPress={() => handleStart('Séance', selectedType)}
                  style={({ pressed }) => ({
                    flexDirection: 'column', alignItems: 'stretch',
                    paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  {/* Bannière encadrement avec texte SÉANCE LIBRE superposé */}
                  <View style={{ width: 410, height: 246, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                      source={require('@/assets/images/session-free.png')}
                      resizeMode="contain"
                      style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        width: '100%',
                        height: '100%',
                      }}
                    />
                    <Text style={{
                      fontSize: 18, fontWeight: '900', color: '#FFFFFF',
                      letterSpacing: 1.6, textTransform: 'uppercase',
                      textShadowColor: 'rgba(0,0,0,0.85)',
                      textShadowRadius: 6,
                      textShadowOffset: { width: 0, height: 1 },
                      marginTop: -8,
                    }}>
                      SÉANCE LIBRE
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* ═══ SÉANCES RÉCENTES — en bas, sous SÉANCE LIBRE ═══ */}
              {/* paddingHorizontal réduit + marginHorizontal négatif → la carte
                  est nettement plus large que la version home. */}
              {recent.length > 0 && (
                <View style={{ paddingHorizontal: 0, marginHorizontal: -10, marginTop: 4 }}>
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
                      {recent.map((w, i, arr) => (
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

  // ── SÉANCE ACTIVE — Dashboard VARIANTE C ─────────────────────────
  const focusedExercise = focusedExerciseId
    ? activeSession.exercises.find((e) => e.id === focusedExerciseId) ?? null
    : null;

  return (
    <>
      {focusedExercise ? (
        <ExerciseCard
          exercise={focusedExercise}
          lastWorkout={getLastWorkoutForExercise(focusedExercise.name)}
          onStartRest={(s) => startRestTimer(s)}
          onBack={() => setFocusedExerciseId(null)}
          bottomPad={bottomPad}
        />
      ) : (
        <SessionDashboard
          activeSession={activeSession}
          bottomPad={bottomPad}
          onPressExercise={(id) => setFocusedExerciseId(id)}
          onAddExercise={() => setShowExercisePicker(true)}
          onFinishSession={() => setShowFinishModal(true)}
          onDiscard={handleDiscard}
        />
      )}

      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} pointerEvents="box-none">
        {/* Rest timer */}
        {activeSession.isResting && activeSession.restSecondsLeft !== null && (() => {
          const ex = focusedExercise;
          const lastIdx = activeSession.lastCompletedSetIndex;
          const lastSet = ex && lastIdx !== null ? ex.sets[lastIdx] : null;
          return (
            <RestTimer
              secondsLeft={activeSession.restSecondsLeft}
              totalSeconds={defaultRestTime}
              isVisible={activeSession.isResting}
              onSkip={stopRestTimer}
              onAddTime={(s) =>
                useSessionStore.getState().startRestTimer(
                  Math.max(1, (activeSession.restSecondsLeft ?? 0) + s),
                )
              }
              exerciseName={ex?.name}
              setNumber={lastIdx !== null ? lastIdx + 1 : undefined}
              setsTotal={ex?.sets.length}
              lastWeight={lastSet?.weight}
              lastReps={lastSet?.reps}
            />
          );
        })()}

        <ExercisePicker
          visible={showExercisePicker}
          onSelect={handleAddExercise}
          onClose={() => setShowExercisePicker(false)}
        />

        {/* Modal terminer */}
        <Modal visible={showFinishModal} animationType="slide" presentationStyle="pageSheet">
          <View style={{ flex: 1, backgroundColor: BG_COLORS.base }}>
            <ScreenBackground variant="session" topHalo={false} />

            <SafeAreaView style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 32, gap: 24 }}>
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1.2 }}>
                  {t('session.finishTitle')}
                </Text>

                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 2, textTransform: 'uppercase' }}>
                    {t('session.sessionName')}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                      paddingHorizontal: 16, paddingVertical: 14,
                      fontSize: 16, fontWeight: '700', color: '#fff',
                    }}
                    value={workoutName || 'Séance'}
                    onChangeText={setWorkoutName}
                    placeholderTextColor="rgba(255,255,255,0.30)"
                  />
                </View>

                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 2, textTransform: 'uppercase' }}>
                    {t('session.howFeel')}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {([1, 2, 3, 4, 5] as const).map((f) => (
                      <Pressable
                        key={f}
                        onPress={() => setFeeling(f)}
                        style={{
                          flex: 1, paddingVertical: 14, borderRadius: 14,
                          alignItems: 'center',
                          backgroundColor: feeling === f ? `${BG_COLORS.accent}22` : 'rgba(255,255,255,0.05)',
                          borderWidth: 1.5,
                          borderColor: feeling === f ? BG_COLORS.accent : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <Ionicons
                          name={f === 1 ? 'sad-outline' : f === 2 ? 'remove-circle-outline' : f === 3 ? 'ellipse-outline' : f === 4 ? 'happy-outline' : 'flame-outline'}
                          size={22}
                          color={feeling === f ? BG_COLORS.accent : 'rgba(255,255,255,0.40)'}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[
                    { label: t('session.duration'), value: `${Math.floor(activeSession.elapsedSeconds / 60)} ${t('unit.min')}` },
                    { label: t('session.exercises'), value: String(activeSession.exercises.length) },
                    { label: t('session.sets'), value: `${activeSession.exercises.reduce((t, e) => t + e.sets.filter((s) => s.completed).length, 0)}/${activeSession.exercises.reduce((t, e) => t + e.sets.length, 0)}` },
                  ].map((s) => (
                    <View key={s.label} style={{
                      flex: 1,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderRadius: 14, padding: 14, gap: 4,
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.40)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                        {s.label}
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.4 }}>
                        {s.value}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={{ gap: 10, marginTop: 4 }}>
                  <Pressable
                    onPress={handleFinish}
                    style={({ pressed }) => ({
                      borderRadius: 18, overflow: 'hidden',
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      shadowColor: BG_COLORS.accent,
                      shadowOpacity: 0.50, shadowRadius: 22, shadowOffset: { width: 0, height: 10 },
                      elevation: 10,
                    })}
                  >
                    <View style={{
                      backgroundColor: BG_COLORS.accent, borderRadius: 18, paddingVertical: 18,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                    }}>
                      <Ionicons name="checkmark-circle" size={18} color="#07090f" />
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#07090f', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                        {t('session.saveSession')}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable onPress={() => setShowFinishModal(false)} style={{ paddingVertical: 14, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: '700' }}>
                      {t('session.continueSession')}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}
