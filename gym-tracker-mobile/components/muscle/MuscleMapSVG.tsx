/**
 * MANNEQUIN MUSCULAIRE — premium muscle energy glow
 *
 * Système de chaleur interne en 3 couches :
 *   1. Ambient tint   — teinture douce sur tout le muscle (très low opacity)
 *   2. Radial glow    — gradient bilatéral (pec gauche + pec droit) flou natif
 *   3. Core heat      — point chaud central, très brillant, petit rayon
 *
 * Pas de flat fill. Pas de couleur solide. La texture du mannequin reste visible
 * à travers toutes les couches (opacity totale jamais > ~50 % au maximum).
 *
 * Position Vector 1 dans l'espace 341×511 :
 *   Figma canvas : x=-561.5 y=-83 w=84.5 h=36.5
 *   PEC_TY = -83 − (-180) = 97   (exact, frame y=-180)
 *   PEC_TX = centré sur 341px  → 128.25
 */

import React from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import Svg, {
  Path, G, Defs,
  RadialGradient, Stop,
  ClipPath, Rect,
  Filter, FeGaussianBlur,
} from 'react-native-svg';
import { useMuscleLabels } from '@/lib/i18n';
import type { MuscleGroup } from '@/types';

// ── Mannequin gris 1024×1536 → affiché en 341×511 ─────────────
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FRONT_PNG = require('@/assets/images/man_gris_front.png') as number;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BACK_PNG  = require('@/assets/images/man_gris_back.png') as number;

const SVG_W = 341;
const SVG_H = 511;
const FRONT_RECT = { x: 0, y: 0, w: 341, h: 511 };
const BACK_RECT  = { x: 0, y: 0, w: 341, h: 511 };

// ── Vector 1 — path des pecs (viewBox 0 0 86 38) ─────────────
const PEC_PATH =
  'M1.55762 19.5L1.43262 20M1.43262 20L1.05762 21.5L1.55762 23.5' +
  'L3.05762 27L6.05762 30L9.05762 32L12.0576 33.5L14.0576 35' +
  'L17.5576 35.5L21.5576 36L28.0576 35.5L31.0576 35L35.0576 34' +
  'L38.5576 33.5L39.5576 33L41.5576 30V28.5L42.0576 27' +
  'L42.5576 29.5L43.5576 31L45.0576 32.5L45.5576 33.5L48.0576 34.5' +
  'L50.5576 34L53.5576 35.5H57.5576L61.5576 36.5L65.5576 37' +
  'L70.0576 35.5L73.0576 34.5L77.0576 32.5L79.0576 31' +
  'L81.5576 28.5L83.0576 26.5L84.5576 23L85.0576 20L84.5576 17.5' +
  'L81.5576 14L77.5576 10.5L73.0576 7L68.0576 4L62.0576 2.5' +
  'L54.5576 2L51.5576 1.5L49.0576 2.5L46.0576 4L43.5576 6' +
  'L42.0576 6.5L38.5576 3.5L35.0576 2L30.5576 1L26.5576 0.5' +
  'H19.5576H16.5576L14.5576 2.5L13.0576 4V5L10.5576 6.5' +
  'L9.05762 8.5L6.55762 10.5L3.05762 14L0.557617 17.5L1.43262 20Z';

// Position dans l'espace SVG 341×511
const PEC_TX = 128.25;
const PEC_TY = 97;
const PEC_SX = 84.5 / 86;   // ≈ 0.9826
const PEC_SY = 36.5 / 38;   // ≈ 0.9605

// Centres de chaleur dans l'espace SVG (un par lobe pectoral)
// Left pec : milieu du lobe gauche ≈ x=21, y=20 dans viewBox 86×38
const PEC_L_CX = PEC_TX + 21 * PEC_SX;   // ≈ 148.8
const PEC_L_CY = PEC_TY + 20 * PEC_SY;   // ≈ 116.2
// Right pec : milieu du lobe droit ≈ x=64, y=20
const PEC_R_CX = PEC_TX + 64 * PEC_SX;   // ≈ 191.1
const PEC_R_CY = PEC_TY + 20 * PEC_SY;   // ≈ 116.2

// Rayon des gradients (en unités SVG)
const PEC_GLOW_R = 26;   // halo externe par lobe
const PEC_CORE_R = 11;   // noyau chaud par lobe

// Bounding-box de la zone pec + marge pour le glow
const PEC_BB = {
  x: PEC_TX - 14,
  y: PEC_TY - 14,
  w: 84.5 + 28,
  h: 36.5 + 28,
};

// ── Paramètres de glow selon intensité ────────────────────────

