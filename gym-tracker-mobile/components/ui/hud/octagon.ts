/**
 * Générateurs de paths octogonaux partagés par toutes les primitives HUD.
 * L'octogone (coins biseautés) est LA forme signature du design system —
 * voir DESIGN-GYMTRACK.md §A.4.
 */
import { Skia, type SkPath } from '@shopify/react-native-skia';

/** Octogone biseauté : b = taille de coupe des coins. */
export function octagonSVG(x: number, y: number, w: number, h: number, b: number): string {
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

export function octagonPath(x: number, y: number, w: number, h: number, b: number): SkPath {
  return Skia.Path.MakeFromSVGString(octagonSVG(x, y, w, h, b))!;
}

/**
 * Forme HUD à pointe droite (CTA « DÉMARRER ») : octogone dont le côté droit
 * est remplacé par une flèche. `depth` = profondeur de la pointe.
 */
export function arrowRightSVG(
  x: number, y: number, w: number, h: number, b: number, depth = 28,
): string {
  return [
    `M ${x + b} ${y}`,
    `L ${x + w - depth - b} ${y}`,
    `L ${x + w - depth} ${y + b}`,
    `L ${x + w} ${y + h / 2}`,
    `L ${x + w - depth} ${y + h - b}`,
    `L ${x + w - depth - b} ${y + h}`,
    `L ${x + b} ${y + h}`,
    `L ${x} ${y + h - b}`,
    `L ${x} ${y + b}`,
    'Z',
  ].join(' ');
}

/**
 * Path du highlight haut : uniquement les 3 segments supérieurs (chanfrein
 * gauche + arête horizontale + chanfrein droit) — simule la lumière du dessus.
 * Variante `arrow` : s'arrête avant la pointe droite.
 */
export function topBevelSVG(
  x: number, y: number, w: number, h: number, b: number, arrowDepth = 0,
): string {
  const right = arrowDepth > 0 ? x + w - arrowDepth : x + w - b;
  return [
    `M ${x} ${y + b}`,
    `L ${x + b} ${y}`,
    `L ${right} ${y}`,
    arrowDepth > 0 ? `L ${right + b} ${y + b}` : `L ${x + w} ${y + b}`,
  ].join(' ');
}

/**
 * Octogone héros avec encoches triangulaires centrées en haut et en bas
 * (cf. mode-card-active.png). notch = demi-largeur de l'encoche.
 */
export function notchedOctagonPath(
  x: number, y: number, w: number, h: number, b: number, notch = 10, depth = 5,
): SkPath {
  const cx = x + w / 2;
  const svg = [
    `M ${x + b} ${y}`,
    `L ${cx - notch} ${y}`,
    `L ${cx} ${y + depth}`,
    `L ${cx + notch} ${y}`,
    `L ${x + w - b} ${y}`,
    `L ${x + w} ${y + b}`,
    `L ${x + w} ${y + h - b}`,
    `L ${x + w - b} ${y + h}`,
    `L ${cx + notch} ${y + h}`,
    `L ${cx} ${y + h - depth}`,
    `L ${cx - notch} ${y + h}`,
    `L ${x + b} ${y + h}`,
    `L ${x} ${y + h - b}`,
    `L ${x} ${y + b}`,
    'Z',
  ].join(' ');
  return Skia.Path.MakeFromSVGString(svg)!;
}

/** Ticks de coin : 4 petits traits de 8px posés sur les segments biseautés. */
export function cornerTickPaths(x: number, y: number, w: number, h: number, b: number): SkPath[] {
  const half = b / 2;
  const svgs = [
    `M ${x + half - 4} ${y + half + 4} L ${x + half + 4} ${y + half - 4}`,             // tl
    `M ${x + w - half - 4} ${y + half - 4} L ${x + w - half + 4} ${y + half + 4}`,     // tr
    `M ${x + w - half - 4} ${y + h - half + 4} L ${x + w - half + 4} ${y + h - half - 4}`, // br
    `M ${x + half - 4} ${y + h - half - 4} L ${x + half + 4} ${y + h - half + 4}`,     // bl
  ];
  return svgs.map((s) => Skia.Path.MakeFromSVGString(s)!);
}
