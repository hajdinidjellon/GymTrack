/**
 * SYNCHRO OFFLINE-FIRST
 *
 * 1. Toute écriture va d'abord en local (services/db.ts) avec une entrée dans sync_queue.
 * 2. flushSyncQueue envoie la file vers Supabase. Une entrée n'est retirée
 *    que si Supabase a confirmé : en cas d'erreur on réessaiera au prochain flush.
 * 3. À la connexion : file envoyée, puis tout est relu depuis le cloud (le cloud gagne).
 *
 * L'isolation entre utilisateurs est garantie par les policies RLS côté Supabase ;
 * on filtre quand même par user_id pour ne jamais dépendre d'elles seules.
 */

import { parseList, profileSchema, workoutSchema } from '@/domain/schemas';
import {
  bulkInsertWorkouts,
  clearSyncQueueEntry,
  getPendingSyncQueue,
  loadProfileLocal,
  loadWorkoutById,
  markWorkoutSynced,
  saveProfileLocal,
  type SyncQueueEntry,
} from '@/services/db';
import { logger } from '@/services/logger';
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
      // Réseau coupé ou refus serveur : on garde l'entrée et on s'arrête là pour garder l'ordre
      logger.warn('sync entry failed, will retry', error);
      return;
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

  const raw = await loadProfileLocal();
  const profile = profileSchema.safeParse(raw);
  if (!profile.success) return;
  check(await supabase.from('profiles').upsert({ user_id: userId, data: profile.data, updated_at }));
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

/** At sign-in: push what is pending, then take the cloud copy. */
export async function initialSync(): Promise<PullResult | null> {
  if (!isSupabaseConfigured()) return null;
  await flushSyncQueue();
  const remote = await pullAllFromCloud();
  if (!remote) return null;

  await bulkInsertWorkouts(remote.workouts);
  if (remote.profile) await saveProfileLocal(remote.profile, { sync: false });
  return remote;
}
