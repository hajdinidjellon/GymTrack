/**
 * VOIX — ce que l'app dit pendant la séance. Texte seulement :
 * la lecture à voix haute est dans services/speech.ts.
 */

import { LOADING_SUFFIX, loadingOf, sidePlates } from '@/domain/loading';
import { formatKg } from '@/domain/plates';
import type { Cursor } from '@/domain/sessionCursor';
import type { AppSettings } from '@/types';

const kilos = (n: number) => `${formatKg(n)} kilos`;

/** "Mets 20 et 1,25 de chaque côté." For the bar and the plate-loaded machines only. */
export function platesLine(cursor: Cursor, settings: Pick<AppSettings, 'barWeight' | 'plates'>): string | null {
  const loading = loadingOf(cursor.exercise);
  if (loading !== 'bar' && loading !== 'perSide') return null;
  const perSide = sidePlates(loading, cursor.set.weight, settings);
  if (perSide.length === 0) return loading === 'bar' ? 'Barre à vide.' : null;
  const list = perSide.map(formatKg);
  const last = list.pop()!;
  return `Mets ${list.length ? `${list.join(', ')} et ${last}` : last} de chaque côté.`;
}

/** "Série 2. 62,5 kilos, 10 reps." or "Série 1. 12 kilos par haltère, 10 reps." */
export function setLine(cursor: Cursor): string {
  const { set, setIndex } = cursor;
  const suffix = LOADING_SUFFIX[loadingOf(cursor.exercise)];
  const load = set.weight > 0 ? `${kilos(set.weight)}${suffix ? ` ${suffix}` : ''}, ` : '';
  return `Série ${setIndex + 1}. ${load}${set.reps} reps.`;
}

/** Said while resting, as soon as the next set is a new exercise. The user's note on it comes last. */
export function nextExerciseLine(
  cursor: Cursor,
  settings: Pick<AppSettings, 'barWeight' | 'plates'> & Partial<Pick<AppSettings, 'exerciseNotes'>>,
): string {
  const { name, needsWeight } = cursor.exercise;
  const what = needsWeight ? 'Choisis ta charge de départ.' : (platesLine(cursor, settings) ?? setLine(cursor));
  const note = settings.exerciseNotes?.[name]?.replace(/[.!?…]+$/, '');
  return [`Prochain exercice : ${name}.`, what, note ? `Note : ${note}.` : null].filter(Boolean).join(' ');
}

export function restOverLine(cursor: Cursor): string {
  return `C'est reparti. ${setLine(cursor)}`;
}
