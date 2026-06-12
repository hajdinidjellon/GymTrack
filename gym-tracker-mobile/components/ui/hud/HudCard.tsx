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

const HALO_PAD = 36;

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
  /** Couleur de glow custom. */
  glowColor?: string;
  /** Fond en dégradé vertical (cartes héros) au lieu du fond plat. */
  gradientFill?: boolean;
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
  glowColor,
  gradientFill = false,
  padding = 16,
  style,
  children,
}: HudCardProps) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const spec = hud.glowLevel[level];

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
  const scanRectY = useDerivedValue(() => HALO_PAD + Math.min(scanY.value, size?.h ?? 0));
  const scanOpacity = useDerivedValue(() =>
    scanY.value >= (size?.h ?? 0) - 1 ? 0 : 0.06,
  );

  const paths = useMemo(() => {
    if (!size) return null;
    const { w, h } = size;
    const main = notched
      ? notchedOctagonPath(HALO_PAD, HALO_PAD, w, h, cut)
      : octagonPath(HALO_PAD, HALO_PAD, w, h, cut);
    const ticks = cornerTicks ? cornerTickPaths(HALO_PAD, HALO_PAD, w, h, cut) : [];
    return { main, ticks };
  }, [size?.w, size?.h, cut, notched, cornerTicks]);

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
            top: -HALO_PAD,
            left: -HALO_PAD,
            width: size.w + HALO_PAD * 2,
            height: size.h + HALO_PAD * 2,
          }}
        >
          {/* Halo (glow externe) */}
          {showGlow && (
            <SkPath path={paths.main} color={glow} style="fill" opacity={pulse}>
              <BlurMask blur={spec.blur} style="normal" />
            </SkPath>
          )}

          {/* Fond */}
          {gradientFill ? (
            <SkPath path={paths.main} style="fill">
              <SkLinearGradient
                start={vec(HALO_PAD + size.w / 2, HALO_PAD)}
                end={vec(HALO_PAD + size.w / 2, HALO_PAD + size.h)}
                colors={[hud.bg.surfaceElev, hud.bg.surface, hud.bg.surfaceDeep]}
                positions={[0, 0.5, 1]}
              />
            </SkPath>
          ) : (
            <SkPath path={paths.main} color={hud.bg.surface} style="fill" />
          )}

          {/* Scanline */}
          {scanline && (
            <SkRect
              x={HALO_PAD}
              y={scanRectY}
              width={size.w}
              height={1}
              color={hud.cyan.bright}
              opacity={scanOpacity}
            />
          )}

          {/* Bordure */}
          <SkPath
            path={paths.main}
            color={border}
            style="stroke"
            strokeWidth={spec.borderWidth}
          />

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
        </Canvas>
      )}

      <View style={{ padding }}>{children}</View>
    </View>
  );
}
