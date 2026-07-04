/**
 * COMPTE UTILISATEUR — export des données (portabilité RGPD)
 * et suppression de compte (exigence Apple 5.1.1(v) / Google + RGPD).
 *
 * L'export lit uniquement le LOCAL (source de vérité offline-first).
 * La suppression efface : lignes Supabase → utilisateur auth (RPC) →
 * données locales → session. L'ordre garantit qu'un échec cloud
 * n'efface pas le local (l'utilisateur peut réessayer).
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadWorkoutsLocal,
  loadProfileLocal,
  loadPlansLocal,
  loadGoalsLocal,
  wipeAllLocalData,
} from '@/lib/db';
import {
  supabase,
  getCurrentUserId,
  isSupabaseConfigured,
  signOut,
} from '@/lib/supabase';
import { useSettingsStore } from '@/stores/settingsStore';

// ============================================================
// EXPORT — JSON partageable (RGPD : droit à la portabilité)
// ============================================================

export async function exportAllData(): Promise<void> {
  const [workouts, profile, plans, goals] = await Promise.all([
    loadWorkoutsLocal(),
    loadProfileLocal(),
    loadPlansLocal(),
    loadGoalsLocal(),
  ]);

  const payload = {
    app: 'GymTrack',
    exportedAt: new Date().toISOString(),
    schemaVersion: 3,
    settings: useSettingsStore.getState().settings,
    profile,
    workouts,
    plans,
    goals,
  };

  const fileName = `gymtrack-export-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.write(JSON.stringify(payload, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'GymTrack — export de données',
    });
  } else {
    throw new Error('Sharing unavailable on this device');
  }
}

// ============================================================
// SUPPRESSION DE COMPTE
// ============================================================

export interface DeleteAccountResult {
  /** true si les données cloud ET le compte auth ont été supprimés
   *  (toujours true en mode 100 % local, où il n'y a rien côté cloud) */
  cloudDeleted: boolean;
}

export async function deleteAccount(): Promise<DeleteAccountResult> {
  let cloudDeleted = true;

  // 1. Cloud d'abord : si ça échoue, on s'arrête AVANT d'effacer le local
  //    pour que l'utilisateur puisse réessayer sans perdre sa copie.
  if (isSupabaseConfigured()) {
    const userId = await getCurrentUserId();
    if (userId) {
      const tables = ['workouts', 'plans', 'goals', 'profiles'] as const;
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq('user_id', userId);
        if (error) {
          throw new Error(`[account] cloud delete failed on ${table}: ${error.message}`);
        }
      }

      // Suppression de l'utilisateur auth via RPC SECURITY DEFINER
      // (fonction delete_user() — voir supabase/setup.sql).
      const { error: rpcError } = await supabase.rpc('delete_user');
      if (rpcError) {
        // Les données sont supprimées mais le compte auth subsiste :
        // on continue (le local doit partir quand même) et on le signale.
        console.warn('[account] delete_user RPC failed:', rpcError.message);
        cloudDeleted = false;
      }

      await signOut().catch(() => null);
    }
  }

  // 2. Local : données métier + préférences + session/badges (AsyncStorage)
  await wipeAllLocalData();
  await AsyncStorage.clear();
  useSettingsStore.getState().resetSettings();

  return { cloudDeleted };
}
