/**
 * SETTINGS STORE — AsyncStorage (compatible Expo Go)
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_BAR, DEFAULT_PLATES } from '@/domain/plates';
import { settingsPatchSchema } from '@/domain/schemas';
import { logger } from '@/services/logger';
import type { AppSettings } from '@/types';

const SETTINGS_KEY = '@gymtrack/settings';

export const DEFAULT_SETTINGS: AppSettings = {
  units: 'kg',
  defaultRestTime: 90,
  restTimerEnabled: true,
  notifications: true,
  voice: true,
  barWeight: DEFAULT_BAR,
  plates: DEFAULT_PLATES,
  increments: {},
  signedOut: false,
};

export const REST_CHOICES = [60, 90, 120, 180];

/** Stored settings over the defaults. Anything unreadable falls back to the defaults. */
export function parseSettings(raw: string | null): AppSettings {
  if (!raw) return DEFAULT_SETTINGS;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
  const patch = settingsPatchSchema.safeParse(json);
  if (!patch.success) return DEFAULT_SETTINGS;
  const settings = { ...DEFAULT_SETTINGS, ...patch.data };
  // L'ancienne version avait un repos de 5 s pour le debug
  if (!REST_CHOICES.includes(settings.defaultRestTime)) settings.defaultRestTime = 90;
  return settings;
}

async function loadSettings(): Promise<AppSettings> {
  try {
    return parseSettings(await AsyncStorage.getItem(SETTINGS_KEY));
  } catch (error) {
    logger.warn('settings unreadable, using defaults', error);
    return DEFAULT_SETTINGS;
  }
}

async function persistSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    logger.warn('settings not saved', error);
  }
}

interface SettingsStore {
  settings: AppSettings;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setIncrement: (exerciseName: string, increment: number) => void;
  togglePlate: (plate: number) => void;
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
      void persistSettings(updated);
      return { settings: updated };
    });
  },

  setIncrement: (exerciseName, increment) => {
    get().updateSettings({ increments: { ...get().settings.increments, [exerciseName]: increment } });
  },

  togglePlate: (plate) => {
    const { plates } = get().settings;
    const next = plates.includes(plate) ? plates.filter((p) => p !== plate) : [...plates, plate];
    get().updateSettings({ plates: next.sort((a, b) => b - a) });
  },
}));
