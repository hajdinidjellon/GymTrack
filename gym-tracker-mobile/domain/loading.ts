/**
 * CHARGE — what the weight on screen counts: the whole bar, each side of a
 * plate-loaded machine, each dumbbell, or the stack.
 */

import { describeSide, formatKg, loadBar, platesForSide } from '@/domain/plates';
import { findExerciseDef, isPlateLoaded } from '@/domain/programs';
import type { LoadFactor } from '@/domain/sessionBuilder';
import { t } from '@/i18n';
import type { ActiveExercise, AppSettings } from '@/types';

export type Loading = 'bar' | 'perSide' | 'perHand' | 'stack';

export function loadingOf(exercise: Pick<ActiveExercise, 'equipment' | 'plateLoaded'>): Loading {
  if (exercise.equipment === 'barbell') return 'bar';
  if (exercise.equipment === 'dumbbell') return 'perHand';
  if (exercise.equipment === 'machine' && exercise.plateLoaded) return 'perSide';
  return 'stack';
}

/** Said right after the weight: "40 kg de chaque côté". */
export const LOADING_SUFFIX: Record<Loading, string | null> = {
  bar: null,
  get perSide() {
    return t('domain.load.suffixPerSide');
  },
  get perHand() {
    return t('domain.load.suffixPerHand');
  },
  stack: null,
};

/** Plates to put on one side, heaviest first. Empty off the bar and the plate-loaded machines. */
export function sidePlates(loading: Loading, weight: number, gym: Pick<AppSettings, 'barWeight' | 'plates'>): number[] {
  if (loading === 'bar') return loadBar(weight, gym.barWeight, gym.plates).perSide;
  if (loading === 'perSide') return platesForSide(weight, gym.plates);
  return [];
}

/**
 * What the gym's plates cannot make on each side: 62,5 kg on a 20 kg bar
 * without 1,25 kg plates leaves 1,25 per side out. 0 when it loads exactly.
 */
export function missingPerSide(
  loading: Loading,
  weight: number,
  gym: Pick<AppSettings, 'barWeight' | 'plates'>,
): number {
  if (loading === 'bar') return weight > gym.barWeight ? loadBar(weight, gym.barWeight, gym.plates).missing / 2 : 0;
  if (loading === 'perSide')
    return Math.round((weight - platesForSide(weight, gym.plates).reduce((a, b) => a + b, 0)) * 100) / 100;
  return 0;
}

/** The line under the weight: "Par côté : 20 + 5", "De chaque côté : 20 + 5", "Par haltère". */
export function loadHint(
  loading: Loading,
  weight: number,
  gym: Pick<AppSettings, 'barWeight' | 'plates'>,
): string | null {
  const plates = sidePlates(loading, weight, gym);
  const missing = missingPerSide(loading, weight, gym);
  // Never silent: the drawn plates would not add up to the weight shown
  const gap = missing > 0 ? ` · ${t('domain.load.missing', { kg: formatKg(missing) })}` : '';
  switch (loading) {
    case 'bar':
      if (weight > 0 && weight < gym.barWeight) return t('domain.load.lighterThanBar', { kg: formatKg(gym.barWeight) });
      return plates.length
        ? `${t('domain.load.perSide', { plates: describeSide(plates) })}${gap}`
        : t('domain.load.emptyBar');
    case 'perSide':
      return plates.length
        ? `${t('domain.load.eachSide', { plates: describeSide(plates) })}${gap}`
        : t('domain.load.eachSideAlone');
    case 'perHand':
      return t('domain.load.perHand');
    case 'stack':
      return null;
  }
}

/**
 * How totals count the logged weight: as is, or twice for a plate-loaded
 * machine (both sides) and dumbbells (both hands), when the user asks.
 */
export function loadFactor(
  settings: Pick<AppSettings, 'countBothSides' | 'customExercises' | 'plateLoaded'>,
): LoadFactor {
  if (!settings.countBothSides) return () => 1;
  return (name) => {
    const def = findExerciseDef(name, settings.customExercises);
    if (!def) return 1;
    return def.equipment === 'dumbbell' || isPlateLoaded(def, settings.plateLoaded) ? 2 : 1;
  };
}