interface GlowParams {
  base:        string;   // couleur principale
  core:        string;   // couleur du noyau (plus claire)
  ambient:     number;   // opacité du tint ambiant (path direct)
  glowOuter:   number;   // opacité centre du halo externe
  glowMid:     number;   // opacité milieu du halo (stop intermédiaire)
  coreOpacity: number;   // opacité centre du noyau
}

function getGlowParams(intensity: number): GlowParams | null {
  if (intensity <= 0) return null;
  const t = Math.max(1, Math.min(100, intensity)) / 100;

  // Transitions de couleur aux seuils 35 % et 70 %
  let base: string, core: string;
  if (intensity <= 35) {
    base = '#FFD54A';   // jaune chaud
    core = '#FFE990';
  } else if (intensity <= 70) {
    base = '#FF8C32';   // orange énergétique
    core = '#FFAA60';
  } else {
    base = '#FF453A';   // rouge profond
    core = '#FF7A50';
  }

  return {
    base,
    core,
    ambient:     0.10 + t * 0.22,          // 0.10 → 0.32
    glowOuter:   0.32 + t * 0.48,          // 0.32 → 0.80
    glowMid:     0.14 + t * 0.26,          // 0.14 → 0.40
    coreOpacity: 0.28 + t * 0.46,          // 0.28 → 0.74
  };
}

// ── Taille d'affichage ────────────────────────────────────────

const SIZE_MAP = { sm: 150, md: 200, lg: 260 } as const;

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

interface MuscleMapSVGProps {
  activity?: Partial<Record<MuscleGroup, number>>;
  selected?: MuscleGroup | null;
  onMusclePress?: (muscle: MuscleGroup) => void;
  size?: 'sm' | 'md' | 'lg';
  showBoth?: boolean;
  showLegend?: boolean;
  view?: 'front' | 'back';
}

