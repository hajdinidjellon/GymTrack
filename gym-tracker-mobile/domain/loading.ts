/**
 * CHARGE — what the weight on screen counts: the whole bar, each side of a
 * plate-loaded machine, each dumbbell, the stack, or the help of an assisted machine.
 */

import { describeSide, emptyBar, formatKg, loadBar, platesForSide, type Gym } from '@/domain/plates';
import { findExerciseDef, isPlateLoaded } from '@/domain/programs';
import type { LoadFactor } from '@/domain/sessionBuilder';
import { t } from '@/i18n';
import type { ActiveExercise, AppSettings } from '@/types';

export type Loading = 'bar' | 'perSide' | 'perHand' | 'stack' | 'assist';

export function loadingOf(exercise: Pick<ActiveExercise, 'equipment' | 'plateLoaded' | 'assisted'>): Loading {
  if (exercise.equipment === 'barbell') return 'bar';
  if (exercise.assisted) return 'assist';
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
  get assist() {
    return t('domain.load.suffixAssist');
  },
};

/** Plates to put on one side, heaviest first. Empty off the bar and the plate-loaded machines. */
export function sidePlates(loading: Loading, weight: number, gym: Gym): number[] {
  if (loading === 'bar') return loadBar(weight, emptyBar(gym), gym.plates).perSide;
  if (loading === 'perSide') return platesForSide(weight, gym.plates);
  return [];
}

const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** The heaviest weight at or under `weight` the gym's bar, collars and plates really make. Off the plates: as is. */
export function loadableWeight(loading: Loading, weight: number, gym: Gym): number {
  if (loading === 'bar') {
    const bar = emptyBar(gym);
    return weight <= bar ? weight : round2(bar + 2 * sum(platesForSide((weight - bar) / 2, gym.plates)));
  }
  if (loading === 'perSide') return weight <= 0 ? weight : round2(sum(platesForSide(weight, gym.plates)));
  return weight;
}

/** Weight steps offered for an exercise, lightest first. */
export const INCREMENT_STEPS = [0.5, 1, 1.25, 2, 2.5, 5];
const STACK_STEPS = [1, 1.25, 2, 2.5, 5];

/**
 * A step the plates can make: on the bar, the same plates on both sides
 * (1,25 kg plates make 2,5, not 1); on a machine, plates on each side.
 */
export function isLoadableStep(loading: Loading, step: number, plates: number[]): boolean {
  if (loading !== 'bar' && loading !== 'perSide') return true;
  const side = loading === 'bar' ? step / 2 : step;
  return Math.abs(sum(platesForSide(side, plates)) - side) < 1e-6;
}

/** The steps offered on the exercise page: only the ones the plates can make, five at most. */
export function incrementChoices(loading: Loading, plates: number[]): number[] {
  if (loading !== 'bar' && loading !== 'perSide') return STACK_STEPS;
  const loadable = INCREMENT_STEPS.filter((s) => isLoadableStep(loading, s, plates));
  if (loadable.length) return loadable.slice(-5);
  // Only big plates: the smallest one on each side
  const smallest = plates.length ? Math.min(...plates) : 2.5;
  return [loading === 'bar' ? 2 * smallest : smallest];
}

/** The step itself when the plates make it, else the next one they make (1,25 → 2,5 on the bar). */
export function loadableIncrement(loading: Loading, step: number, plates: number[]): number {
  if (isLoadableStep(loading, step, plates)) return step;
  const choices = incrementChoices(loading, plates);
  return choices.find((s) => s >= step) ?? choices[choices.length - 1]!;
}

/**
 * What the gym's plates cannot make on each side: 62,5 kg on a 20 kg bar
 * without 1,25 kg plates leaves 1,25 per side out. 0 when it loads exactly.
 */
export function missingPerSide(loading: Loading, weight: number, gym: Gym): number {
  if (loading === 'bar') return weight > emptyBar(gym) ? loadBar(weight, emptyBar(gym), gym.plates).missing / 2 : 0;
  if (loading === 'perSide')
    return Math.round((weight - platesForSide(weight, gym.plates).reduce((a, b) => a + b, 0)) * 100) / 100;
  return 0;
}

/** The line under the weight: "Par côté : 20 + 5", "De chaque côté : 20 + 5", "Par haltère". */
export function loadHint(loading: Loading, weight: number, gym: Gym): string | null {
  const plates = sidePlates(loading, weight, gym);
  const missing = missingPerSide(loading, weight, gym);
  // Never silent: the drawn plates would not add up to the weight shown
  const gap = missing > 0 ? ` · ${t('domain.load.missing', { kg: formatKg(missing) })}` : '';
  switch (loading) {
    case 'bar':
      if (weight > 0 && weight < emptyBar(gym))
        return t(gym.collarWeight ? 'domain.load.lighterThanBarCollars' : 'domain.load.lighterThanBar', {
          kg: formatKg(emptyBar(gym)),
        });
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
    case 'assist':
      return t('domain.load.assistHint');
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
