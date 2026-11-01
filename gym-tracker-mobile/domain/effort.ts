/**
 * How hard a set felt, in one tap. Stored as an RPE (the `rpe` field of a
 * set) so the history stays readable by any other tool.
 */

import { t } from '@/i18n';

export type Effort = 'easy' | 'good' | 'max';

export const EFFORTS: readonly Effort[] = ['easy', 'good', 'max'];

export const EFFORT_LABELS: Record<Effort, string> = {
  get easy() {
    return t('domain.effort.easy');
  },
  get good() {
    return t('domain.effort.good');
  },
  get max() {
    return t('domain.effort.max');
  },
};

/** Easy: 4 reps or more left. Good: about 2 left. Max: nothing left. */
export const EFFORT_RPE: Record<Effort, number> = { easy: 6, good: 8, max: 10 };

/** Reads back any RPE, typed by hand or imported, as one of the three efforts. */
export function effortOf(rpe: number | undefined): Effort | undefined {
  if (rpe == null) return undefined;
  if (rpe <= 7) return 'easy';
  if (rpe < 10) return 'good';
  return 'max';
}
