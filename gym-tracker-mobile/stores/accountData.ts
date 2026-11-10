/**
 * ACCOUNT DATA ON THIS PHONE — after a sign-in: the cloud sorted out, then every store read
 * again. After a sign-out or an account deletion: nothing of the account left behind.
 */

import { DEFAULT_SETTINGS, perDeviceSettings } from '@/domain/settings';
import { setExerciseNicknames } from '@/i18n';
import { readDataOwner, writeDataOwner, writeLastPull } from '@/services/dataOwner';
import { countPendingSync, wipeLocalData } from '@/services/db';
import { writeSettings } from '@/services/settingsStorage';
import { getCurrentUserId, signOut } from '@/services/supabase';
import { flushSyncQueue, initialSync, resumeSync } from '@/services/sync';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';

export async function loadAccountData(): Promise<void> {
  const userId = await getCurrentUserId().catch(() => null);
  if (userId) {
    // Another account's sessions on this phone: never sent to this one
    const owner = await readDataOwner();
    if (owner && owner !== userId) await clearLocalData();
    await writeDataOwner(userId);
  }
  // À l'inscription, ça envoie les séances déjà faites sur ce téléphone
  await initialSync().catch(() => null);
  await Promise.all([
    useWorkoutStore.getState().loadWorkouts(),
    useProfileStore.getState().loadProfile(),
    useSettingsStore.getState().loadSettings(),
  ]);
}

/** Sessions, profile, program and settings removed from this phone. The theme and language stay. */
export async function clearLocalData(): Promise<void> {
  await wipeLocalData();
  await writeLastPull(null);
  const device = { ...perDeviceSettings(useSettingsStore.getState().settings) };
  await writeSettings(device, { updatedAt: null, pending: false });
  useSessionStore.getState().discardSession();
  useWorkoutStore.setState({ workouts: [] });
  useProfileStore.setState({ profile: null });
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, ...device } });
  // The names this account gave its exercises are not the next one's
  setExerciseNicknames({});
}

/** What is still to send, after one last try. 0: everything is in the account. */
export async function pendingAfterSync(): Promise<number> {
  await flushSyncQueue().catch(() => null);
  return countPendingSync().catch(() => 0);
}

/** Signed out, and the account's data taken off this phone: the next account starts clean. */
export async function signOutAndClear(): Promise<void> {
  await signOut().catch(() => null);
  await clearLocalData();
  await writeDataOwner(null);
}

let resuming: Promise<void> | null = null;

/**
 * Opening the app, or back in it: what waits goes to the cloud, what changed there (another
 * phone) comes in, and the stores are read again when something did. Calls at the same time share one run.
 */
export function resumeAccountSync(): Promise<void> {
  resuming ??= (async () => {
    if (!(await resumeSync().catch(() => false))) return;
    await Promise.all([useWorkoutStore.getState().loadWorkouts(), useSettingsStore.getState().loadSettings()]);
  })().finally(() => {
    resuming = null;
  });
  return resuming;
}
