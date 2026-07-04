/**
 * SCAN LINES — texture « écran CRT/HUD » : grille de lignes horizontales
 * STATIQUES, très subtile, clippée à une forme.
 *
 * NB : à ne pas confondre avec le `scanline` de HudCard, qui est un FAISCEAU
 * unique ANIMÉ balayant verticalement (effet différent). Ici, grille fixe.
 *
 * Optimisation : un SEUL SkPath multi-segments (vs N éléments <Path>).
 * Réutilisable par HudFrame.premium (et tout futur conteneur HUD).
 */
import React, { useMemo } from 'react';
import {
  Group,
  Path as SkPath,
  Skia,
  type SkPath as SkPathType,
} from '@shopify/react-native-skia';
import { hud } from '@/constants/theme';

export type ScanLinesProps = {
  /** Origine de la zone (coords du Canvas parent). */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Espacement vertical entre lignes (px). Défaut 4. */
  gap?: number;
  /** Opacité globale du groupe. Défaut 0.06. */
  opacity?: number;
  /** Path de clipping : restreint les lignes à la forme (ex. octogone). */
  clip?: SkPathType;
  /** Couleur des lignes. Défaut cyan.bright. */
  color?: string;
};

export function ScanLines({
  x,
  y,
  width,
  height,
  gap = 4,
  opacity = 0.06,
  clip,
  color = hud.cyan.bright,
}: ScanLinesProps) {
  const linesPath = useMemo(() => {
    const p = Skia.Path.Make();
    for (let yy = y; yy <= y + height; yy += gap) {
      p.moveTo(x, yy);
      p.lineTo(x + width, yy);
    }
    return p;
  }, [x, y, width, height, gap]);

  return (
    <Group clip={clip} blendMode="overlay" opacity={opacity}>
      <SkPath path={linesPath} color={color} style="stroke" strokeWidth={1} />
    </Group>
  );
}
