/**
 * STOCKAGE SÉCURISÉ POUR LA SESSION SUPABASE
 *
 * Pattern officiel Supabase (« LargeSecureStore ») :
 * - une clé AES-256 aléatoire par entrée, stockée dans SecureStore
 *   (Keychain iOS / Keystore Android)
 * - la valeur chiffrée en AES-CTR, stockée dans AsyncStorage
 *
 * Pourquoi pas SecureStore directement ? Sa limite est ~2 Ko par entrée
 * et une session Supabase (JWT access + refresh) peut dépasser.
 * Sans la clé du Keychain, le blob AsyncStorage est illisible.
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';

class LargeSecureStore {
  private async encrypt(key: string, value: string): Promise<string> {
    const encryptionKey = Crypto.getRandomBytes(32);

    const cipher = new aesjs.ModeOfOperation.ctr(
      encryptionKey,
      new aesjs.Counter(1),
    );
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    await SecureStore.setItemAsync(
      key,
      aesjs.utils.hex.fromBytes(encryptionKey),
    );

    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async decrypt(key: string, value: string): Promise<string | null> {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return null;

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));

    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    try {
      return await this.decrypt(key, encrypted);
    } catch (err) {
      // Blob corrompu ou clé perdue (restore de backup…) → session invalide,
      // l'utilisateur devra se reconnecter. Ne jamais throw ici : Supabase
      // traiterait l'erreur comme fatale au démarrage.
      console.warn('[secureStorage] decrypt failed, dropping session', err);
      await this.removeItem(key);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await this.encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }
}

export const largeSecureStore = new LargeSecureStore();
