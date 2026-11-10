/**
 * SYNCHRO OFFLINE-FIRST
 *
 * 1. Toute écriture va d'abord en local (services/db.ts) avec une entrée dans sync_queue.
 * 2. flushSyncQueue envoie la file vers Supabase. Une entrée n'est retirée
 *    que si Supabase a confirmé : en cas d'erreur on réessaiera au prochain flush.
 * 3. À la connexion : les réglages d'abord (un téléphone neuf prend ceux du cloud, sinon le
 *    plus récent gagne), puis la file est envoyée et tout le reste relu depuis le cloud
 *    (le cloud gagne, sauf sur une séance modifiée ici et pas encore envoyée).
 *    domain/settings.ts dit quels réglages restent propres au téléphone.
 * 4. À l'ouverture et au retour dans l'app (resumeSync) : la file part, puis seules les séances
 *    changées dans le cloud depuis la dernière lecture arrivent (faites sur un autre téléphone).
 *
 * L'isolation entre utilisateurs est garantie par les policies RLS côté Supabase ;
 * on filtre quand même par user_id pour ne jamais dépendre d'elles seules.
 */

import { parseList, parseSettingsPatch, profileSchema, storedWorkoutSchema } from '@/domain/schemas';
import { applyCloudSettings, hasOwnSettings, pickSettingsSource, syncedSettings } from '@/domain/settings';
import {
  bulkInsertWorkouts,
  clearSettingsSyncQueue,
  clearSyncQueueEntry,
  enqueueSettingsSync,
  getPendingSyncQueue,
  loadProfileLocal,
  loadWorkoutById,
  markWorkoutSynced,
  saveProfileLocal,
  type SyncQueueEntry,
} from '@/services/db';
import { readLastPull, writeLastPull } from '@/services/dataOwner';
import { logger } from '@/services/logger';
import { readSettingsMeta, readStoredSettings, writeSettings, writeSettingsMeta } from '@/services/settingsStorage';
import { getCurrentUserId, isSupabaseConfigured, supabase } from '@/services/supabase';
import type { UserProfile, Workout } from '@/types';

/** supabase-js returns errors instead of throwing: turn them into exceptions. */
function check<T extends { error: { message: string } | null }>(result: T): T {
  if (result.error) throw new Error(result.error.message);
  return result;
}

let flushing: Promise<void> | null = null;

/** Sends the pending local changes. Calls made while a flush runs share it. */
export function flushSyncQueue(): Promise<void> {
  flushing ??= runFlush().finally(() => {
    flushing = null;
  });
  return flushing;
}

/** Failures in a row before the flush gives up for now: the network is down, no use going on. */
export const FLUSH_FAILURES_MAX = 3;

async function runFlush(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  // A refused entry holds back the later ones of the same record only (their order matters),
  // never the whole queue: one session the server refuses cannot stop every other one.
  const held = new Set<string>();
  let failures = 0;
  for (const entry of await getPendingSyncQueue()) {
    const record = `${entry.table_name}/${entry.record_id}`;
    if (held.has(record)) continue;
    try {
      await pushEntry(userId, entry);
      await clearSyncQueueEntry(entry.id);
      failures = 0;
    } catch (error) {
      logger.warn('sync entry failed, will retry', error);
      held.add(record);
      if (++failures >= FLUSH_FAILURES_MAX) return;
    }
  }
}

async function pushEntry(userId: string, entry: SyncQueueEntry): Promise<void> {
  const updated_at = new Date().toISOString();

  if (entry.table_name === 'workouts') {
    if (entry.operation === 'delete') {
      check(await supabase.from('workouts').delete().eq('id', entry.record_id).eq('user_id', userId));
      return;
    }
    const workout = await loadWorkoutById(entry.record_id);
    if (!workout) return;
    check(await supabase.from('workouts').upsert({ id: workout.id, user_id: userId, data: workout, updated_at }));
    await markWorkoutSynced(workout.id);
    return;
  }

  if (entry.table_name === 'user_settings') {
    await pushSettings(userId);
    return;
  }

  const raw = await loadProfileLocal();
  const profile = profileSchema.safeParse(raw);
  if (!profile.success) return;
  check(await supabase.from('profiles').upsert({ user_id: userId, data: profile.data, updated_at }));
}

interface SettingsRow {
  data: unknown;
  updated_at: string;
}

async function fetchSettingsRow(userId: string): Promise<SettingsRow | null> {
  const res = check(
    await supabase.from('user_settings').select('data, updated_at').eq('user_id', userId).maybeSingle(),
  );
  return res.data as SettingsRow | null;
}

/**
 * The settings as they are now, stamped with the time they changed on this phone.
 * A newer copy already in the cloud (from another phone) is left alone.
 */
async function pushSettings(userId: string): Promise<void> {
  const changedAt = (await readSettingsMeta()).updatedAt ?? new Date().toISOString();
  const cloud = await fetchSettingsRow(userId);
  if (cloud && Date.parse(cloud.updated_at) > Date.parse(changedAt)) return;
  const stored = await readStoredSettings();
  // Unreadable here: sending defaults would wipe the cloud copy of every other phone
  if (!stored) {
    logger.warn('settings not pushed: unreadable on this phone');
    return;
  }
  const data = syncedSettings(stored);
  check(await supabase.from('user_settings').upsert({ user_id: userId, data, updated_at: changedAt }));
}

/**
 * Settings at sign-in, before the queue goes: the cloud's copy is taken (and this phone's
 * waiting push dropped), or this phone's copy is queued for the cloud.
 */
