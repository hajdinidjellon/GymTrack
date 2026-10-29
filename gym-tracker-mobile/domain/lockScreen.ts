/**
 * ÉCRAN VERROUILLÉ — ce que la Live Activity affiche pendant la séance.
 * Texte et timestamps seulement : la mise en page est dans components/liveActivity.
 */

import { LOADING_SUFFIX, loadingOf, sidePlates } from '@/domain/loading';
import { formatKg } from '@/domain/plates';
import { findCurrent } from '@/domain/sessionCursor';
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
  const resting = session.restEndsAt !== null && session.restEndsAt > now && session.restDuration !== null;
  const rest = resting
    ? { restStart: session.restEndsAt! - session.restDuration! * 1000, restEnd: session.restEndsAt }
    : { restStart: null, restEnd: null };

  if (!cursor) {
    return {
      session: session.name,
      exercise: 'Séance terminée',
      setLabel: '',
      target: "Ouvre l'app pour l'enregistrer",
      plates: '',
      ...rest,
      canValidate: false,
      done: true,
    };
  }

  const { exercise, set, setIndex } = cursor;
  const loading = loadingOf(exercise);
  const suffix = LOADING_SUFFIX[loading];
  const load = set.weight > 0 ? `${formatKg(set.weight)} kg${suffix ? ` ${suffix}` : ''} × ` : '';
  const perSide = exercise.needsWeight ? [] : sidePlates(loading, set.weight, settings);

  return {
    session: session.name,
    exercise: exercise.name,
    setLabel: `Série ${setIndex + 1}/${exercise.sets.length}`,
    target: exercise.needsWeight ? "Choisis ta charge dans l'app" : `${load}${set.reps}${load ? '' : ' reps'}`,
    plates: perSide.length > 0 ? `${perSide.map(formatKg).join(' + ')} par côté` : '',
    ...rest,
    canValidate: !exercise.needsWeight,
    done: false,
  };
}
