/**
 * COMMANDES VOCALES — what a few words said during the session mean.
 * Short phrases only: a long sentence is not a command (and the app's own
 * voice, "Série 2. 60 kilos, 10 reps.", must never be taken for one).
 */

import type { Effort } from '@/domain/effort';

export type VoiceCommand =
  | { kind: 'validate' }
  | { kind: 'reps'; reps: number }
  | { kind: 'effort'; effort: Effort }
  | { kind: 'later' }
  | { kind: 'skipRest' };

/** More words than this: not a command. */
export const MAX_COMMAND_WORDS = 4;

const NUMBERS: Record<string, number> = {
  un: 1,
  une: 1,
  one: 1,
  deux: 2,
  two: 2,
  trois: 3,
  three: 3,
  quatre: 4,
  four: 4,
  cinq: 5,
  five: 5,
  six: 6,
  sept: 7,
  seven: 7,
  huit: 8,
  eight: 8,
  neuf: 9,
  nine: 9,
  dix: 10,
  ten: 10,
  onze: 11,
  eleven: 11,
  douze: 12,
  twelve: 12,
  treize: 13,
  thirteen: 13,
  quatorze: 14,
  fourteen: 14,
  quinze: 15,
  fifteen: 15,
  seize: 16,
  sixteen: 16,
  vingt: 20,
  twenty: 20,
  trente: 30,
  thirty: 30,
};

// Longest phrases first: "trop dur" before "dur"
const PHRASES: [string, VoiceCommand][] = [
  ['plus tard', { kind: 'later' }],
  ['later', { kind: 'later' }],
  ['passe le repos', { kind: 'skipRest' }],
  ['fin du repos', { kind: 'skipRest' }],
  ['skip rest', { kind: 'skipRest' }],
  ['on y va', { kind: 'skipRest' }],
  ['juste bien', { kind: 'effort', effort: 'good' }],
  ['trop dur', { kind: 'effort', effort: 'max' }],
  ['a fond', { kind: 'effort', effort: 'max' }],
  ['facile', { kind: 'effort', effort: 'easy' }],
  ['easy', { kind: 'effort', effort: 'easy' }],
  ['good', { kind: 'effort', effort: 'good' }],
  ['hard', { kind: 'effort', effort: 'max' }],
  ['c est fait', { kind: 'validate' }],
  ['valider', { kind: 'validate' }],
  ['valide', { kind: 'validate' }],
  ['fait', { kind: 'validate' }],
  ['done', { kind: 'validate' }],
];

/** Lowercase words without accents or punctuation: "C'est fait !" → "c est fait". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function repsIn(words: string[]): number | null {
  for (const w of words) {
    const n = /^\d{1,3}$/.test(w) ? Number(w) : NUMBERS[w];
    if (n !== undefined && n > 0 && n <= 100) return n;
  }
  return null;
}

/** The command in what was heard, or null. "8", "huit", "8 reps", "fait 8": 8 reps done. */
export function parseCommand(heard: string): VoiceCommand | null {
  const text = normalize(heard);
  const words = text ? text.split(' ') : [];
  if (words.length === 0 || words.length > MAX_COMMAND_WORDS) return null;
  const reps = repsIn(words);
  if (reps !== null) return { kind: 'reps', reps };
  const padded = ` ${text} `;
  return PHRASES.find(([phrase]) => padded.includes(` ${phrase} `))?.[1] ?? null;
}

/** Words the recognizer should expect: it hears them better. */
export const COMMAND_WORDS = ['fait', 'valide', 'plus tard', 'facile', 'juste bien', 'à fond', 'trop dur', 'on y va'];
