/**
 * SAUVEGARDE — everything the app knows, in one JSON file the user keeps
 * (Files, mail, Drive…), and the way back. A restore is read through the
 * same zod schemas as the local data: a broken session is skipped, a file
 * from something else is refused.
 */

import { byDate } from '@/domain/history';
import { normalizeProfile } from '@/domain/profile';
import { parseList, settingsPatchSchema, workoutSchema } from '@/domain/schemas';
import type { AppSettings, UserProfile, Workout } from '@/types';

export const BACKUP_APP = 'gymtrack';
export const BACKUP_VERSION = 1;

export interface Backup {
  profile: UserProfile | null;
  workouts: Workout[];
  /** Over the defaults on restore: a field the file lacks keeps its current value. */
  settings: Partial<AppSettings>;
}

/** Device state, not the user's data: never in the file. */
type DeviceOnly = 'signedOut';

/** The file's content, pretty-printed so it stays readable. */
export function makeBackup(data: Backup, now: Date): string {
  const { signedOut: _s, ...settings } = data.settings;
  return JSON.stringify(
    {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: now.toISOString(),
      profile: data.profile,
      workouts: data.workouts,
      settings,
    },
    null,
    2,
  );
}

/** "gymtrack-2026-11-02.json", or ".csv" for the spreadsheet export. */
export function backupFileName(now: Date, extension: 'json' | 'csv' = 'json'): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${BACKUP_APP}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.${extension}`;
}

export type BackupError = 'notJson' | 'notBackup' | 'newerVersion';

export interface ParsedBackup extends Backup {
  /** Sessions that could not be read and were left out. */
  rejected: number;
}

/** A GymTrack backup, validated. Anything else: why it was refused. */
export function parseBackup(text: string): ParsedBackup | BackupError {
  let json: unknown;
  try {
    json = JSON.parse(text.replace(/^﻿/, ''));
  } catch {
    return 'notJson';
  }
  if (!json || typeof json !== 'object') return 'notBackup';
  const raw = json as Record<string, unknown>;
  if (raw.app !== BACKUP_APP || typeof raw.version !== 'number') return 'notBackup';
  if (raw.version > BACKUP_VERSION) return 'newerVersion';

  const { valid, rejected } = parseList(workoutSchema, Array.isArray(raw.workouts) ? raw.workouts : []);
  const settings = settingsPatchSchema.safeParse(raw.settings ?? {});
  const { signedOut: _s, ...restored } = settings.success ? settings.data : ({} as Partial<AppSettings>);
  return {
    profile: normalizeProfile(raw.profile),
    workouts: valid,
    settings: restored satisfies Partial<Omit<AppSettings, DeviceOnly>>,
    rejected,
  };
}

/** The sessions not there yet are added; newest first. A session already there is kept as is. */
export function mergeWorkouts(current: Workout[], incoming: Workout[]): { workouts: Workout[]; added: Workout[] } {
  const ids = new Set(current.map((w) => w.id));
  const added = incoming.filter((w) => !ids.has(w.id) && ids.add(w.id));
  return { workouts: byDate([...current, ...added]), added };
}
