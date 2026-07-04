/**
 * HUD CARD — conteneur octogonal universel du design system.
 * Mappe directement les niveaux d'élévation lumineuse G0→G3
 * (DESIGN-GYMTRACK.md §A.5) :
 *   g0 dormant  — bordure hairline, aucun glow (listes, cartes inactives)
 *   g1 ambient  — bordure subtile + glow faible (cartes standard)
 *   g2 active   — bordure cyan pleine + glow net (élément sélectionné)
 *   g3 hero     — g2 + halo externe PULSANT (un seul par écran max)
 *
 * Tout le rendu passe par Skia (interdit : shadowOpacity / elevation).
 * La carte mesure son contenu via onLayout — pas de width/height requis.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import {
  Canvas,
  Path as SkPath,
  BlurMask,
  LinearGradient as SkLinearGradient,
  Rect as SkRect,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { hud, type HudGlowLevel } from '@/constants/theme';
import { octagonPath, notchedOctagonPath, cornerTickPaths } from './octagon';
import { ScanLines } from './effects/ScanLines';
import {
  type PremiumIntensity,
  type LightDirection,
  NoiseOverlay, NOISE_OPACITY,
  AsymmetricHalos, ASYM_OFFSET, LIGHT_HX,
  ColorVarHalo, COLORVAR_OPACITY,
  Vignette, VIGNETTE_DARKNESS,
  CornerLightLeaks, LEAK_OPACITY,
  EdgeBloom,
  SCANLINES_OPACITY,
  ChromaticAberration, CHROMA_SHIFT,
} from './effects/premiumLayers';

// Premium → marge de glow agrandie pour absorber les halos asymétriques.
const HALO_PAD = 36;
const HALO_PAD_PREMIUM = 56;

export type HudCardProps = {
  /** Niveau d'élévation lumineuse. */
  level?: HudGlowLevel;
  /** Taille de coupe des coins (hud.cut.sm/md/lg). */
  cut?: number;
  /** Encoches triangulaires haut/bas (cartes héros, cf. mode-card-active). */
  notched?: boolean;
  /** Ticks lumineux sur les 4 coins biseautés. */
  cornerTicks?: boolean;
  /** Ligne de scan qui traverse la carte toutes les 8s. */
  scanline?: boolean;
  /** Couleur de bordure custom (ex : rang, regen) — remplace le cyan. */
  borderColor?: string;
  /**
   * Dégradé de bordure (diagonal ↘) — rend l'encadrement NON-uniforme :
   * clair/intense d'un côté, bleu profond de l'autre, comme la maquette.
   * Prioritaire sur `borderColor`. Ex : ['#9BECFF', '#1DC4FF', '#0C63D6'].
   */
  borderGradient?: readonly string[];
  /** Positions des stops du dégradé (0→1), même longueur que borderGradient. */
  borderGradientPositions?: readonly number[];
  /** Couleur de glow custom. */
  glowColor?: string;
  /** Fond en dégradé vertical (cartes héros) au lieu du fond plat. */
  gradientFill?: boolean;
  /** Couches premium « painted » partagées (grain, halos, vignette…). Défaut false. */
  premium?: boolean;
  /** Intensité des couches premium. Défaut 'medium'. */
  premiumIntensity?: PremiumIntensity;
  /** Direction de la lumière simulée (halos asymétriques). Défaut 'top-left'. */
  lightDirection?: LightDirection;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function HudCard({
  level = 'g1',
  cut = hud.cut.md,
  notched = false,
  cornerTicks = false,
  scanline = false,
  borderColor,
  borderGradient,
  borderGradientPositions,
  glowColor,
  gradientFill = false,
  premium = false,
  premiumIntensity = 'medium',
  lightDirection = 'top-left',
  padding = 16,
  style,
  children,
}: HudCardProps) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const spec = hud.glowLevel[level];

  // Premium → marge agrandie pour absorber les halos asymétriques.
  const pad = premium ? HALO_PAD_PREMIUM : HALO_PAD;
  // Blur de base des halos premium (plancher pour éviter un halo net en g0/g1).
  const pOuterBlur = Math.max(spec.blur, 16);

  // ── G3 : pulse du halo (0.15 → 0.35, 2.8s, sinusoïdal) ───────────
  const pulse = useSharedValue(level === 'g3' ? 0.15 : 1);
  useEffect(() => {
    if (level === 'g3') {
      pulse.value = 0.15;
      pulse.value = withRepeat(
        withTiming(0.35, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 1;
    }
    return () => cancelAnimation(pulse);
  }, [level]);

  // ── Scanline : balayage vertical 1px toutes les 8s ───────────────
  const scanY = useSharedValue(0);
  useEffect(() => {
    if (!scanline || !size) return;
    scanY.value = 0;
    scanY.value = withRepeat(
      withSequence(
        withTiming(size.h, { duration: 2200, easing: Easing.linear }),
        withTiming(size.h, { duration: 5800 }), // pause hors-champ
      ),
      -1,
      false,
    );
    return () => cancelAnimation(scanY);
  }, [scanline, size?.h]);
  const scanRectY = useDerivedValue(() => pad + Math.min(scanY.value, size?.h ?? 0));
  const scanOpacity = useDerivedValue(() =>
    scanY.value >= (size?.h ?? 0) - 1 ? 0 : 0.06,
  );

  const paths = useMemo(() => {
    if (!size) return null;
    const { w, h } = size;
    const main = notched
      ? notchedOctagonPath(pad, pad, w, h, cut)
      : octagonPath(pad, pad, w, h, cut);
    const ticks = cornerTicks ? cornerTickPaths(pad, pad, w, h, cut) : [];
    return { main, ticks };
  }, [size?.w, size?.h, cut, notched, cornerTicks, pad]);

  const border = borderColor ?? spec.border;
  const glow = glowColor ?? spec.glowColor;
  const showGlow = spec.blur > 0;

  return (
    <View
      style={[{ position: 'relative' }, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) setSize({ w: width, h: height });
      }}
    >
      {size && paths && (
        <Canvas
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -pad,
            left: -pad,
            width: size.w + pad * 2,
            height: size.h + pad * 2,
          }}
        >
          {/* PREMIUM #2 — Multi-halo asymétrique (tout au fond) */}
          {premium && (
            <AsymmetricHalos
              path={paths.main}
              outerBlur={pOuterBlur}
              offset={ASYM_OFFSET[premiumIntensity]}
              hx={LIGHT_HX[lightDirection]}
            />
          )}

          {/* Halo (glow externe) */}
          {showGlow && (
            <SkPath path={paths.main} color={glow} style="fill" opacity={pulse}>
              <BlurMask blur={spec.blur} style="normal" />
            </SkPath>
          )}

          {/* PREMIUM #3 — Color variation (SweepGradient cyan sur le halo) */}
          {premium && (
            <ColorVarHalo
              path={paths.main}
              center={vec(pad + size.w / 2, pad + size.h / 2)}
              blur={pOuterBlur}
              opacity={COLORVAR_OPACITY[premiumIntensity]}
            />
          )}

          {/* Fond */}
          {gradientFill ? (
            <SkPath path={paths.main} style="fill">
              <SkLinearGradient
                start={vec(pad + size.w / 2, pad)}
                end={vec(pad + size.w / 2, pad + size.h)}
                colors={[hud.bg.surfaceElev, hud.bg.surface, hud.bg.surfaceDeep]}
                positions={[0, 0.5, 1]}
              />
            </SkPath>
          ) : (
            <SkPath path={paths.main} color={hud.bg.surface} style="fill" />
          )}

          {/* PREMIUM #4/#5 — Vignette interne + corner light leaks */}
          {premium && (
            <>
              <Vignette
                path={paths.main}
                center={vec(pad + size.w / 2, pad + size.h / 2)}
                radius={Math.min(size.w, size.h) * 0.6}
                darkness={VIGNETTE_DARKNESS[premiumIntensity]}
              />
              <CornerLightLeaks
                path={paths.main}
                fx={pad}
                fy={pad}
                w={size.w}
                h={size.h}
                bevel={cut}
                opTop={LEAK_OPACITY[premiumIntensity]}
                opBottom={LEAK_OPACITY[premiumIntensity] * 0.6}
              />
            </>
          )}

          {/* Scanline (faisceau animé — effet distinct des scan lines CRT) */}
          {scanline && (
            <SkRect
              x={pad}
              y={scanRectY}
              width={size.w}
              height={1}
              color={hud.cyan.bright}
              opacity={scanOpacity}
            />
          )}

          {/* Bordure — dégradé diagonal non-uniforme si fourni, sinon couleur unie */}
          <SkPath
            path={paths.main}
            color={border}
            style="stroke"
            strokeWidth={spec.borderWidth}
          >
            {borderGradient && (
              <SkLinearGradient
                start={vec(pad, pad)}
                end={vec(pad + size.w, pad + size.h)}
                colors={[...borderGradient]}
                positions={borderGradientPositions ? [...borderGradientPositions] : undefined}
              />
            )}
          </SkPath>

          {/* PREMIUM #6 — Edge bloom (dégradé diagonal sur la bordure) */}
          {premium && (
            <EdgeBloom
              path={paths.main}
              start={vec(pad, pad)}
              end={vec(pad + size.w, pad + size.h)}
              strokeWidth={spec.borderWidth}
              opacity={0.9}
            />
          )}

          {/* Ticks de coin */}
          {paths.ticks.map((p, i) => (
            <SkPath
              key={i}
              path={p}
              color={hud.cyan.bright}
              opacity={0.8}
              style="stroke"
              strokeWidth={1.5}
              strokeCap="square"
            />
          ))}

          {/* PREMIUM #7/#8/#1 — Scan lines CRT + chroma + grain (par-dessus tout) */}
          {premium && (
            <>
              <ScanLines
                x={pad}
                y={pad}
                width={size.w}
                height={size.h}
                clip={paths.main}
                opacity={SCANLINES_OPACITY[premiumIntensity]}
              />
              <ChromaticAberration
                path={paths.main}
                shift={CHROMA_SHIFT[premiumIntensity]}
                opacity={0.3}
              />
              <NoiseOverlay path={paths.main} opacity={NOISE_OPACITY[premiumIntensity]} />
            </>
          )}
        </Canvas>
      )}

      <View style={{ padding }}>{children}</View>
    </View>
  );
}
