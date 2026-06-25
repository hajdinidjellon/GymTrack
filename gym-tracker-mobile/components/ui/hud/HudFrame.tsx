/**
 * HUD FRAME — API publique stable d'encadrement HUD sci-fi (spec « 7 couches »).
 *
 * Wrapper au-dessus du design system existant : réutilise les paths
 * d'`octagon.ts` et les tokens `hud` de constants/theme.ts (UNE source de
 * vérité — aucun hex hardcodé, aucune palette dupliquée).
 *
 * Les 7 couches, dans l'ORDRE DE RENDU (fond → avant). NB : l'ordre dévie
 * volontairement du spec littéral — le spec dessine l'inner glow AVANT le
 * fond, ce qui le fait recouvrir par le fond opaque (effet « edge-lit »
 * perdu). On dessine donc l'inner glow APRÈS le fond + la bordure :
 *
 *   1. Outer halo   — fill flouté large, nuance GLOW profonde (#00B4F0)
 *   2. Mid glow     — stroke flouté moyen, nuance PRIMARY (#1DC4FF)
 *   3. Background    — gradient bleu 3 stops (hud.frame.*)
 *   4. Main border  — stroke net, nuance PRIMARY (#1DC4FF)
 *   5. Inner glow   — stroke flouté serré PAR-DESSUS, nuance BRIGHT (#5DD8FF)
 *   6. Top highlight — 3 segments hauts uniquement, BRIGHT (lumière du dessus)
 *   7. Indicateurs ▼▲ — BRIGHT (cartes de mode actives uniquement)
 *
 * 3 nuances cyan qui se mélangent : glow.deep (halo) / cyan.primary
 * (mid + border) / cyan.bright (inner + highlight + indicateurs).
 *
 * HudFrame ne gère QUE l'encadrement. Le contenu (icônes, textes) est passé
 * en `children` — il n'importe aucune icône.
 */
import React, { useMemo } from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import {
  Canvas,
  Path as SkPath,
  BlurMask,
  Skia,
  LinearGradient as SkLinearGradient,
  vec,
  type SkPath as SkPathType,
} from '@shopify/react-native-skia';
import { hud } from '@/constants/theme';
import { octagonSVG, arrowRightSVG, topBevelSVG } from './octagon';
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

export type HudFrameShape = 'octagon' | 'rounded-rect' | 'arrow-right';
export type HudFrameIntensity = 'low' | 'medium' | 'high';

// Ré-exporte les types premium (compat barrel @/components/ui/hud).
export type { PremiumIntensity, LightDirection };

/** Couches isolables en mode debug (galerie de test). */
export type HudFrameLayer =
  // ── couches de base (7) ──
  | 'halo'
  | 'mid'
  | 'bg'
  | 'border'
  | 'inner'
  | 'highlight'
  | 'indicators'
  // ── couches premium (ajoutées une à une) ──
  | 'asymHalo'
  | 'colorVar'
  | 'vignette'
  | 'leaks'
  | 'edgeBloom'
  | 'scanlines'
  | 'chroma'
  | 'noise';

