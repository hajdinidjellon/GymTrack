/**
 * VOIX — annonces parlées pendant la séance (expo-speech, dispo dans Expo Go).
 * Le téléphone peut rester dans la poche : il dit quoi charger et quand repartir.
 */

import * as Speech from 'expo-speech';
import { formatKg, loadBar } from '@/lib/plates';
import type { Cursor } from '@/lib/sessionCursor';
import type { AppSettings } from '@/types';

export function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: 'fr-FR', rate: 1.05 });
}

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
