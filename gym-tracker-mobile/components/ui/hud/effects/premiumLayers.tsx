/**
 * PREMIUM LAYERS — couches « painted » partagées entre HudFrame et HudCard.
 *
 * UNE seule source de vérité : chaque couche est un sous-composant pur qui
 * prend un `path` (déjà offsetté dans le Canvas de l'hôte) + des coords/params.
 * Les hôtes (HudFrame, HudCard) mappent leur intensité sur ces params et
 * placent chaque couche au bon endroit de leur z-order respectif.
 *
 * Palette : tokens `hud.*` uniquement (aucun hex étranger, aucun rouge).
 */
import React from 'react';
import {
  Path as SkPath,
  BlurMask,
  LinearGradient as SkLinearGradient,
  SweepGradient,
  RadialGradient,
  Turbulence,
  ColorMatrix,
  Group,
  vec,
  type SkPoint,
  type SkPath as SkPathType,
} from '@shopify/react-native-skia';
import { hud } from '@/constants/theme';

/** Intensité des couches premium (grain, halos, vignette…). */
export type PremiumIntensity = 'subtle' | 'medium' | 'strong';

/** Direction de la source lumineuse simulée (halos asymétriques, highlight). */
export type LightDirection = 'top-left' | 'top' | 'top-right';

// ════════════════════════════════════════════════════════════════════
// #1 — Noise texture
// ════════════════════════════════════════════════════════════════════
// overlay + bruit gris-moyen s'annule à faible opacité → monter plus haut
// qu'on ne croit pour que le grain existe (mais reste subtil).
export const NOISE_OPACITY: Record<PremiumIntensity, number> = {
  subtle: 0.08,
  medium: 0.15,
  strong: 0.25,
};

// Matrice luminance : désature le bruit coloré en grain neutre.
const DESATURATE: number[] = [
  0.33, 0.33, 0.33, 0, 0,
  0.33, 0.33, 0.33, 0, 0,
  0.33, 0.33, 0.33, 0, 0,
  0,    0,    0,    1, 0,
];

export function NoiseOverlay({ path, opacity }: { path: SkPathType; opacity: number }) {
  return (
    <Group blendMode="overlay" opacity={opacity}>
      <SkPath path={path}>
        <ColorMatrix matrix={DESATURATE} />
        <Turbulence freqX={0.8} freqY={0.8} octaves={4} seed={2} />
      </SkPath>
    </Group>
  );
}

// ════════════════════════════════════════════════════════════════════
// #2 — Multi-halo asymétrique
// ════════════════════════════════════════════════════════════════════
export const ASYM_OFFSET: Record<PremiumIntensity, number> = {
  subtle: 4,
  medium: 8,
  strong: 14,
};

export const LIGHT_HX: Record<LightDirection, number> = {
  'top-left': -1,
  'top': 0,
  'top-right': 1,
};

