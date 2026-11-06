/**
 * SETTINGS ON DISK — AsyncStorage (works in Expo Go). The settings, plus when they last
 * changed: the cloud sync needs the time to tell which copy is the most recent.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingsPatchSchema, settingsSyncMetaSchema } from '@/domain/schemas';
import { logger } from '@/services/logger';
import type { AppSettings } from '@/types';

// Kept from the app's first name: a new key would reset everyone's settings.
const SETTINGS_KEY = '@gymtrack/settings';
const SYNC_META_KEY = '@gymtrack/settings-sync';

export interface SettingsSyncMeta {
  /** Last change of a synced setting on this phone, or the cloud copy's time once taken. */
  updatedAt: string | null;
  /** Changed, not in the sync queue yet (the push waits a moment: a slider sends one). */
  pending: boolean;
}

const NO_META: SettingsSyncMeta = { updatedAt: null, pending: false };

export async function readSettingsRaw(): Promise<string | null> {
  return AsyncStorage.getItem(SETTINGS_KEY);
}

/** The stored settings, validated. Nothing readable: empty. */
export async function readStoredSettings(): Promise<Partial<AppSettings>> {
  try {
    const raw = await readSettingsRaw();
    const patch = settingsPatchSchema.safeParse(raw ? JSON.parse(raw) : {});
    return patch.success ? patch.data : {};
  } catch {
    return {};
  }
}

export async function readSettingsMeta(): Promise<SettingsSyncMeta> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_META_KEY);
    const meta = settingsSyncMetaSchema.safeParse(raw ? JSON.parse(raw) : null);
    return meta.success ? meta.data : NO_META;
  } catch {
    return NO_META;
  }
}

/** The settings, and the sync time with them when given: both or neither. */
export async function writeSettings(settings: Partial<AppSettings>, meta?: SettingsSyncMeta): Promise<void> {
  try {
    const pairs: [string, string][] = [[SETTINGS_KEY, JSON.stringify(settings)]];
    if (meta) pairs.push([SYNC_META_KEY, JSON.stringify(meta)]);
    await AsyncStorage.multiSet(pairs);
  } catch (error) {
    logger.warn('settings not saved', error);
  }
}

export async function writeSettingsMeta(meta: SettingsSyncMeta): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch (error) {
    logger.warn('settings sync time not saved', error);
  }
}
