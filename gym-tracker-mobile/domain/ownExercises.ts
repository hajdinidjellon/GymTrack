/**
 * TES EXERCICES — renaming or removing an exercise the user created, and
 * everything the settings keep under its name. A renamed exercise keeps its
 * old name as an alias: the sessions already saved still match it.
 */

import type { AppSettings, CustomExercise } from '@/types';

type Settings = Pick<
  AppSettings,
  | 'customExercises'
  | 'customDays'
  | 'supersets'
  | 'ruleOverrides'
  | 'restOverrides'
  | 'increments'
  | 'exerciseNotes'
  | 'plateLoaded'
  | 'warmupOverrides'
  | 'manualProgression'
>;

function moveKey<T>(record: Record<string, T>, from: string, to: string | null): Record<string, T> {
  if (!(from in record)) return record;
  const { [from]: value, ...others } = record;
  return to === null ? others : { ...others, [to]: value as T };
}

function mapLists(record: Record<string, string[]>, fn: (list: string[]) => string[]): Record<string, string[]> {
  return Object.fromEntries(Object.entries(record).map(([key, list]) => [key, fn(list)]));
}

/** Everything stored under `from`, moved to `to` (null: removed). */
function rekey(settings: Settings, from: string, to: string | null): Partial<AppSettings> {
  const swap = (list: string[]) =>
    to === null ? list.filter((n) => n !== from) : list.map((n) => (n === from ? to : n));
  return {
    customDays: mapLists(settings.customDays, swap),
    supersets: mapLists(settings.supersets, swap),
    ruleOverrides: moveKey(settings.ruleOverrides, from, to),
    restOverrides: moveKey(settings.restOverrides, from, to),
    increments: moveKey(settings.increments, from, to),
    exerciseNotes: moveKey(settings.exerciseNotes, from, to),
    plateLoaded: moveKey(settings.plateLoaded, from, to),
    warmupOverrides: moveKey(settings.warmupOverrides, from, to),
    manualProgression: moveKey(settings.manualProgression, from, to),
  };
}

/** The settings once the exercise named `from` becomes `next` (a typo fixed, another muscle…). */
export function updateOwnExercise(settings: Settings, from: string, next: CustomExercise): Partial<AppSettings> {
  const old = settings.customExercises.find((e) => e.name === from);
  if (!old) return {};
  const renamed = next.name !== from;
  const aliases = [...(old.aliases ?? []), ...(renamed ? [from] : [])].filter((a) => a !== next.name);
  const updated: CustomExercise = { ...next, ...(aliases.length ? { aliases: [...new Set(aliases)] } : {}) };
  const customExercises = settings.customExercises.map((e) => (e.name === from ? updated : e));
  return renamed ? { ...rekey(settings, from, next.name), customExercises } : { customExercises };
}

/** The settings without this exercise: out of every day, its own settings gone. The history stays. */
export function removeOwnExercise(settings: Settings, name: string): Partial<AppSettings> {
  return {
    ...rekey(settings, name, null),
    customExercises: settings.customExercises.filter((e) => e.name !== name),
  };
}