export type HudFrameProps = {
  /** Dimensions du conteneur (le glow déborde au-delà via un Canvas surdimensionné). */
  width: number;
  height: number;
  /** Forme de l'encadrement. `rounded-rect` partage le path octogone (biseaux uniformes). */
  shape?: HudFrameShape;
  /** Taille des chanfreins (px). Défaut : hud.cut.md. */
  bevel?: number;
  /** Intensité du glow (pilote halo + mid + inner + opacité bordure). */
  intensity?: HudFrameIntensity;
  /** Élément sélectionné : glow boosté + bordure bright + fond élevé. */
  active?: boolean;
  showTopHighlight?: boolean;
  /** Petit triangle ▼ centré en haut (carte de mode active). */
  showTopIndicator?: boolean;
  /** Petit triangle ▲ centré en bas. */
  showBottomIndicator?: boolean;
  /** Padding du contenu posé par-dessus le Canvas. */
  contentPadding?: number;
  /** Active les couches premium « painted » (grain, etc.). Défaut false (rétrocompat). */
  premium?: boolean;
  /** Intensité des couches premium. Défaut 'medium'. */
  premiumIntensity?: PremiumIntensity;
  /** Direction de la lumière simulée (halos asymétriques). Défaut 'top-left'. */
  lightDirection?: LightDirection;
  /** DEBUG : n'affiche qu'UNE couche pour valider chacune en isolation. */
  debugOnly?: HudFrameLayer;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

type IntensityConfig = {
  outer: number; mid: number; inner: number;
  outerOp: number; midOp: number; innerOp: number; borderOp: number;
};

// Record à clés exhaustives → indexation typée (pas de `| undefined`).
const INTENSITY: Record<HudFrameIntensity, IntensityConfig> = {
  low:    { outer: 18, mid: 8,  inner: 4, outerOp: 0.30, midOp: 0.50, innerOp: 0.55, borderOp: 0.7 },
  medium: { outer: 25, mid: 12, inner: 6, outerOp: 0.45, midOp: 0.70, innerOp: 0.70, borderOp: 0.9 },
  high:   { outer: 35, mid: 16, inner: 8, outerOp: 0.60, midOp: 0.90, innerOp: 0.85, borderOp: 1.0 },
};

// Zone extérieure réservée au glow (le BlurMask le plus large + indicateurs).
const PAD_BY_INTENSITY: Record<HudFrameIntensity, number> = {
  low: 20, medium: 28, high: 40,
};

const ARROW_DEPTH = 28;

function buildSVG(
  shape: HudFrameShape, x: number, y: number, w: number, h: number, b: number,
): string {
  switch (shape) {
    case 'arrow-right':
      return arrowRightSVG(x, y, w, h, b, ARROW_DEPTH);
    case 'octagon':
    case 'rounded-rect':
    default:
      return octagonSVG(x, y, w, h, b);
  }
}

export function HudFrame({
  width,
  height,
  shape = 'octagon',
  bevel = hud.cut.md,
  intensity = 'medium',
  active = false,
  showTopHighlight = true,
  showTopIndicator = false,
  showBottomIndicator = false,
  contentPadding = 16,
  premium = false,
  premiumIntensity = 'medium',
  lightDirection = 'top-left',
  debugOnly,
  style,
  children,
}: HudFrameProps) {
  const pad = PAD_BY_INTENSITY[intensity];
  const cfg = INTENSITY[intensity];
  const fx = pad;
  const fy = pad;
  const arrowDepth = shape === 'arrow-right' ? ARROW_DEPTH : 0;

  const built = useMemo(() => {
    const make = (svg: string): SkPathType | null => Skia.Path.MakeFromSVGString(svg);

    const main = make(buildSVG(shape, fx, fy, width, height, bevel));
    if (!main) return null;

    const topHighlight = showTopHighlight
      ? make(topBevelSVG(fx, fy, width, height, bevel, arrowDepth))
      : null;

    const cx = fx + width / 2;
    const topInd = showTopIndicator
      ? make(`M ${cx - 7} ${fy} L ${cx + 7} ${fy} L ${cx} ${fy + 8} Z`)
      : null;
    const botInd = showBottomIndicator
      ? make(`M ${cx - 7} ${fy + height} L ${cx + 7} ${fy + height} L ${cx} ${fy + height - 8} Z`)
      : null;

    return { main, topHighlight, topInd, botInd };
  }, [shape, fx, fy, width, height, bevel, arrowDepth, showTopHighlight, showTopIndicator, showBottomIndicator]);

  // Fallback null-safe : le path principal n'a pas pu être construit.
  if (!built) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        `[HudFrame] Skia n'a pas pu construire le path (shape="${shape}", ` +
        `w=${width}, h=${height}, bevel=${bevel}). Rendu du contenu sans encadrement.`,
      );
    }
    return (
      <View style={[{ width, height }, style]}>
        <View style={{ flex: 1, padding: contentPadding }}>{children}</View>
      </View>
    );
  }

  const { main, topHighlight, topInd, botInd } = built;

  // En mode debug : n'affiche qu'une couche (les autres sont masquées).
  const show = (layer: HudFrameLayer): boolean => debugOnly === undefined || debugOnly === layer;

  const borderColor = active ? hud.cyan.bright : hud.cyan.primary;
  const borderWidth = active ? 2.5 : 1.5;
  const glowOpacity = active ? Math.min(1, cfg.outerOp * 1.4) : cfg.outerOp;
  const midOpacity = active ? Math.min(1, cfg.midOp * 1.25) : cfg.midOp;

  // 3 stops bleus DISTINCTS (le dégradé doit se voir : bleu en haut → noir en bas).
  const bgColors: [string, string, string] = active
    ? [hud.frame.bgTop, hud.frame.bgMid, hud.frame.bgBottom]
    : [hud.frame.bgTopDim, hud.frame.bgMidDim, hud.frame.bgBottomDim];

  const gradStart = vec(fx + width / 2, fy);
  const gradEnd = vec(fx + width / 2, fy + height);

  return (
    <View style={[{ width, height, position: 'relative' }, style]}>
      <Canvas
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -pad,
          left: -pad,
          width: width + pad * 2,
          height: height + pad * 2,
        }}
      >
        {/* PREMIUM #2 — Multi-halo asymétrique (tout au fond, complète COUCHE 1) */}
        {premium && show('asymHalo') && (
          <AsymmetricHalos
            path={main}
            outerBlur={cfg.outer}
            offset={ASYM_OFFSET[premiumIntensity]}
            hx={LIGHT_HX[lightDirection]}
          />
        )}

        {/* COUCHE 1 — Outer halo (nuance GLOW profonde #00B4F0) */}
        {show('halo') && (
          <SkPath path={main} color={hud.glow.deep} opacity={glowOpacity} style="fill">
            <BlurMask blur={cfg.outer} style="normal" />
          </SkPath>
        )}

        {/* PREMIUM #3 — Color variation (SweepGradient cyan sur le halo) */}
        {premium && show('colorVar') && (
          <ColorVarHalo
            path={main}
            center={vec(fx + width / 2, fy + height / 2)}
            blur={cfg.outer}
            opacity={COLORVAR_OPACITY[premiumIntensity]}
          />
        )}

        {/* COUCHE 2 — Mid glow (transition, nuance PRIMARY #1DC4FF) */}
        {show('mid') && (
          <SkPath path={main} color={hud.cyan.primary} opacity={midOpacity} style="stroke" strokeWidth={3}>
            <BlurMask blur={cfg.mid} style="normal" />
          </SkPath>
        )}

        {/* COUCHE 3 — Background gradient bleu (3 stops distincts) */}
        {show('bg') && (
          <SkPath path={main} style="fill">
            <SkLinearGradient start={gradStart} end={gradEnd} colors={bgColors} positions={[0, 0.5, 1]} />
          </SkPath>
        )}

        {/* PREMIUM #4 — Vignette interne (entre fond et bordure) */}
        {premium && show('vignette') && (
          <Vignette
            path={main}
            center={vec(fx + width / 2, fy + height / 2)}
            radius={Math.min(width, height) * 0.6}
            darkness={VIGNETTE_DARKNESS[premiumIntensity]}
          />
        )}

        {/* PREMIUM #5 — Corner light leaks (par-dessus bg, sous bordure) */}
        {premium && show('leaks') && (
          <CornerLightLeaks
            path={main}
            fx={fx}
            fy={fy}
            w={width}
            h={height}
            bevel={bevel}
            opTop={LEAK_OPACITY[premiumIntensity]}
            opBottom={LEAK_OPACITY[premiumIntensity] * 0.6}
          />
        )}

        {/* COUCHE 4 — Main border (trait net, nuance PRIMARY #1DC4FF) */}
        {show('border') && (
          <SkPath path={main} color={borderColor} opacity={cfg.borderOp} style="stroke" strokeWidth={borderWidth} />
        )}

        {/* PREMIUM #6 — Edge bloom (dégradé diagonal sur la bordure, par-dessus COUCHE 4) */}
        {premium && show('edgeBloom') && (
          <EdgeBloom
            path={main}
            start={vec(fx, fy)}
            end={vec(fx + width, fy + height)}
            strokeWidth={borderWidth}
            opacity={cfg.borderOp}
          />
        )}

        {/* COUCHE 5 — Inner glow PAR-DESSUS (edge-lit, nuance BRIGHT #5DD8FF) */}
        {show('inner') && (
          <SkPath path={main} color={hud.cyan.bright} opacity={cfg.innerOp} style="stroke" strokeWidth={1.5}>
            <BlurMask blur={cfg.inner} style="inner" />
          </SkPath>
        )}

        {/* COUCHE 6 — Top highlight (3 segments hauts, BRIGHT, lumière du dessus) */}
        {show('highlight') && topHighlight && (
          <SkPath path={topHighlight} color={hud.cyan.bright} opacity={active ? 1 : 0.7} style="stroke" strokeWidth={1.5} strokeCap="round" />
        )}

        {/* COUCHE 7 — Indicateurs ▼▲ (BRIGHT) — corner accents supprimés */}
        {show('indicators') && topInd && (
          <SkPath path={topInd} color={hud.cyan.bright} style="fill">
            <BlurMask blur={2} style="normal" />
          </SkPath>
        )}
        {show('indicators') && botInd && (
          <SkPath path={botInd} color={hud.cyan.bright} style="fill">
            <BlurMask blur={2} style="normal" />
          </SkPath>
        )}

        {/* ═══ COUCHES PREMIUM (suite — par-dessus tout) ═══ */}

        {/* #7 — Scan lines (grille CRT statique, clippée à la forme) */}
        {premium && show('scanlines') && (
          <ScanLines
            x={fx}
            y={fy}
            width={width}
            height={height}
            clip={main}
            opacity={SCANLINES_OPACITY[premiumIntensity]}
          />
        )}

        {/* #8 — Chromatic aberration (cyan-only, par-dessus tout sauf grain) */}
        {premium && show('chroma') && (
          <ChromaticAberration path={main} shift={CHROMA_SHIFT[premiumIntensity]} opacity={0.3} />
        )}

        {/* #1 — Noise texture (grain organique, TOUJOURS en dernier) */}
        {premium && show('noise') && (
          <NoiseOverlay path={main} opacity={NOISE_OPACITY[premiumIntensity]} />
        )}
      </Canvas>

      {/* Contenu (children) posé par-dessus le Canvas */}
      <View style={{ flex: 1, padding: contentPadding }}>{children}</View>
    </View>
  );
}
