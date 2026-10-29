/**
 * CHARGE — what the weight on screen counts: the whole bar, each side of a
 * plate-loaded machine, each dumbbell, or the stack.
 */

import { describeSide, loadBar, platesForSide } from '@/domain/plates';
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
  perSide: 'de chaque côté',
  perHand: 'par haltère',
  stack: null,
};

/** Plates to put on one side, heaviest first. Empty off the bar and the plate-loaded machines. */
export function sidePlates(loading: Loading, weight: number, gym: Pick<AppSettings, 'barWeight' | 'plates'>): number[] {
  if (loading === 'bar') return loadBar(weight, gym.barWeight, gym.plates).perSide;
  if (loading === 'perSide') return platesForSide(weight, gym.plates);
  return [];
}

/** The line under the weight: "Par côté : 20 + 5", "De chaque côté : 20 + 5", "Par haltère". */
export function loadHint(
  loading: Loading,
  weight: number,
  gym: Pick<AppSettings, 'barWeight' | 'plates'>,
): string | null {
  const plates = sidePlates(loading, weight, gym);
  switch (loading) {
    case 'bar':
      return plates.length ? `Par côté : ${describeSide(plates)}` : 'Barre à vide';
    case 'perSide':
      return plates.length ? `De chaque côté : ${describeSide(plates)}` : 'De chaque côté';
    case 'perHand':
      return 'Par haltère';
    case 'stack':
      return null;
  }
}