export function MuscleMapSVG({
  activity = {},
  selected  = null,
  onMusclePress,
  size      = 'md',
  showBoth  = true,
  showLegend = false,
  view,
}: MuscleMapSVGProps) {
  const displayW = SIZE_MAP[size];
  const displayH = (displayW / SVG_W) * SVG_H;
  const imgScale = displayW / SVG_W;

  const chestVal  = activity['chest'] ?? 0;
  const chestSel  = selected === 'chest';
  const glow      = getGlowParams(chestVal);

  // Tap sur la zone pec (front seulement)
  const handleFrontPress = (e: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (!onMusclePress) return;
    const sx = (e.nativeEvent.locationX / displayW) * SVG_W;
    const sy = (e.nativeEvent.locationY / displayH) * SVG_H;
    if (sx >= PEC_TX && sx <= PEC_TX + 84.5 && sy >= PEC_TY && sy <= PEC_TY + 36.5) {
      onMusclePress('chest');
    }
  };

  // ── Rendu face avant ────────────────────────────────────────

  const renderFront = () => {
    const rect = FRONT_RECT;
    return (
      <Pressable
        onPress={handleFrontPress}
        style={{
          width: displayW, height: displayH,
          overflow: 'hidden',
          borderRadius: 14,
        }}
      >
        {/* Mannequin gris */}
        <Image
          source={FRONT_PNG}
          style={{
            position: 'absolute',
            width:  rect.w * imgScale,
            height: rect.h * imgScale,
            left:   rect.x * imgScale,
            top:    rect.y * imgScale,
          }}
          resizeMode="stretch"
        />

        {/* Overlay SVG — glow pecs */}
        {(glow !== null || chestSel) && (
          <Svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            width={displayW}
            height={displayH}
            style={{ position: 'absolute' }}
          >
            <Defs>
              {/* Clip path : restreint tout à la forme du Vector 1 */}
              <ClipPath id="pec-clip">
                <Path
                  d={PEC_PATH}
                  transform={`translate(${PEC_TX},${PEC_TY}) scale(${PEC_SX.toFixed(5)},${PEC_SY.toFixed(5)})`}
                />
              </ClipPath>

              {/* Filtre de diffusion douce sur le halo externe */}
              <Filter id="pec-blur" x="-40%" y="-40%" width="180%" height="180%">
                <FeGaussianBlur stdDeviation={2} />
              </Filter>

              {/* ── Halo externe — lobe gauche ── */}
              <RadialGradient
                id="gl-glow"
                cx={PEC_L_CX} cy={PEC_L_CY} r={PEC_GLOW_R}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%"   stopColor={glow?.base ?? '#FFD54A'} stopOpacity={glow?.glowOuter ?? 0} />
                <Stop offset="35%"  stopColor={glow?.base ?? '#FFD54A'} stopOpacity={glow?.glowMid   ?? 0} />
                <Stop offset="70%"  stopColor={glow?.base ?? '#FFD54A'} stopOpacity={(glow?.glowMid ?? 0) * 0.3} />
                <Stop offset="100%" stopColor={glow?.base ?? '#FFD54A'} stopOpacity={0} />
              </RadialGradient>

              {/* ── Halo externe — lobe droit ── */}
              <RadialGradient
                id="gr-glow"
                cx={PEC_R_CX} cy={PEC_R_CY} r={PEC_GLOW_R}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%"   stopColor={glow?.base ?? '#FFD54A'} stopOpacity={glow?.glowOuter ?? 0} />
                <Stop offset="35%"  stopColor={glow?.base ?? '#FFD54A'} stopOpacity={glow?.glowMid   ?? 0} />
                <Stop offset="70%"  stopColor={glow?.base ?? '#FFD54A'} stopOpacity={(glow?.glowMid ?? 0) * 0.3} />
                <Stop offset="100%" stopColor={glow?.base ?? '#FFD54A'} stopOpacity={0} />
              </RadialGradient>

              {/* ── Noyau chaud — lobe gauche ── */}
              <RadialGradient
                id="gl-core"
                cx={PEC_L_CX} cy={PEC_L_CY} r={PEC_CORE_R}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%"   stopColor={glow?.core ?? '#FFE990'} stopOpacity={glow?.coreOpacity ?? 0} />
                <Stop offset="50%"  stopColor={glow?.core ?? '#FFE990'} stopOpacity={(glow?.coreOpacity ?? 0) * 0.45} />
                <Stop offset="100%" stopColor={glow?.core ?? '#FFE990'} stopOpacity={0} />
              </RadialGradient>

              {/* ── Noyau chaud — lobe droit ── */}
              <RadialGradient
                id="gr-core"
                cx={PEC_R_CX} cy={PEC_R_CY} r={PEC_CORE_R}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%"   stopColor={glow?.core ?? '#FFE990'} stopOpacity={glow?.coreOpacity ?? 0} />
                <Stop offset="50%"  stopColor={glow?.core ?? '#FFE990'} stopOpacity={(glow?.coreOpacity ?? 0) * 0.45} />
                <Stop offset="100%" stopColor={glow?.core ?? '#FFE990'} stopOpacity={0} />
              </RadialGradient>

              {/* ── Sélection — halo gauche ── */}
              <RadialGradient
                id="gl-sel"
                cx={PEC_L_CX} cy={PEC_L_CY} r={PEC_GLOW_R}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%"   stopColor="#c4b5fd" stopOpacity={chestSel ? 0.55 : 0} />
                <Stop offset="40%"  stopColor="#a78bfa" stopOpacity={chestSel ? 0.22 : 0} />
                <Stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
              </RadialGradient>

              {/* ── Sélection — halo droit ── */}
              <RadialGradient
                id="gr-sel"
                cx={PEC_R_CX} cy={PEC_R_CY} r={PEC_GLOW_R}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%"   stopColor="#c4b5fd" stopOpacity={chestSel ? 0.55 : 0} />
                <Stop offset="40%"  stopColor="#a78bfa" stopOpacity={chestSel ? 0.22 : 0} />
                <Stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
              </RadialGradient>
            </Defs>

            {/* ══ COUCHE 1 — Teinture ambiante ══════════════════
                Définit subtilement la limite du muscle.
                Très basse opacité → texture mannequin visible. */}
            {glow !== null && chestVal > 0 && (
              <G transform={`translate(${PEC_TX},${PEC_TY}) scale(${PEC_SX.toFixed(5)},${PEC_SY.toFixed(5)})`}>
                <Path d={PEC_PATH} fill={glow.base} fillOpacity={glow.ambient} />
              </G>
            )}

            {/* ══ COUCHE 2 — Halo radial diffus ═════════════════
                Gradient bilatéral flou via feGaussianBlur.
                Simule la chaleur qui rayonne de l'intérieur. */}
            {glow !== null && chestVal > 0 && (
              <G clipPath="url(#pec-clip)" filter="url(#pec-blur)">
                <Rect
                  x={PEC_BB.x} y={PEC_BB.y}
                  width={PEC_BB.w} height={PEC_BB.h}
                  fill="url(#gl-glow)"
                />
                <Rect
                  x={PEC_BB.x} y={PEC_BB.y}
                  width={PEC_BB.w} height={PEC_BB.h}
                  fill="url(#gr-glow)"
                />
              </G>
            )}

            {/* ══ COUCHE 3 — Noyau chaud ════════════════════════
                Point de chaleur intense au centre de chaque lobe.
                Pas de flou → contraste net qui simule l'épicentre. */}
            {glow !== null && chestVal > 0 && (
              <G clipPath="url(#pec-clip)">
                <Rect
                  x={PEC_BB.x} y={PEC_BB.y}
                  width={PEC_BB.w} height={PEC_BB.h}
                  fill="url(#gl-core)"
                />
                <Rect
                  x={PEC_BB.x} y={PEC_BB.y}
                  width={PEC_BB.w} height={PEC_BB.h}
                  fill="url(#gr-core)"
                />
              </G>
            )}

            {/* ══ État sélectionné — glow violet doux ════════ */}
            {chestSel && (
              <>
                <G transform={`translate(${PEC_TX},${PEC_TY}) scale(${PEC_SX.toFixed(5)},${PEC_SY.toFixed(5)})`}>
                  <Path d={PEC_PATH} fill="#a78bfa" fillOpacity={0.12} />
                </G>
                <G clipPath="url(#pec-clip)" filter="url(#pec-blur)">
                  <Rect x={PEC_BB.x} y={PEC_BB.y} width={PEC_BB.w} height={PEC_BB.h} fill="url(#gl-sel)" />
                  <Rect x={PEC_BB.x} y={PEC_BB.y} width={PEC_BB.w} height={PEC_BB.h} fill="url(#gr-sel)" />
                </G>
              </>
            )}
          </Svg>
        )}
      </Pressable>
    );
  };

  // ── Rendu face arrière (pas d'overlay) ──────────────────────

  const renderBack = () => {
    const rect = BACK_RECT;
    return (
      <View style={{
        width: displayW, height: displayH,
        overflow: 'hidden',
        borderRadius: 14,
      }}>
        <Image
          source={BACK_PNG}
          style={{
            position: 'absolute',
            width:  rect.w * imgScale,
            height: rect.h * imgScale,
            left:   rect.x * imgScale,
            top:    rect.y * imgScale,
          }}
          resizeMode="stretch"
        />
      </View>
    );
  };

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      {view
        ? (view === 'front' ? renderFront() : renderBack())
        : (
          <View style={{ flexDirection: 'row', gap: 12, paddingLeft: 8 }}>
            {renderFront()}
            {showBoth && renderBack()}
          </View>
        )
      }
      {showLegend && <MuscleHeatLegend />}
    </View>
  );
}

