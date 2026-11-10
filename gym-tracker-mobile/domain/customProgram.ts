/**
 * MON PROGRAMME — the user's own program: its name and every session's name are theirs
 * ("Journée A", "Pecs", "Cardio"). Built from nothing, or from another program whose days
 * it copies, exercises included, to rename as they like. The days are own days of the
 * `custom` program (`ownDays.custom`), so they are edited like any own day.
 */

import { NAME_MAX } from '@/domain/limits';
import { dayKey, programDays } from '@/domain/programs';
import { SETTINGS_LIMITS } from '@/domain/schemas';
import type { AppSettings, SplitId } from '@/types';

export const CUSTOM: SplitId = 'custom';

/** A session of the program being built: its name, and the day its exercises come from. */
export interface CustomDayDraft {
  name: string;
  /** The day it copies or keeps ("ppl" "Push", or "custom" "Journée A" once renamed). */
  source?: { split: SplitId; day: string };
}

export interface CustomProgramDraft {
  name: string;
  days: CustomDayDraft[];
}

type Settings = Pick<AppSettings, 'customDays' | 'ownDays' | 'supersets' | 'customExercises' | 'programName'>;

/** One clean line, at most NAME_MAX characters. */
export const cleanName = (raw: string): string => raw.trim().replace(/\s+/g, ' ').slice(0, NAME_MAX);

/** The days of another program, to start from: each keeps where its exercises come from. */
export function draftFrom(split: SplitId, settings: Settings): CustomDayDraft[] {
  return programDays(split, settings.customDays, settings.customExercises, settings.ownDays).map((d) => ({
    name: d.name,
    source: { split, day: d.name },
  }));
}

/** The program the user already has, as it stands, to edit. */
export function currentDraft(settings: Settings): CustomProgramDraft {
  return { name: settings.programName ?? '', days: draftFrom(CUSTOM, settings) };
}

export type DraftProblem = 'noDay' | 'emptyDay' | 'sameDay' | 'tooMany';

/** What keeps the program from being saved, if anything. The program's name may stay empty. */
export function draftProblem(draft: CustomProgramDraft): DraftProblem | null {
  const names = draft.days.map((d) => cleanName(d.name).toLowerCase());
  if (!names.length) return 'noDay';
  if (names.length > SETTINGS_LIMITS.ownDays) return 'tooMany';
  if (names.some((n) => !n)) return 'emptyDay';
  if (new Set(names).size !== names.length) return 'sameDay';
  return null;
}

const withoutProgram = <T>(record: Record<string, T>): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([key]) => !key.startsWith(`${CUSTOM}/`)));

/**
 * The settings of the program built: its name, its days in order, and each day's exercises
 * and supersets taken from the day it comes from. What the old version had goes. Sessions
 * already done stay in the history, and each exercise keeps its progression: it is the
 * exercise that progresses, not the day.
 */
export function customProgramSettings(settings: Settings, draft: CustomProgramDraft): Partial<AppSettings> {
  const days = draft.days.map((d) => ({ ...d, name: cleanName(d.name) }));
  const customDays = withoutProgram(settings.customDays);
  const supersets = withoutProgram(settings.supersets);
  for (const day of days) {
    if (!day.source) continue;
    const from = programDays(day.source.split, settings.customDays, settings.customExercises, settings.ownDays).find(
      (d) => d.name === day.source!.day,
    );
    if (from?.exercises.length) customDays[dayKey(CUSTOM, day.name)] = from.exercises.map((e) => e.name);
    const links = settings.supersets[dayKey(day.source.split, day.source.day)];
    if (links?.length) supersets[dayKey(CUSTOM, day.name)] = links;
  }
  const name = cleanName(draft.name);
  return {
    programName: name || null,
    ownDays: { ...settings.ownDays, [CUSTOM]: days.map((d) => d.name) },
    customDays,
    supersets,
  };
}
