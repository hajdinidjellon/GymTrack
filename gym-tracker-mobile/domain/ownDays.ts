/**
 * TES SÉANCES — days the user adds to their program ("Épaules", "Haut B"),
 * renames or removes. Their exercises live in `customDays` like any day;
 * an empty day is listed to be filled, but never offered as a session.
 */

import { choosableDays, dayKey, NAME_MAX } from '@/domain/programs';
import { t } from '@/i18n';
import type { AppSettings, CustomExercise, SplitId } from '@/types';

type Settings = Pick<AppSettings, 'ownDays' | 'customDays' | 'supersets'> & { customExercises?: CustomExercise[] };

/** A clean day name, or why it cannot be used: empty, or already a day of a program. */
export function checkDayName(
  name: string,
  split: SplitId,
  settings: Settings,
  current?: string,
): string | { error: string } {
  const clean = name.trim().replace(/\s+/g, ' ').slice(0, NAME_MAX);
  if (!clean) return { error: t('domain.ownDays.nameEmpty') };
  const taken = choosableDays(split, settings.customDays, settings.customExercises, settings.ownDays).some(
    (d) => d.name.toLowerCase() === clean.toLowerCase() && d.name !== current,
  );
  return taken ? { error: t('domain.ownDays.nameTaken') } : clean;
}

const without = <T>(record: Record<string, T>, key: string): Record<string, T> => {
  const { [key]: _gone, ...others } = record;
  return others;
};

export function addOwnDay(settings: Settings, split: SplitId, name: string): Partial<AppSettings> {
  return { ownDays: { ...settings.ownDays, [split]: [...(settings.ownDays[split] ?? []), name] } };
}

/** Renamed: its exercises and supersets follow. Sessions done under the old name stay in the history. */
export function renameOwnDay(settings: Settings, split: SplitId, from: string, to: string): Partial<AppSettings> {
  const fromKey = dayKey(split, from);
  const toKey = dayKey(split, to);
  const move = <T>(record: Record<string, T>) =>
    fromKey in record ? { ...without(record, fromKey), [toKey]: record[fromKey] as T } : record;
  return {
    ownDays: { ...settings.ownDays, [split]: (settings.ownDays[split] ?? []).map((n) => (n === from ? to : n)) },
    customDays: move(settings.customDays),
    supersets: move(settings.supersets),
  };
}

export function removeOwnDay(settings: Settings, split: SplitId, name: string): Partial<AppSettings> {
  const key = dayKey(split, name);
  return {
    ownDays: { ...settings.ownDays, [split]: (settings.ownDays[split] ?? []).filter((n) => n !== name) },
    customDays: without(settings.customDays, key),
    supersets: without(settings.supersets, key),
  };
}