export function AsymmetricHalos({
  path, outerBlur, offset, hx,
}: { path: SkPathType; outerBlur: number; offset: number; hx: number }) {
  return (
    <>
      {/* Highlight — vers la source (haut + côté), plus clair, plus serré */}
      <Group transform={[{ translateX: hx * offset }, { translateY: -offset * 1.25 }]}>
        <SkPath path={path} color={hud.cyan.bright} opacity={0.15} style="fill">
          <BlurMask blur={outerBlur * 0.7} style="normal" />
        </SkPath>
      </Group>
      {/* Ombre — opposée + vers le bas, plus saturée, plus diffuse */}
      <Group transform={[{ translateX: -hx * offset }, { translateY: offset * 1.4 }]}>
        <SkPath path={path} color={hud.glow.deep} opacity={0.18} style="fill">
          <BlurMask blur={outerBlur * 1.6} style="normal" />
        </SkPath>
      </Group>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// #3 — Color variation (SweepGradient cyan sur le halo)
// ════════════════════════════════════════════════════════════════════
export const COLORVAR_OPACITY: Record<PremiumIntensity, number> = {
  subtle: 0.16,
  medium: 0.26,
  strong: 0.36,
};

const SWEEP_CYAN: string[] = [
  hud.glow.deep,    // #00B4F0
  hud.cyan.primary, // #1DC4FF
  hud.cyan.bright,  // #5DD8FF
  hud.cyan.soft,    // #17B8FF
  hud.glow.deep,    // boucle
];

export function ColorVarHalo({
  path, center, blur, opacity,
}: { path: SkPathType; center: SkPoint; blur: number; opacity: number }) {
  return (
    <SkPath path={path} opacity={opacity} style="fill">
      <BlurMask blur={blur} style="normal" />
      <SweepGradient c={center} colors={SWEEP_CYAN} />
    </SkPath>
  );
}

// ════════════════════════════════════════════════════════════════════
// #4 — Vignette interne
// ════════════════════════════════════════════════════════════════════
export const VIGNETTE_DARKNESS: Record<PremiumIntensity, number> = {
  subtle: 0.20,
  medium: 0.35,
  strong: 0.50,
};

export function Vignette({
  path, center, radius, darkness,
}: { path: SkPathType; center: SkPoint; radius: number; darkness: number }) {
  return (
    <SkPath path={path} style="fill">
      <RadialGradient
        c={center}
        r={radius}
        colors={[`rgba(0,0,0,${darkness})`, `rgba(0,0,0,${darkness * 0.4})`, 'rgba(0,0,0,0)']}
        positions={[0, 0.5, 1]}
      />
    </SkPath>
  );
}

// ════════════════════════════════════════════════════════════════════
// #5 — Corner light leaks
// ════════════════════════════════════════════════════════════════════
// Opacité plafonnée subtile (même strong) : à plus haut, les fuites font des
// disques trop nets. Coins BAS à 60%.
export const LEAK_OPACITY: Record<PremiumIntensity, number> = {
  subtle: 0.10,
  medium: 0.13,
  strong: 0.16,
};

export function CornerLightLeaks({
  path, fx, fy, w, h, bevel, opTop, opBottom,
}: {
  path: SkPathType; fx: number; fy: number; w: number; h: number;
  bevel: number; opTop: number; opBottom: number;
}) {
  const off = 5;
  const leak = (cx: number, cy: number, r: number, color: string, op: number) => (
    <SkPath path={path} style="fill" opacity={op}>
      <BlurMask blur={12} style="normal" />
      <RadialGradient c={vec(cx, cy)} r={r} colors={[color, 'rgba(0,0,0,0)']} />
    </SkPath>
  );
  return (
    <>
      {leak(fx + bevel + off, fy + bevel + off, 55, hud.cyan.bright, opTop)}
      {leak(fx + w - bevel - off, fy + bevel + off, 55, hud.cyan.bright, opTop)}
      {leak(fx + bevel + off, fy + h - bevel - off, 48, hud.glow.deep, opBottom)}
      {leak(fx + w - bevel - off, fy + h - bevel - off, 48, hud.glow.deep, opBottom)}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// #6 — Edge bloom (dégradé diagonal sur la bordure)
// ════════════════════════════════════════════════════════════════════
export function EdgeBloom({
  path, start, end, strokeWidth, opacity,
}: { path: SkPathType; start: SkPoint; end: SkPoint; strokeWidth: number; opacity: number }) {
  return (
    <SkPath path={path} style="stroke" strokeWidth={strokeWidth} opacity={opacity}>
      <SkLinearGradient
        start={start}
        end={end}
        colors={[hud.cyan.bright, hud.cyan.primary, hud.cyan.dim]}
        positions={[0, 0.5, 1]}
      />
    </SkPath>
  );
}

// ════════════════════════════════════════════════════════════════════
// #7 — Scan lines : voir effects/ScanLines.tsx (composant dédié).
// ════════════════════════════════════════════════════════════════════
export const SCANLINES_OPACITY: Record<PremiumIntensity, number> = {
  subtle: 0.03,
  medium: 0.06,
  strong: 0.10,
};

// ════════════════════════════════════════════════════════════════════
// #8 — Chromatic aberration (VARIANTE CYAN-ONLY, aucun rouge)
// ════════════════════════════════════════════════════════════════════
export const CHROMA_SHIFT: Record<PremiumIntensity, number> = {
  subtle: 0.3,
  medium: 0.5,
  strong: 0.8,
};

export function ChromaticAberration({
  path, shift, opacity,
}: { path: SkPathType; shift: number; opacity: number }) {
  return (
    <>
      <Group transform={[{ translateX: shift }]}>
        <SkPath path={path} color={hud.cyan.bright} opacity={opacity} style="stroke" strokeWidth={1} />
      </Group>
      <Group transform={[{ translateX: -shift }]}>
        <SkPath path={path} color={hud.cyan.dim} opacity={opacity} style="stroke" strokeWidth={1} />
      </Group>
    </>
  );
}
