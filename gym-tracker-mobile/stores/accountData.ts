/**
 * After a sign-in (password, new password from a reset link): the cloud sorted out, then
 * every store read again from the phone.
 */

import { initialSync } from '@/services/sync';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';

export async function loadAccountData(): Promise<void> {
  // À l'inscription, ça envoie les séances déjà faites sur ce téléphone
  await initialSync().catch(() => null);
  await Promise.all([
    useWorkoutStore.getState().loadWorkouts(),
    useProfileStore.getState().loadProfile(),
    useSettingsStore.getState().loadSettings(),
  ]);
}
