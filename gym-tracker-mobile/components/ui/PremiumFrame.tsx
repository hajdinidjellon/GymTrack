/**
 * PREMIUM FRAME — encadrement octogonal sci-fi HUD à 7 couches Skia.
 *
 * Couches empilées (du fond vers l'avant, dans l'ordre EXACT) :
 *   1. Halo externe (BlurMask, +6px outset, opacity selon variant)
 *   2. Fond gradient vertical (surfaceElev → surface → surfaceDeep)
 *   3. Inner shadow (BlurMask inner, noir 40 %, simulate "creusé")
 *   4. Bevel light (filet 1.5px sur les 3 segments du haut)
 *   5. Double bordure (externe 1px + interne 0.5px, gap 2px)
 *   6. Corner accents (4 L-brackets cyan-bright en dehors)
 *   7. Contenu (children React Native)
 *
 * Tout passe par Skia — interdit : shadowOpacity, elevation, box-shadow.
 *
 * Le composant occupe `width × height` en flow. Le halo et les corner
 * accents débordent à l'EXTÉRIEUR via un Canvas surdimensionné en
 * absolute (overflow:'visible' par défaut sur RN).
 */
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Path as SkPath,
  BlurMask,
  Skia,
  LinearGradient as SkLinearGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import { hud } from '@/constants/theme';

export type PremiumFrameProps = {
  width: number;
  height: number;
  variant?: 'neutral' | 'active';
  cornerCut?: number;
  showCornerAccents?: boolean;
  intensity?: 'subtle' | 'normal' | 'strong';
  contentPadding?: number;
  children?: React.ReactNode;
};

// ── Halo margin : zone extérieure pour le glow + corner accents ──────
//
// On surdimensionne le Canvas de HALO_PAD de chaque côté pour absorber
// le BlurMask sigma et les corner accents 3px outside.
const HALO_PAD = 30;

function octagonPath(x: number, y: number, w: number, h: number, b: number): string {
  return [
    `M ${x + b} ${y}`,
    `L ${x + w - b} ${y}`,
    `L ${x + w} ${y + b}`,
    `L ${x + w} ${y + h - b}`,
    `L ${x + w - b} ${y + h}`,
    `L ${x + b} ${y + h}`,
    `L ${x} ${y + h - b}`,
    `L ${x} ${y + b}`,
    'Z',
  ].join(' ');
}

// Top 3 segments uniquement : pour le bevel light (haut-gauche diag +
// haut horizontal + haut-droit diag)
function topBevelPath(x: number, y: number, w: number, h: number, b: number): string {
  return [
    `M ${x} ${y + b}`,
    `L ${x + b} ${y}`,
    `L ${x + w - b} ${y}`,
    `L ${x + w} ${y + b}`,
  ].join(' ');
}

// Un L bracket à un coin : 8px sur chaque arm. Voir Phase 2 spec.
function cornerLPath(corner: 'tl' | 'tr' | 'br' | 'bl', x: number, y: number, w: number, h: number): string {
  const ARM = 8;
  const OUT = 3; // 3px outside main border
  switch (corner) {
    case 'tl':
      return `M ${x + ARM - OUT} ${y - OUT} L ${x - OUT} ${y - OUT} L ${x - OUT} ${y + ARM - OUT}`;
    case 'tr':
      return `M ${x + w - ARM + OUT} ${y - OUT} L ${x + w + OUT} ${y - OUT} L ${x + w + OUT} ${y + ARM - OUT}`;
    case 'br':
      return `M ${x + w + OUT} ${y + h - ARM + OUT} L ${x + w + OUT} ${y + h + OUT} L ${x + w - ARM + OUT} ${y + h + OUT}`;
    case 'bl':
      return `M ${x - OUT} ${y + h - ARM + OUT} L ${x - OUT} ${y + h + OUT} L ${x + ARM - OUT} ${y + h + OUT}`;
  }
}