// ── Légende ──────────────────────────────────────────────────

function glowColorStr(intensity: number): string {
  if (intensity <= 0)  return 'rgba(200,200,200,0.3)';
  if (intensity <= 35) return `rgba(255,213,74,${0.5 + intensity / 35 * 0.3})`;
  if (intensity <= 70) return `rgba(255,140,50,${0.6 + (intensity - 35) / 35 * 0.25})`;
  return `rgba(255,69,58,${0.7 + (intensity - 70) / 30 * 0.2})`;
}

function MuscleHeatLegend() {
  const stops = [
    { label: 'Aucun',  val: 0   },
    { label: 'Faible', val: 18  },
    { label: 'Moyen',  val: 52  },
    { label: 'Élevé',  val: 78  },
    { label: 'Max',    val: 100 },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
      {stops.map((s) => (
        <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: glowColorStr(s.val) }} />
          <Text style={{ fontSize: 11, color: 'rgba(248,250,252,0.45)' }}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Liste scrollable ──────────────────────────────────────────

interface MuscleHeatmapListProps {
  activity?: Partial<Record<MuscleGroup, number>>;
  onMusclePress?: (muscle: MuscleGroup) => void;
  selected?: MuscleGroup | null;
}

export function MuscleHeatmapList({
  activity = {},
  onMusclePress,
  selected,
}: MuscleHeatmapListProps) {
  const muscleLabels = useMuscleLabels();
  const muscles: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'calves'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
    >
      {muscles.map((muscle) => {
        const val        = activity[muscle] ?? 0;
        const color      = glowColorStr(val);
        const isSelected = selected === muscle;

        return (
          <Pressable
            key={muscle}
            onPress={() => onMusclePress?.(muscle)}
            style={{
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: isSelected ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
            }}
          >
            <View style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: color,
              borderWidth: 1.5,
              borderColor: isSelected ? '#7c3aed' : 'transparent',
            }} />
            <Text style={{ fontSize: 11, color: 'rgba(248,250,252,0.55)' }}>
              {muscleLabels[muscle]}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#f8fafc' }}>
              {val}%
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
