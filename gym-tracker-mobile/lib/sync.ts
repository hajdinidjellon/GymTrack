/**
 * SYNC OFFLINE-FIRST
 *
 * Stratégie :
 * 1. Toute écriture va en local immédiatement → UX sans latence
 * 2. Un worker en arrière-plan vide la sync_queue vers Supabase
 * 3. Au login/retour en ligne : pull complet + merge (cloud gagne sur les conflits)
 * 4. Connectivité via NetInfo (pas de requête sonde) ; le listener
 *    startSyncConnectivityListener() draine la queue au retour en ligne
 */

import NetInfo from '@react-native-community/netinfo';
import { supabase, getCurrentUserId, isSupabaseConfigured } from '@/lib/supabase';
import {
  loadWorkoutsLocal,
  loadProfileLocal,
  loadPlansLocal,
  loadGoalsLocal,
  bulkInsertWorkouts,
  saveProfileLocal,
  getPendingSyncQueue,
  clearSyncQueueEntry,
  markWorkoutSynced,
  loadWorkoutById,
} from '@/lib/db';
import type {
  Workout,
  UserProfile,
  TrainingPlan,
  TrainingGoal,
} from '@/types';

// ============================================================
// HELPERS
// ============================================================

async function isOnline(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  } catch {
    return false;
  }
}

/**
 * Draine la sync_queue dès que la connexion revient.
 * À démarrer une seule fois au boot (app/_layout.tsx) ; retourne l'unsubscribe.
 */
export function startSyncConnectivityListener(): () => void {
  if (!isSupabaseConfigured()) return () => undefined;

  let wasConnected: boolean | null = null;
  return NetInfo.addEventListener((state) => {
    const connected = state.isConnected === true;
    // Ne flush qu'à la TRANSITION offline → online (pas à chaque event)
    if (connected && wasConnected === false) {
      flushSyncQueue().catch((err) =>
        console.warn('[sync] flush on reconnect failed:', err),
      );
    }
    wasConnected = connected;
  });
}

// ============================================================
// SYNC QUEUE WORKER — vide les ops en attente
// ============================================================

export async function flushSyncQueue(): Promise<void> {
  const online = await isOnline();
  if (!online) return;

  const userId = await getCurrentUserId();
  if (!userId) return;

  const queue = await getPendingSyncQueue();

  for (const entry of queue) {
    try {
      if (entry.operation === 'upsert') {
        await syncEntryToCloud(userId, entry.table_name, entry.record_id);
      } else {
        await deleteEntryFromCloud(userId, entry.table_name, entry.record_id);
      }
      await clearSyncQueueEntry(entry.id);
    } catch (err) {
      // L'entrée reste en queue : on réessaiera au prochain flush
      console.warn(
        `[sync] ${entry.operation} ${entry.table_name}/${entry.record_id} failed:`,
        err,
      );
    }
  }
}

async function syncEntryToCloud(
  userId: string,
  tableName: string,
  recordId: string,
): Promise<void> {
  if (tableName === 'workouts') {
    const workout = await loadWorkoutById(recordId);
    if (!workout) return;
    await supabase.from('workouts').upsert({
      id: workout.id,
      user_id: userId,
      data: workout,
      updated_at: new Date().toISOString(),
    });
    await markWorkoutSynced(workout.id);
  } else if (tableName === 'profiles') {
    const profile = await loadProfileLocal();
    if (!profile) return;
    await supabase.from('profiles').upsert({
      user_id: userId,
      data: profile,
      updated_at: new Date().toISOString(),
    });
  } else if (tableName === 'plans') {
    const plans = await loadPlansLocal();
    const plan = plans.find((p) => p.id === recordId);
    if (!plan) return;
    await supabase.from('plans').upsert({
      id: plan.id,
      user_id: userId,
      data: plan,
      updated_at: new Date().toISOString(),
    });
  } else if (tableName === 'goals') {
    const goals = await loadGoalsLocal();
    const goal = goals.find((g) => g.id === recordId);
    if (!goal) return;
    await supabase.from('goals').upsert({
      id: goal.id,
      user_id: userId,
      data: goal,
      updated_at: new Date().toISOString(),
    });
  }
}