export function PremiumFrame({
  width, height,
  variant = 'neutral',
  cornerCut = 12,
  showCornerAccents = true,
  intensity = 'normal',
  contentPadding = 16,
  children,
}: PremiumFrameProps) {
  const isActive = variant === 'active';

  // Canvas surdimensionné
  const cw = width  + HALO_PAD * 2;
  const ch = height + HALO_PAD * 2;
  // Coords de la frame DANS le Canvas (offset par HALO_PAD)
  const fx = HALO_PAD;
  const fy = HALO_PAD;
  const b  = cornerCut;

  // Halo blur sigma selon intensity
  const haloSigma = intensity === 'subtle' ? 12 : intensity === 'strong' ? 24 : 18;
  const haloOpacity = isActive ? 0.6 : 0.0;

  // Bevel light opacity selon variant
  const bevelOpacity = isActive ? 0.9 : 0.5;

  // Double border properties
  const outerBorderColor   = isActive ? hud.cyan.primary : hud.border.subtle;
  const outerBorderWidth   = isActive ? 1.5 : 1;
  const innerBorderColor   = isActive ? hud.cyan.primary : hud.border.subtle;
  const innerBorderOpacity = isActive ? 0.6 : 0.4;

  // Corner accents
  const accentColor   = hud.cyan.bright;
  const accentOpacity = isActive ? 1.0 : 0.7;

  // Skia paths (mémoïsés)
  const mainPath = useMemo(
    () => Skia.Path.MakeFromSVGString(octagonPath(fx, fy, width, height, b))!,
    [fx, fy, width, height, b],
  );

  // Halo path : octogone à +6px outset
  const HALO_OUT = 6;
  const haloPath = useMemo(
    () => Skia.Path.MakeFromSVGString(
      octagonPath(fx - HALO_OUT, fy - HALO_OUT, width + HALO_OUT * 2, height + HALO_OUT * 2, b + HALO_OUT),
    )!,
    [fx, fy, width, height, b],
  );

  // Inner border : octogone à 3px à l'INTÉRIEUR
  const INNER_INSET = 3;
  const innerPath = useMemo(
    () => Skia.Path.MakeFromSVGString(
      octagonPath(fx + INNER_INSET, fy + INNER_INSET, width - INNER_INSET * 2, height - INNER_INSET * 2, Math.max(2, b - INNER_INSET)),
    )!,
    [fx, fy, width, height, b],
  );

  const bevelPath = useMemo(
    () => Skia.Path.MakeFromSVGString(topBevelPath(fx, fy, width, height, b))!,
    [fx, fy, width, height, b],
  );

  const accentPaths = useMemo(() => {
    if (!showCornerAccents) return [];
    return (['tl', 'tr', 'br', 'bl'] as const).map((c) =>
      Skia.Path.MakeFromSVGString(cornerLPath(c, fx, fy, width, height))!,
    );
  }, [fx, fy, width, height, showCornerAccents]);

  // Gradient stops
  const gradStart = vec(fx + width / 2, fy);
  const gradEnd   = vec(fx + width / 2, fy + height);

  return (
    <View style={{ width, height, position: 'relative' }}>
      {/* Canvas surdimensionné en absolute, débordant pour le halo + accents */}
      <Canvas
        style={{
          position: 'absolute',
          top: -HALO_PAD,
          left: -HALO_PAD,
          width: cw,
          height: ch,
        }}
      >
        {/* ── COUCHE 1 — Halo externe ───────────────────────────────── */}
        {haloOpacity > 0 && (
          <SkPath path={haloPath} color={hud.cyan.primary} opacity={haloOpacity} style="fill">
            <BlurMask blur={haloSigma} style="normal" />
          </SkPath>
        )}

        {/* ── COUCHE 2 — Fond gradient vertical ─────────────────────── */}
        <SkPath path={mainPath} style="fill">
          <SkLinearGradient
            start={gradStart}
            end={gradEnd}
            colors={[hud.bg.surfaceElev, hud.bg.surface, hud.bg.surfaceDeep]}
            positions={[0, 0.5, 1]}
          />
        </SkPath>

        {/* ── COUCHE 3 — Inner shadow (BlurMask inner sur noir) ─────── */}
        <Group>
          <SkPath path={mainPath} color="#000000" opacity={0.4} style="stroke" strokeWidth={3}>
            <BlurMask blur={6} style="inner" />
          </SkPath>
        </Group>

        {/* ── COUCHE 4 — Bevel light (filet 1.5px sur les 3 segments du haut) ── */}
        <SkPath
          path={bevelPath}
          color={hud.cyan.bright}
          opacity={bevelOpacity}
          style="stroke"
          strokeWidth={1.5}
        />

        {/* ── COUCHE 5 — Double bordure ─────────────────────────────── */}
        <SkPath
          path={mainPath}
          color={outerBorderColor}
          style="stroke"
          strokeWidth={outerBorderWidth}
        />
        <SkPath
          path={innerPath}
          color={innerBorderColor}
          opacity={innerBorderOpacity}
          style="stroke"
          strokeWidth={0.5}
        />

        {/* ── COUCHE 6 — Corner accents (L-brackets 8px) ────────────── */}
        {accentPaths.map((p, i) => (
          <SkPath
            key={i}
            path={p}
            color={accentColor}
            opacity={accentOpacity}
            style="stroke"
            strokeWidth={1.5}
            strokeJoin="miter"
            strokeCap="square"
          />
        ))}
      </Canvas>

      {/* ── COUCHE 7 — Contenu ────────────────────────────────────── */}
      <View style={[StyleSheet.absoluteFill, { padding: contentPadding }]}>
        {children}
      </View>
    </View>
  );
}
