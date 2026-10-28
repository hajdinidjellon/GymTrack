import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { secureSessionStorage } from '@/services/secureStorage';

jest.mock('expo-secure-store', () => {
  const keychain = new Map<string, string>();
  return {
    setItemAsync: jest.fn(async (k: string, v: string) => void keychain.set(k, v)),
    getItemAsync: jest.fn(async (k: string) => keychain.get(k) ?? null),
    deleteItemAsync: jest.fn(async (k: string) => void keychain.delete(k)),
  };
});

jest.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => Uint8Array.from({ length: n }, () => Math.floor(Math.random() * 256)),
}));

const KEY = 'sb-test-auth-token';
const session = JSON.stringify({ access_token: 'secret-token', user: { id: 'u1' } });

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('secureSessionStorage', () => {
  it('reads back what it wrote', async () => {
    await secureSessionStorage.setItem(KEY, session);
    expect(await secureSessionStorage.getItem(KEY)).toBe(session);
  });

  it('never leaves the session readable in AsyncStorage', async () => {
    await secureSessionStorage.setItem(KEY, session);
    const stored = await AsyncStorage.getItem(KEY);
    expect(stored).not.toContain('secret-token');
    expect(stored).toMatch(/^[0-9a-f]+$/);
  });

  it('uses a fresh key on every write', async () => {
    await secureSessionStorage.setItem(KEY, session);
    const first = await AsyncStorage.getItem(KEY);
    await secureSessionStorage.setItem(KEY, session);
    expect(await AsyncStorage.getItem(KEY)).not.toBe(first);
  });

  it('drops a plain-text session left by an older version', async () => {
    await AsyncStorage.setItem(KEY, session);
    expect(await secureSessionStorage.getItem(KEY)).toBeNull();
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
  });

  it('removes both halves on sign-out', async () => {
    await secureSessionStorage.setItem(KEY, session);
    await secureSessionStorage.removeItem(KEY);
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(KEY);
    expect(await secureSessionStorage.getItem(KEY)).toBeNull();
  });
});
