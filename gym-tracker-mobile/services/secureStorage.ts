/**
 * Stockage chiffré de la session Supabase.
 *
 * Le Keychain (expo-secure-store) est limité à ~2 Ko par valeur et une
 * session Supabase dépasse souvent. On suit donc la méthode recommandée
 * par Supabase : une clé AES-256 aléatoire dans le Keychain, la session
 * chiffrée (AES-CTR) dans AsyncStorage. Sans la clé du Keychain, le
 * contenu d'AsyncStorage est illisible.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import aesjs from 'aes-js';

async function encrypt(key: string, value: string): Promise<string> {
  const keyBytes = Crypto.getRandomBytes(32);
  const cipher = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(1));
  const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
  await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(keyBytes));
  return aesjs.utils.hex.fromBytes(encrypted);
}

async function decrypt(key: string, value: string): Promise<string | null> {
  const keyHex = await SecureStore.getItemAsync(key);
  if (!keyHex) return null;
  const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(keyHex), new aesjs.Counter(1));
  return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
}

/** Same interface as AsyncStorage, what supabase-js expects for `auth.storage`. */
export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    const value = await decrypt(key, encrypted).catch(() => null);
    // Ancienne session en clair (versions précédentes) ou illisible : on l'efface, il faudra se reconnecter
    if (value === null) await AsyncStorage.removeItem(key);
    return value;
  },
  async setItem(key: string, value: string): Promise<void> {
    // Nouvelle clé à chaque écriture : un même compteur CTR n'est jamais réutilisé avec la même clé
    const encrypted = await encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  },
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  },
};
