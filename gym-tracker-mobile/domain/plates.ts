/**
 * DISQUES — ce qu'il faut mettre de chaque côté de la barre.
 * Logique pure, testée dans domain/__tests__/plates.test.ts.
 */

import { getLocale, listOf, t } from '@/i18n';

export const DEFAULT_BAR = 20;
export const DEFAULT_PLATES = [20, 15, 10, 5, 2.5, 1.25];
/** Every plate a gym may have, heaviest first. The change plates (0,5 and 0,25) are off by default. */
export const ALL_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25];

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface PlateLoad {
  /** Plates on one side, heaviest first. */
  perSide: number[];
  /** Weight that could not be loaded with the available plates (total, both sides). */
  missing: number;
}

/** Greedy fill, heaviest plate first. Works for any standard plate set. */
export function platesForSide(sideWeight: number, available: number[]): number[] {
  const plates = [...available].sort((a, b) => b - a);
  const out: number[] = [];
  let left = round2(sideWeight);
  for (const p of plates) {
    while (left >= p - 1e-6) {
      out.push(p);
      left = round2(left - p);
    }
  }
  return out;
}

export function loadBar(total: number, bar = DEFAULT_BAR, available = DEFAULT_PLATES): PlateLoad {
  if (total <= bar) return { perSide: [], missing: 0 };
  const perSide = platesForSide((total - bar) / 2, available);
  const loaded = bar + perSide.reduce((sum, p) => sum + p, 0) * 2;
  return { perSide, missing: round2(total - loaded) };
}

/** "62,5" — French decimal comma, "62.5" in English, no trailing zeros. */
export function formatKg(n: number): string {
  const text = String(round2(n));
  return getLocale() === 'fr' ? text.replace('.', ',') : text;
}

/** "20 + 1,25" or "Barre à vide". */
export function describeSide(perSide: number[]): string {
  return perSide.length ? perSide.map(formatKg).join(' + ') : t('domain.load.emptyBar');
}

/** "un disque de 5", "un 10 et un 2,5", or "3 kg" when no plate combination fits. */
export function platesPhrase(sideWeight: number, available: number[]): string {
  const plates = platesForSide(sideWeight, available);
  if (plates.length === 0) return `${formatKg(sideWeight)} kg`;
  if (plates.length === 1) return t('domain.load.onePlate', { kg: formatKg(plates[0]!) });
  return listOf(plates.map((p) => t('domain.load.aPlate', { kg: formatKg(p) })));
}
