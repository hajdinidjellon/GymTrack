/**
 * VOIX — ce que l'app dit pendant la séance : le texte, et les clips de la
 * voix enregistrée qui le disent (domain/voiceClips.ts). La lecture à voix
 * haute est dans services/speech.ts.
 */

import { LOADING_SUFFIX, loadingOf, missingPerSide, sidePlates, type Loading } from '@/domain/loading';
import { formatKg } from '@/domain/plates';
import type { Cursor } from '@/domain/sessionCursor';
import { clipIds, joinSpoken, spoken, type Spoken } from '@/domain/voiceClips';
import { isWarmup, setNumber } from '@/domain/warmup';
import { exerciseName, listOf, t } from '@/i18n';
import type { AppSettings, ActiveExercise } from '@/types';

const kilos = (n: number) => t('domain.voice.kilos', { kg: formatKg(n) });

/** All the clips, or none: one missing and the line is the phone's. */
const all = (ids: (string | null)[]): string[] | null => (ids.every(Boolean) ? (ids as string[]) : null);

/** The plates of one side grouped by kind, heaviest first: [20, 20, 5] → [[20, 2], [5, 1]]. */
function grouped(perSide: number[]): [number, number][] {
  const out: [number, number][] = [];
  for (const p of perSide) {
    const last = out[out.length - 1];
    if (last && last[0] === p) last[1]++;
    else out.push([p, 1]);
  }
  return out;
}

function platesClips(perSide: number[]): string[] | null {
  const groups = grouped(perSide);
  return all([
    clipIds.putOn(),
    ...groups.map(([kg, count], i) => clipIds.plate(kg, count, i > 0 && i === groups.length - 1)),
    clipIds.eachSide(),
  ]);
}

/** "Mets 20 et 1,25 de chaque côté." For the bar and the plate-loaded machines only. */
export function platesLine(cursor: Cursor, settings: Pick<AppSettings, 'barWeight' | 'plates'>): Spoken | null {
  const loading = loadingOf(cursor.exercise);
  if (loading !== 'bar' && loading !== 'perSide') return null;
  const perSide = sidePlates(loading, cursor.set.weight, settings);
  if (perSide.length === 0) return loading === 'bar' ? spoken(t('domain.voice.emptyBar'), [clipIds.emptyBar()]) : null;
  const missing = missingPerSide(loading, cursor.set.weight, settings);
  const line = t('domain.voice.plates', { plates: listOf(perSide.map(formatKg)) });
  // Ce qui manque est rare : la voix du téléphone le dit en entier
  if (missing > 0) return spoken(`${line} ${t('domain.voice.missing', { kg: formatKg(missing) })}`, null);
  return spoken(line, platesClips(perSide));
}

const SUFFIX_CLIP: Record<Loading, string | null> = {
  bar: null,
  perSide: clipIds.perSide(),
  perHand: clipIds.perHand(),
  stack: null,
};

/** The last working set of the exercise: said « Dernière série ! » instead of its number. */
function isLastWorkingSet(exercise: Pick<ActiveExercise, 'sets'>, index: number): boolean {
  const set = exercise.sets[index];
  if (!set || isWarmup(set) || set.setType === 'drop') return false;
  return !exercise.sets.some((s, i) => i > index && !isWarmup(s) && s.setType !== 'drop' && !s.completed);
}

/** "Série 2. 62,5 kilos, 10 reps.", "Série 1. 12 kilos par haltère, 10 reps." or "Échauffement 1. 20 kilos, 10 reps." */
export function setLine(cursor: Cursor): Spoken {
  const { set, setIndex } = cursor;
  const { warmup, drop, n, total } = setNumber(cursor.exercise.sets, setIndex);
  const loading = loadingOf(cursor.exercise);
  const suffix = LOADING_SUFFIX[loading];
  const timed = !!cursor.exercise.timed;
  const last = !warmup && !drop && total > 1 && isLastWorkingSet(cursor.exercise, setIndex);
  const head = warmup ? clipIds.warmup(n) : drop ? clipIds.drop() : last ? clipIds.lastSet(n) : clipIds.set(n);
  const count = timed ? clipIds.seconds(set.reps) : clipIds.reps(set.reps);
  if (set.weight <= 0) {
    const key = last
      ? timed
        ? 'domain.voice.lastSeconds'
        : 'domain.voice.lastReps'
      : timed
        ? 'domain.voice.setSeconds'
        : 'domain.voice.setReps';
    return spoken(t(key, { n, reps: set.reps }), all([head, count]));
  }
  const load = `${kilos(set.weight)}${suffix ? ` ${suffix}` : ''}`;
  const key = warmup
    ? 'domain.voice.warmupLoad'
    : drop
      ? 'domain.voice.dropLoad'
      : last
        ? timed
          ? 'domain.voice.lastLoadSeconds'
          : 'domain.voice.lastLoad'
        : timed
          ? 'domain.voice.setLoadSeconds'
          : 'domain.voice.setLoad';
  const suffixClip = SUFFIX_CLIP[loading];
  return spoken(
    t(key, { n, load, reps: set.reps }),
    all([head, clipIds.weight(set.weight), ...(suffixClip ? [suffixClip] : []), count]),
  );
}

/** Straight to the next set, no rest in between (warm-ups): the plates first, then the set. */
export function nextSetLine(cursor: Cursor, settings: Pick<AppSettings, 'barWeight' | 'plates'>): Spoken {
  return joinSpoken(platesLine(cursor, settings), setLine(cursor));
}

/** Said while resting, as soon as the next set is a new exercise. The user's note on it comes last. */
export function nextExerciseLine(
  cursor: Cursor,
  settings: Pick<AppSettings, 'barWeight' | 'plates'> & Partial<Pick<AppSettings, 'exerciseNotes'>>,
): Spoken {
  const { name, needsWeight } = cursor.exercise;
  const what = needsWeight
    ? spoken(t('domain.voice.pickStart'), [clipIds.pickStart()])
    : (platesLine(cursor, settings) ?? setLine(cursor));
  const note = settings.exerciseNotes?.[name]?.replace(/[.!?…]+$/, '');
  const head = spoken(t('domain.voice.nextExercise', { name: exerciseName(name) }), all([clipIds.nextExercise(name)]));
  const line = joinSpoken(head, what);
  return note ? { ...line, text: `${line.text} ${t('domain.voice.note', { note })}`, tail: t('domain.voice.note', { note }) } : line;
}

/** The end of a rest. `variant` picks one of the recorded ways to say « C'est reparti ». */
export function restOverLine(cursor: Cursor, variant = 0): Spoken {
  const set = setLine(cursor);
  return spoken(t('domain.voice.restOver', { set: set.text }), set.clips && [clipIds.restOver(variant), ...set.clips]);
}

/** Right after a set, when the rest starts: how many working sets are left on this exercise. */
export function setsLeftLine(exercise: Pick<ActiveExercise, 'sets'>): Spoken | null {
  const left = exercise.sets.filter((s) => !isWarmup(s) && s.setType !== 'drop' && !s.completed).length;
  if (left < 1) return null;
  return spoken(t('domain.voice.setsLeft', { count: left }), all([clipIds.setsLeft(left)]));
}

/** The last set of the session is in. */
export function sessionDoneLine(variant = 0): Spoken {
  return spoken(t('domain.voice.sessionDone'), [clipIds.sessionDone(variant)]);
}

export const holdGoLine = (): Spoken => spoken(t('domain.voice.holdGo'), [clipIds.holdGo()]);

export const voiceHelloLine = (): Spoken => spoken(t('profile.during.voiceHello'), [clipIds.voiceHello()]);
