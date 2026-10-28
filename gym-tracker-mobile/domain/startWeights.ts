/**
 * CHARGES DE DÉPART — the weights offered the first time on an exercise.
 * A cable, a Smith bar, one side of a plate-loaded machine or one dumbbell
 * do not start at the same numbers, and legs start heavier than arms.
 */

import type { Loading } from '@/domain/loading';
import { platesForSide } from '@/domain/plates';
import type { ExerciseDef } from '@/domain/programs';
import type { AppSettings, MuscleGroup } from '@/types';

type Station = 'bar' | 'smith' | 'perSide' | 'cable' | 'stack' | 'dumbbell';

const LOWER: MuscleGroup[] = ['legs', 'glutes', 'calves'];

/** In kg, per station: any lower-body exercise, an upper-body compound, an upper-body isolation. */
const PRESETS: Record<Station, { lower: number[]; upper: number[]; isolation: number[] }> = {
  bar: { lower: [40, 50, 60, 80, 100, 120], upper: [20, 30, 40, 50, 60, 80], isolation: [20, 25, 30, 35, 40, 45] },
  smith: { lower: [20, 30, 40, 60, 80, 100], upper: [10, 20, 30, 40, 50, 60], isolation: [10, 15, 20, 25, 30, 40] },
  perSide: { lower: [20, 30, 40, 50, 60, 80], upper: [10, 15, 20, 25, 30, 40], isolation: [5, 10, 15, 20, 25, 30] },
  cable: { lower: [10, 15, 20, 25, 30, 40], upper: [30, 35, 40, 50, 60, 70], isolation: [5, 10, 15, 20, 25, 30] },
  stack: { lower: [20, 30, 40, 50, 60, 80], upper: [20, 30, 40, 50, 60, 70], isolation: [10, 15, 20, 25, 30, 40] },
  dumbbell: { lower: [8, 10, 12, 16, 20, 24], upper: [8, 10, 12, 14, 16, 20], isolation: [4, 6, 8, 10, 12, 14] },
};

function stationOf(def: Pick<ExerciseDef, 'equipment' | 'plateLoaded' | 'gear'>): Station | null {
  switch (def.equipment) {
    case 'barbell':
      return 'bar';
    case 'dumbbell':
      return 'dumbbell';
    case 'machine':
      return def.gear ?? (def.plateLoaded ? 'perSide' : 'stack');
    case 'bodyweight':
      return null;
  }
}

/** Six weights to start from, lightest first. None for bodyweight exercises. */
export function startPresets(
  def: Pick<ExerciseDef, 'equipment' | 'category' | 'muscleGroups' | 'plateLoaded' | 'gear'>,
): number[] {
  const station = stationOf(def);
  if (!station) return [];
  const row = PRESETS[station];
  const main = def.muscleGroups[0];
  // Leg extension or calves still move leg weights, whatever the kind of movement
  if (main && LOWER.includes(main)) return row.lower;
  return def.category === 'compound' ? row.upper : row.isolation;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The presets moved to weights the gym can really make, never heavier:
 * the bar and the plates that are there, one weight step on a stack or a
 * dumbbell rack. Duplicates are dropped.
 */
export function fitToGym(
  presets: number[],
  loading: Loading,
  gym: Pick<AppSettings, 'barWeight' | 'plates'>,
  increment: number,
): number[] {
  const fit = (p: number): number => {
    if (loading === 'bar') {
      if (p <= gym.barWeight) return gym.barWeight;
      return round2(gym.barWeight + 2 * sum(platesForSide((p - gym.barWeight) / 2, gym.plates)));
    }
    if (loading === 'perSide') return round2(sum(platesForSide(p, gym.plates)));
    return increment > 0 ? round2(Math.max(increment, Math.floor(p / increment + 1e-9) * increment)) : p;
  };
  return [...new Set(presets.map(fit))].filter((p) => p > 0).sort((a, b) => a - b);
}

const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);
