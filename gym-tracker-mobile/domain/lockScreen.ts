/**
 * ÉCRAN VERROUILLÉ — ce que la Live Activity affiche pendant la séance.
 * Texte et timestamps seulement : la mise en page est dans components/liveActivity.
 */

import { LOADING_SUFFIX, loadingOf, sidePlates } from '@/domain/loading';
import { formatKg } from '@/domain/plates';
import { findCurrent } from '@/domain/sessionCursor';
import { setNumber } from '@/domain/warmup';
import { dayName, exerciseName, t } from '@/i18n';
import type { ActiveSession, AppSettings } from '@/types';

/** Plain JSON: it crosses to the widget extension. */
export interface LockScreenProps {
  session: string;
  exercise: string;
  /** "Série 2/4" */
  setLabel: string;
  /** "80 kg × 8", "12 kg par haltère × 10", "8 reps" */
  target: string;
  /** "25 + 5 par côté", empty when there is nothing to load */
  plates: string;
  /** The same plates, one disc each, heaviest first: drawn in their IWF colour. */
  plateList: { kg: number; label: string }[];
  /** "2/4" for the Dynamic Island. */
  setShort: string;
  /** Sets done / sets in the session, for the progress bar. */
  setsDone: number;
  setsTotal: number;
  /** The widget cannot read the dictionary: every word it shows comes with the props. */
  labels: { validate: string; rest: string; upNext: string; perSide: string };
  /** Rest window in ms since epoch, both null when not resting. */
  restStart: number | null;
  restEnd: number | null;
  /** The set can be validated from the lock screen (false while the start weight is still to pick). */
  canValidate: boolean;
  /** Every set is done: only the app can save the session. */
  done: boolean;
}

export function lockScreenProps(
  session: ActiveSession,
  settings: Pick<AppSettings, 'barWeight' | 'plates'>,
  now: number,
): LockScreenProps {
  const cursor = findCurrent(session.exercises);
  const sets = session.exercises.flatMap((e) => e.sets);
  const common = {
    setsDone: sets.filter((x) => x.completed).length,
    setsTotal: sets.length,
    labels: {
      validate: t('common.validate'),
      rest: t('domain.lockScreen.rest'),
      upNext: t('domain.lockScreen.upNext'),
      perSide: t('domain.lockScreen.perSideShort'),
    },
  };
  const resting = session.restEndsAt !== null && session.restEndsAt > now && session.restDuration !== null;
  const rest = resting
    ? { restStart: session.restEndsAt! - session.restDuration! * 1000, restEnd: session.restEndsAt }
    : { restStart: null, restEnd: null };

  if (!cursor) {
    return {
      session: dayName(session.name),
      exercise: t('domain.lockScreen.done'),
      setLabel: '',
      target: t('domain.lockScreen.openToSave'),
      plates: '',
      plateList: [],
      setShort: '',
      ...common,
      ...rest,
      canValidate: false,
      done: true,
    };
  }

  const { exercise, set, setIndex } = cursor;
  const loading = loadingOf(exercise);
  const suffix = LOADING_SUFFIX[loading];
  const kg = formatKg(set.weight);
  const load =
    set.weight <= 0
      ? t(exercise.timed ? 'domain.load.seconds' : 'domain.load.reps', { reps: set.reps })
      : suffix
        ? t('domain.load.kgSuffixTimes', { kg, suffix, reps: set.reps })
        : t('domain.load.kgTimes', { kg, reps: set.reps });
  const perSide = exercise.needsWeight ? [] : sidePlates(loading, set.weight, settings);
  const number = setNumber(exercise.sets, setIndex);

  return {
    session: dayName(session.name),
    exercise: exerciseName(exercise.name),
    setLabel: t(number.warmup ? 'domain.lockScreen.warmupLabel' : 'domain.lockScreen.setLabel', {
      n: number.n,
      total: number.total,
    }),
    target: exercise.needsWeight ? t('domain.lockScreen.pickWeight') : load,
    plates: perSide.length > 0 ? t('domain.lockScreen.perSide', { plates: perSide.map(formatKg).join(' + ') }) : '',
    plateList: perSide.map((p) => ({ kg: p, label: formatKg(p) })),
    setShort: `${number.n}/${number.total}`,
    ...common,
    ...rest,
    canValidate: !exercise.needsWeight,
    done: false,
  };
}
