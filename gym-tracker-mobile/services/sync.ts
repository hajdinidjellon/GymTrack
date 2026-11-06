/**
 * SYNCHRO OFFLINE-FIRST
 *
 * 1. Toute écriture va d'abord en local (services/db.ts) avec une entrée dans sync_queue.
 * 2. flushSyncQueue envoie la file vers Supabase. Une entrée n'est retirée
 *    que si Supabase a confirmé : en cas d'erreur on réessaiera au prochain flush.
 * 3. À la connexion : les réglages d'abord (un téléphone neuf prend ceux du cloud, sinon le
 *    plus récent gagne), puis la file est envoyée et tout le reste relu depuis le cloud
 *    (le cloud gagne). domain/settings.ts dit quels réglages restent propres au téléphone.
 *
 * L'isolation entre utilisateurs est garantie par les policies RLS côté Supabase ;
 * on filtre quand même par user_id pour ne jamais dépendre d'elles seules.
 */

import { parseList, profileSchema, settingsPatchSchema, workoutSchema } from '@/domain/schemas';
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

async function runFlush(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  for (const entry of await getPendingSyncQueue()) {
    try {
      await pushEntry(userId, entry);
      await clearSyncQueueEntry(entry.id);
    } catch (error) {
      // Réseau coupé ou refus serveur : on garde l'entrée et on s'arrête là pour garder l'ordre.
      // Les réglages ne dépendent d'aucune autre entrée : leur refus ne bloque pas les séances.
      logger.warn('sync entry failed, will retry', error);
      if (entry.table_name !== 'user_settings') return;
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
  const data = syncedSettings(await readStoredSettings());
  check(await supabase.from('user_settings').upsert({ user_id: userId, data, updated_at: changedAt }));
}

/**
 * Settings at sign-in, before the queue goes: the cloud's copy is taken (and this phone's
 * waiting push dropped), or this phone's copy is queued for the cloud.
 */
async function syncSettingsAtSignIn(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  try {
    const row = await fetchSettingsRow(userId);
    const cloud = row ? settingsPatchSchema.safeParse(row.data) : null;
    if (cloud && !cloud.success) logger.warn('cloud settings skipped: invalid data');

    const local = await readStoredSettings();
    const meta = await readSettingsMeta();
    const takeCloud =
      row &&
      cloud?.success &&
      pickSettingsSource({ local, localUpdatedAt: meta.updatedAt, cloudUpdatedAt: row.updated_at }) === 'cloud';
    if (takeCloud) {
      await writeSettings(applyCloudSettings(local, cloud.data), { updatedAt: row.updated_at, pending: false });
      await clearSettingsSyncQueue();
      return;
    }
    // Nothing usable in the cloud, or this phone's copy is newer. A fresh install sends nothing:
    // its defaults would pass for a choice and win over a real program on the next phone.
    if (!hasOwnSettings(local)) {
      await clearSettingsSyncQueue();
      return;
    }
    await enqueueSettingsSync();
    await writeSettingsMeta({ updatedAt: meta.updatedAt ?? new Date().toISOString(), pending: false });
  } catch (error) {
    // Cloud unreachable: the queue's push still checks the cloud's time before writing
    logger.warn('cloud settings not read', error);
  }
}

export interface PullResult {
  workouts: Workout[];
  profile: UserProfile | null;
}

/** Everything the signed-in user has in the cloud, validated. */
export async function pullAllFromCloud(): Promise<PullResult | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  try {
    const [workoutsRes, profileRes] = await Promise.all([
      supabase.from('workouts').select('data').eq('user_id', userId),
      supabase.from('profiles').select('data').eq('user_id', userId).maybeSingle(),
    ]);
    check(workoutsRes);
    check(profileRes);

    const rows = (workoutsRes.data ?? []) as { data: unknown }[];
    const { valid: workouts, rejected } = parseList(
      workoutSchema,
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

/** A settings change, sent once the user stops touching them: the store calls it after a short wait. */
export async function queueSettingsSync(): Promise<void> {
  await enqueueSettingsSync();
  const meta = await readSettingsMeta();
  await writeSettingsMeta({ ...meta, pending: false });
  await flushSyncQueue();
}
