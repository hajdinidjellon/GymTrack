import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '@/stores/settingsStore';
import type { AppSettings } from '@/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const SETTINGS_KEY = '@gymtrack/settings';

const DEFAULTS: AppSettings = {
  units: 'kg',
  defaultRestTime: 5,
  restTimerEnabled: true,
  theme: 'system',
  notifications: true,
  language: 'fr',
  trainingMode: 'hypertrophy',
};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  useSettingsStore.setState({ settings: DEFAULTS, isLoaded: false });
});

describe('loadSettings', () => {
  it('sans storage : retombe sur les défauts et marque isLoaded', async () => {
    await useSettingsStore.getState().loadSettings();
    expect(useSettingsStore.getState().settings).toEqual(DEFAULTS);
    expect(useSettingsStore.getState().isLoaded).toBe(true);
  });

  it('fusionne un storage partiel avec les défauts (ajout de clé sans migration)', async () => {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ units: 'lbs' }));
    await useSettingsStore.getState().loadSettings();
    expect(useSettingsStore.getState().settings).toEqual({ ...DEFAULTS, units: 'lbs' });
  });

  it('JSON corrompu : retombe sur les défauts sans crash', async () => {
    await AsyncStorage.setItem(SETTINGS_KEY, '{pas du json');
    await useSettingsStore.getState().loadSettings();
    expect(useSettingsStore.getState().settings).toEqual(DEFAULTS);
    expect(useSettingsStore.getState().isLoaded).toBe(true);
  });
});

describe('updateSettings', () => {
  it('fusionne le patch et persiste en AsyncStorage', async () => {
    useSettingsStore.getState().updateSettings({ units: 'lbs', language: 'en' });

    expect(useSettingsStore.getState().settings).toMatchObject({
      units: 'lbs',
      language: 'en',
      theme: 'system', // le reste est conservé
    });

    // persistSettings est async : on laisse la microtask se résoudre
    await Promise.resolve();
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    expect(JSON.parse(raw!)).toMatchObject({ units: 'lbs', language: 'en' });
  });
});

describe('resetSettings', () => {
  it('restaure les défauts en mémoire et en storage', async () => {
    useSettingsStore.getState().updateSettings({ units: 'lbs', notifications: false });
    useSettingsStore.getState().resetSettings();

    expect(useSettingsStore.getState().settings).toEqual(DEFAULTS);
    await Promise.resolve();
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    expect(JSON.parse(raw!)).toEqual(DEFAULTS);
  });
});
