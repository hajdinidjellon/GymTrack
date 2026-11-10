/**
 * WHOSE DATA — the account the sessions on this phone belong to. Data from before any account
 * goes to the first one that signs in; another account never receives it (stores/accountData.ts).
 * And up to when the cloud was last read: only what changed since is fetched (services/sync.ts).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/services/logger';

const OWNER_KEY = '@gymtrack/data-owner';
const LAST_PULL_KEY = '@gymtrack/last-pull';

export async function readDataOwner(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

export async function writeDataOwner(userId: string | null): Promise<void> {
  try {
    if (userId) await AsyncStorage.setItem(OWNER_KEY, userId);
    else await AsyncStorage.removeItem(OWNER_KEY);
  } catch (error) {
    logger.warn('data owner not saved', error);
  }
}

/** The newest cloud change already on this phone (the server's time), or null: read everything. */
export async function readLastPull(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_PULL_KEY);
  } catch {
    return null;
  }
}

export async function writeLastPull(iso: string | null): Promise<void> {
  try {
    if (iso) await AsyncStorage.setItem(LAST_PULL_KEY, iso);
    else await AsyncStorage.removeItem(LAST_PULL_KEY);
  } catch (error) {
    logger.warn('last pull time not saved', error);
  }
}
