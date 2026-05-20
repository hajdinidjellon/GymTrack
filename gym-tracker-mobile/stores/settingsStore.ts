/**
 * SETTINGS STORE — AsyncStorage (compatible Expo Go)
 * Note: MMKV sera utilisé en production (build native) pour les perfs.
 * Pour switcher, remplacer AsyncStorage par MMKV ici uniquement.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings } from '@/types';

const SETTINGS_KEY = '@gymtrack/settings';

const DEFAULT_SETTINGS: AppSettings = {
  units: 'kg',
  defaultRestTime: 5,
  restTimerEnabled: true,
  theme: 'system',
  notifications: true,
  language: 'fr',
};

async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function persistSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Silencieux — les settings ne sont pas critiques
  }
}

interface SettingsStore {
  settings: AppSettings;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    const settings = await loadSettings();
    set({ settings, isLoaded: true });
  },

  updateSettings: (patch) => {
    set((s) => {
      const updated = { ...s.settings, ...patch };
      persistSettings(updated).catch(() => null);
      return { settings: updated };
    });
  },

  resetSettings: () => {
    persistSettings(DEFAULT_SETTINGS).catch(() => null);
    set({ settings: DEFAULT_SETTINGS });
  },
}));

// Helpers typés pour éviter des get() dans les composants
export const useUnits = () => useSettingsStore((s) => s.settings.units);
export const useRestTimerEnabled = () =>
  useSettingsStore((s) => s.settings.restTimerEnabled);
export const useDefaultRestTime = () =>
  useSettingsStore((s) => s.settings.defaultRestTime);
export const useTheme = () => useSettingsStore((s) => s.settings.theme);
export const useLanguage = () => useSettingsStore((s) => s.settings.language);