async function deleteEntryFromCloud(
  userId: string,
  tableName: string,
  recordId: string,
): Promise<void> {
  if (tableName === 'workouts') {
    await supabase
      .from('workouts')
      .delete()
      .eq('id', recordId)
      .eq('user_id', userId);
  } else if (tableName === 'plans') {
    await supabase
      .from('plans')
      .delete()
      .eq('id', recordId)
      .eq('user_id', userId);
  } else if (tableName === 'goals') {
    await supabase
      .from('goals')
      .delete()
      .eq('id', recordId)
      .eq('user_id', userId);
  }
}

// ============================================================
// PULL COMPLET DEPUIS CLOUD → LOCAL
// ============================================================

export interface PullResult {
  workouts: Workout[];
  profile: UserProfile | null;
  plans: TrainingPlan[];
  goals: TrainingGoal[];
}

export async function pullAllFromCloud(): Promise<PullResult | null> {
  const online = await isOnline();
  if (!online) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  try {
    const [workoutsRes, profileRes, plansRes, goalsRes] = await Promise.all([
      supabase
        .from('workouts')
        .select('data')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('data')
        .eq('user_id', userId)
        .single(),
      supabase.from('plans').select('data').eq('user_id', userId),
      supabase.from('goals').select('data').eq('user_id', userId),
    ]);

    const workouts = (workoutsRes.data ?? []).map(
      (r: { data: Workout }) => r.data,
    );
    const profile: UserProfile | null =
      (profileRes.data as { data: UserProfile } | null)?.data ?? null;
    const plans = (plansRes.data ?? []).map(
      (r: { data: TrainingPlan }) => r.data,
    );
    const goals = (goalsRes.data ?? []).map(
      (r: { data: TrainingGoal }) => r.data,
    );

    return { workouts, profile, plans, goals };
  } catch (err) {
    console.warn('[sync] pullAllFromCloud failed:', err);
    return null;
  }
}

// ============================================================
// SYNC INITIAL — au login et au retour en ligne
// ============================================================

export async function initialSync(): Promise<PullResult | null> {
  // 1. Vide d'abord la queue locale (données en attente)
  await flushSyncQueue();

  // 2. Pull depuis cloud
  const remote = await pullAllFromCloud();
  if (!remote) return null;

  // 3. Merge : cloud gagne (source de vérité)
  await bulkInsertWorkouts(remote.workouts);
  if (remote.profile) await saveProfileLocal(remote.profile);

  return remote;
}

// ============================================================
// PUSH COMPLET LOCAL → CLOUD (premier sync après onboarding)
// ============================================================

export async function pushAllToCloud(): Promise<void> {
  const online = await isOnline();
  if (!online) return;

  const userId = await getCurrentUserId();
  if (!userId) return;

  const [workouts, profile, plans, goals] = await Promise.all([
    loadWorkoutsLocal(),
    loadProfileLocal(),
    loadPlansLocal(),
    loadGoalsLocal(),
  ]);

  try {
    if (workouts.length > 0) {
      await supabase.from('workouts').upsert(
        workouts.map((w) => ({
          id: w.id,
          user_id: userId,
          data: w,
          updated_at: new Date().toISOString(),
        })),
      );
    }
    if (profile) {
      await supabase.from('profiles').upsert({
        user_id: userId,
        data: profile,
        updated_at: new Date().toISOString(),
      });
    }
    if (plans.length > 0) {
      await supabase.from('plans').upsert(
        plans.map((p) => ({
          id: p.id,
          user_id: userId,
          data: p,
          updated_at: new Date().toISOString(),
        })),
      );
    }
    if (goals.length > 0) {
      await supabase.from('goals').upsert(
        goals.map((g) => ({
          id: g.id,
          user_id: userId,
          data: g,
          updated_at: new Date().toISOString(),
        })),
      );
    }
  } catch (err) {
    console.warn('[sync] pushAllToCloud failed:', err);
  }
}
