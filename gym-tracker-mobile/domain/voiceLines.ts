/**
 * VOIX — ce que l'app dit pendant la séance. Texte seulement :
 * la lecture à voix haute est dans services/speech.ts.
 */

import { formatKg, loadBar } from '@/domain/plates';
import type { Cursor } from '@/domain/sessionCursor';
import type { AppSettings } from '@/types';

const kilos = (n: number) => `${formatKg(n)} kilos`;

/** "Mets 20 et 1,25 de chaque côté." Only for barbell lifts. */
export function platesLine(cursor: Cursor, settings: Pick<AppSettings, 'barWeight' | 'plates'>): string | null {
  if (cursor.exercise.equipment !== 'barbell') return null;
  const { perSide } = loadBar(cursor.set.weight, settings.barWeight, settings.plates);
  if (perSide.length === 0) return 'Barre à vide.';
  const list = perSide.map(formatKg);
  const last = list.pop()!;
  return `Mets ${list.length ? `${list.join(', ')} et ${last}` : last} de chaque côté.`;
}

/** "Série 2. 62,5 kilos, 10 reps." */
export function setLine(cursor: Cursor): string {
  const { set, setIndex } = cursor;
  const load = set.weight > 0 ? `${kilos(set.weight)}, ` : '';
  return `Série ${setIndex + 1}. ${load}${set.reps} reps.`;
}

/** Said while resting, as soon as the next set is a new exercise. */
export function nextExerciseLine(cursor: Cursor, settings: Pick<AppSettings, 'barWeight' | 'plates'>): string {
  const plates = platesLine(cursor, settings);
  if (cursor.exercise.needsWeight) return `Prochain exercice : ${cursor.exercise.name}. Choisis ta charge de départ.`;
  return [`Prochain exercice : ${cursor.exercise.name}.`, plates ?? setLine(cursor)].join(' ');
}

export function restOverLine(cursor: Cursor): string {
  return `C'est reparti. ${setLine(cursor)}`;
}