async function syncSettingsAtSignIn(resuming = false): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;
  try {
    const row = await fetchSettingsRow(userId);
    // A cloud copy with nothing readable left is skipped: taking it would wipe this phone's
    const parsed = row ? parseSettingsPatch(row.data) : null;
    const cloud = parsed && Object.keys(syncedSettings(parsed)).length ? parsed : null;
    if (row && !cloud) logger.warn('cloud settings skipped: invalid data');
    const local = (await readStoredSettings()) ?? {};
    const meta = await readSettingsMeta();
    // Back in the app: only a copy changed since on another phone is taken; this phone's own
    // changes are already in the queue
    const newerInCloud = !!row && !!meta.updatedAt && Date.parse(row.updated_at) > Date.parse(meta.updatedAt);
    const takeCloud =
      row &&
      cloud &&
      (resuming
        ? newerInCloud
        : pickSettingsSource({ local, localUpdatedAt: meta.updatedAt, cloudUpdatedAt: row.updated_at }) === 'cloud');
    if (takeCloud) {
      await writeSettings(applyCloudSettings(local, cloud), { updatedAt: row.updated_at, pending: false });
      await clearSettingsSyncQueue();
      return true;
    }
    if (resuming) return false;
    // Nothing usable in the cloud, or this phone's copy is newer. A fresh install sends nothing:
    // its defaults would pass for a choice and win over a real program on the next phone.
    if (!hasOwnSettings(local)) {
      await clearSettingsSyncQueue();
      return false;
    }
    await enqueueSettingsSync();
    await writeSettingsMeta({ updatedAt: meta.updatedAt ?? new Date().toISOString(), pending: false });
  } catch (error) {
    // Cloud unreachable: the queue's push still checks the cloud's time before writing
    logger.warn('cloud settings not read', error);
  }
  return false;
}

export interface PullResult {
  workouts: Workout[];
  profile: UserProfile | null;
}

/** Rows per request: Supabase answers 1000 at most, a long history comes in pages. */
export const PULL_PAGE = 500;
/** Read again a little before the last pull: a phone whose clock is behind is not missed. */
const PULL_OVERLAP_MS = 10 * 60_000;

interface WorkoutRow {
  data: unknown;
  updated_at: string;
}

/** The user's sessions in the cloud, every page of them; with `since`, only those changed after. */
async function fetchWorkoutRows(userId: string, since: string | null): Promise<WorkoutRow[]> {
  const rows: WorkoutRow[] = [];
  for (let from = 0; ; from += PULL_PAGE) {
    let query = supabase.from('workouts').select('data, updated_at').eq('user_id', userId);
    if (since) query = query.gt('updated_at', since);
    const res = check(
      await query
        .order('updated_at')
        .order('id')
        .range(from, from + PULL_PAGE - 1),
    );
    const page = (res.data ?? []) as WorkoutRow[];
    rows.push(...page);
    if (page.length < PULL_PAGE) return rows;
  }
}

const newestOf = (rows: WorkoutRow[], current: string | null) =>
  rows.reduce<string | null>((max, r) => (!max || r.updated_at > max ? r.updated_at : max), current);

/** Everything the signed-in user has in the cloud, validated. */
export async function pullAllFromCloud(): Promise<PullResult | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  try {
    const [rows, profileRes] = await Promise.all([
      fetchWorkoutRows(userId, null),
      supabase.from('profiles').select('data').eq('user_id', userId).maybeSingle(),
    ]);
    check(profileRes);
    await writeLastPull(newestOf(rows, null));

    const { valid: workouts, rejected } = parseList(
      storedWorkoutSchema,
      rows.map((r) => r.data),
    );
    if (rejected) logger.warn(`${rejected} cloud workout(s) skipped: invalid data`);

    const profile = profileSchema.safeParse((profileRes.data as { data: unknown } | null)?.data);
    return { workouts, profile: profile.success ? profile.data : null };
  } catch (error) {
    logger.warn('pull from cloud failed', error);
    return null;
  }
}

/** At sign-in: settings sorted out, what is pending pushed, then the cloud copy taken. Reload the stores after. */
export async function initialSync(): Promise<PullResult | null> {
  if (!isSupabaseConfigured()) return null;
  await syncSettingsAtSignIn();
  await flushSyncQueue();
  const remote = await pullAllFromCloud();
  if (!remote) return null;

  await bulkInsertWorkouts(remote.workouts);
  if (remote.profile) await saveProfileLocal(remote.profile, { sync: false });
  return remote;
}

/**
 * Back in the app (or opening it) while signed in: what waits is sent, then the sessions
 * changed in the cloud since the last read are taken (done on another phone), and newer
 * settings from another phone too. True when something came from the cloud: read the stores again.
 */
export async function resumeSync(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const userId = await getCurrentUserId();
  if (!userId) return false;
  const settingsTaken = await syncSettingsAtSignIn(true);
  await flushSyncQueue();
  try {
    const last = await readLastPull();
    const since = last ? new Date(Date.parse(last) - PULL_OVERLAP_MS).toISOString() : null;
    const rows = await fetchWorkoutRows(userId, since);
    const { valid } = parseList(
      storedWorkoutSchema,
      rows.map((r) => r.data),
    );
    if (valid.length) await bulkInsertWorkouts(valid);
    await writeLastPull(newestOf(rows, last));
    return settingsTaken || valid.length > 0;
  } catch (error) {
    logger.warn('resume sync failed', error);
    return settingsTaken;
  }
}

/** A settings change, sent once the user stops touching them: the store calls it after a short wait. */
export async function queueSettingsSync(): Promise<void> {
  await enqueueSettingsSync();
  const meta = await readSettingsMeta();
  await writeSettingsMeta({ ...meta, pending: false });
  await flushSyncQueue();
}
