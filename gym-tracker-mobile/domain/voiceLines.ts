/**
 * VOIX — ce que l'app dit pendant la séance. Texte seulement :
 * la lecture à voix haute est dans services/speech.ts.
 */

import { LOADING_SUFFIX, loadingOf, missingPerSide, sidePlates } from '@/domain/loading';
import { formatKg } from '@/domain/plates';
import type { Cursor } from '@/domain/sessionCursor';
import { setNumber } from '@/domain/warmup';
import { exerciseName, listOf, t } from '@/i18n';
import type { AppSettings } from '@/types';

const kilos = (n: number) => t('domain.voice.kilos', { kg: formatKg(n) });

/** "Mets 20 et 1,25 de chaque côté." For the bar and the plate-loaded machines only. */
export function platesLine(cursor: Cursor, settings: Pick<AppSettings, 'barWeight' | 'plates'>): string | null {
  const loading = loadingOf(cursor.exercise);
  if (loading !== 'bar' && loading !== 'perSide') return null;
  const perSide = sidePlates(loading, cursor.set.weight, settings);
  if (perSide.length === 0) return loading === 'bar' ? t('domain.voice.emptyBar') : null;
  const missing = missingPerSide(loading, cursor.set.weight, settings);
  const line = t('domain.voice.plates', { plates: listOf(perSide.map(formatKg)) });
  return missing > 0 ? `${line} ${t('domain.voice.missing', { kg: formatKg(missing) })}` : line;
}

/** "Série 2. 62,5 kilos, 10 reps.", "Série 1. 12 kilos par haltère, 10 reps." or "Échauffement 1. 20 kilos, 10 reps." */
export function setLine(cursor: Cursor): string {
  const { set, setIndex } = cursor;
  const { warmup, drop, n } = setNumber(cursor.exercise.sets, setIndex);
  const suffix = LOADING_SUFFIX[loadingOf(cursor.exercise)];
  const timed = !!cursor.exercise.timed;
  if (set.weight <= 0) return t(timed ? 'domain.voice.setSeconds' : 'domain.voice.setReps', { n, reps: set.reps });
  const load = `${kilos(set.weight)}${suffix ? ` ${suffix}` : ''}`;
  const key = warmup
    ? 'domain.voice.warmupLoad'
    : drop
      ? 'domain.voice.dropLoad'
      : timed
        ? 'domain.voice.setLoadSeconds'
        : 'domain.voice.setLoad';
  return t(key, { n, load, reps: set.reps });
}

/** Straight to the next set, no rest in between (warm-ups): the plates first, then the set. */
export function nextSetLine(cursor: Cursor, settings: Pick<AppSettings, 'barWeight' | 'plates'>): string {
  return [platesLine(cursor, settings), setLine(cursor)].filter(Boolean).join(' ');
}

/** Said while resting, as soon as the next set is a new exercise. The user's note on it comes last. */
export function nextExerciseLine(
  cursor: Cursor,
  settings: Pick<AppSettings, 'barWeight' | 'plates'> & Partial<Pick<AppSettings, 'exerciseNotes'>>,
): string {
  const { name, needsWeight } = cursor.exercise;
  const what = needsWeight ? t('domain.voice.pickStart') : (platesLine(cursor, settings) ?? setLine(cursor));
  const note = settings.exerciseNotes?.[name]?.replace(/[.!?…]+$/, '');
  return [
    t('domain.voice.nextExercise', { name: exerciseName(name) }),
    what,
    note ? t('domain.voice.note', { note }) : null,
  ]
    .filter(Boolean)
    .join(' ');
}

export function restOverLine(cursor: Cursor): string {
  return t('domain.voice.restOver', { set: setLine(cursor) });
}
