import { describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readSettingsMeta, readStoredSettings, writeSettings, writeSettingsMeta } from '@/services/settingsStorage';

describe('settings storage', () => {
  it('writes the settings and their sync time together', async () => {
    await writeSettings({ voice: false }, { updatedAt: '2026-11-05T10:00:00.000Z', pending: true });
    expect(await readStoredSettings()).toEqual({ voice: false });
    expect(await readSettingsMeta()).toEqual({ updatedAt: '2026-11-05T10:00:00.000Z', pending: true });
  });

  it('keeps the sync time when only the settings are written', async () => {
    await writeSettingsMeta({ updatedAt: '2026-11-01T10:00:00.000Z', pending: false });
    await writeSettings({ theme: 'dark' });
    expect(await readSettingsMeta()).toEqual({ updatedAt: '2026-11-01T10:00:00.000Z', pending: false });
  });

  it('reads tampered or broken data as nothing', async () => {
    await AsyncStorage.setItem('@gymtrack/settings', '{oops');
    await AsyncStorage.setItem('@gymtrack/settings-sync', JSON.stringify({ updatedAt: 'never', pending: 'yes' }));
    expect(await readStoredSettings()).toEqual({});
    expect(await readSettingsMeta()).toEqual({ updatedAt: null, pending: false });
    await AsyncStorage.setItem('@gymtrack/settings', JSON.stringify({ barWeight: 'heavy' }));
    expect(await readStoredSettings()).toEqual({});
  });

  it('does not throw when the disk refuses', async () => {
    jest.spyOn(AsyncStorage, 'multiSet').mockRejectedValueOnce(new Error('full'));
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));
    await expect(writeSettings({ voice: true })).resolves.toBeUndefined();
    await expect(writeSettingsMeta({ updatedAt: null, pending: false })).resolves.toBeUndefined();
  });
});
