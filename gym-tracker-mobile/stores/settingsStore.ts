/**
 * SETTINGS STORE — AsyncStorage (compatible Expo Go)
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanNote } from '@/domain/notes';
import { addOwnDay, removeOwnDay, renameOwnDay } from '@/domain/ownDays';
import { removeOwnExercise, updateOwnExercise } from '@/domain/ownExercises';
import { DEFAULT_BAR, DEFAULT_PLATES } from '@/domain/plates';
import type { ExerciseDef } from '@/domain/programs';
import { applyRule } from '@/domain/ruleSync';
import { settingsPatchSchema } from '@/domain/schemas';
import { resolveLocale, setLocale } from '@/i18n';
import { deviceLocaleTag } from '@/services/locale';
import { logger } from '@/services/logger';
import type { AppSettings, CustomExercise, Goal, RuleOverride, SplitId } from '@/types';

// Kept from the app's first name: a new key would reset everyone's settings.
const SETTINGS_KEY = '@gymtrack/settings';

export const DEFAULT_SETTINGS: AppSettings = {
  units: 'kg',
  defaultRestTime: 90,
  restTimerEnabled: true,
  notifications: true,
  voice: true,
  voiceCommands: false,
  restBell: true,
  barWeight: DEFAULT_BAR,
  collarWeight: 0,
  plates: DEFAULT_PLATES,
  increments: {},
  customDays: {},
  ruleOverrides: {},
  restOverrides: {},
  customExercises: [],
  exerciseNotes: {},
  plateLoaded: {},
  countBothSides: false,
  signedOut: false,
  programSwitchDismissed: null,
  language: 'auto',
  theme: 'light',
  warmups: true,
  warmupOverrides: {},
  supersets: {},
  ownDays: {},
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

/** Sets the language every t() reads, before the tree re-renders. */
function applyLanguage(settings: AppSettings): void {
  setLocale(resolveLocale(settings.language, deviceLocaleTag()));
}

interface SettingsStore {
  settings: AppSettings;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setIncrement: (exerciseName: string, increment: number) => void;
  togglePlate: (plate: number) => void;
  /** Saves the exercises of a program day. `null` goes back to the program's list. */
  setDayExercises: (key: string, names: string[] | null) => void;
  /**
   * Own sets and reps for an exercise. `null` goes back to the goal's rule.
   * With `similar`, the similar exercises on the same rule follow.
   */
  setRule: (def: ExerciseDef, rule: RuleOverride | null, goal: Goal, similar: boolean) => void;
  /** Own rest for an exercise, in seconds. `null` goes back to the computed one. */
  setRestOverride: (exerciseName: string, seconds: number | null) => void;
  addCustomExercise: (exercise: CustomExercise) => void;
  /** Own note for an exercise. Empty text removes it. */
  setExerciseNote: (exerciseName: string, text: string) => void;
  /** Plates on each side or a weight stack. The catalog's answer is not stored. */
  setPlateLoaded: (def: ExerciseDef, on: boolean) => void;
  /** Warm-ups on or off for one exercise. Same as the global choice: nothing is stored. */
  setWarmups: (exerciseName: string, on: boolean) => void;
  /** An exercise the user created, changed (renamed: everything under its name follows). */
  updateCustomExercise: (from: string, next: CustomExercise) => void;
  /** An exercise the user created, removed from the list and from every day. */
  removeCustomExercise: (name: string) => void;
  /** A day added to the program, renamed, or removed. */
  addOwnDay: (split: SplitId, name: string) => void;
  renameOwnDay: (split: SplitId, from: string, to: string) => void;
  removeOwnDay: (split: SplitId, name: string) => void;
  /** Chains an exercise of a program day with the next one (superset), or unchains it. */
  toggleSuperset: (key: string, exerciseName: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    const settings = await loadSettings();
    applyLanguage(settings);
    set({ settings, isLoaded: true });
  },

  updateSettings: (patch) => {
    set((s) => {
      const updated = { ...s.settings, ...patch };
      applyLanguage(updated);
      void persistSettings(updated);
      return { settings: updated };
    });
  },

  setIncrement: (exerciseName, increment) => {
    get().updateSettings({ increments: { ...get().settings.increments, [exerciseName]: increment } });
  },

  setDayExercises: (key, names) => {
    const { [key]: _old, ...others } = get().settings.customDays;
    get().updateSettings({ customDays: names ? { ...others, [key]: names } : others });
  },

  setRule: (def, rule, goal, similar) => {
    const { customExercises: own, ruleOverrides: overrides } = get().settings;
    get().updateSettings({ ruleOverrides: applyRule(def, rule, { goal, own, overrides }, similar) });
  },

  setRestOverride: (exerciseName, seconds) => {
    const { [exerciseName]: _old, ...others } = get().settings.restOverrides;
    get().updateSettings({ restOverrides: seconds == null ? others : { ...others, [exerciseName]: seconds } });
  },

  addCustomExercise: (exercise) => {
    get().updateSettings({ customExercises: [...get().settings.customExercises, exercise] });
  },

  setExerciseNote: (exerciseName, text) => {
    const { [exerciseName]: _old, ...others } = get().settings.exerciseNotes;
    const note = cleanNote(text);
    get().updateSettings({ exerciseNotes: note ? { ...others, [exerciseName]: note } : others });
  },

  setPlateLoaded: (def, on) => {
    const { [def.name]: _old, ...others } = get().settings.plateLoaded;
    get().updateSettings({ plateLoaded: on === !!def.plateLoaded ? others : { ...others, [def.name]: on } });
  },

  setWarmups: (exerciseName, on) => {
    const { warmupOverrides, warmups } = get().settings;
    const { [exerciseName]: _old, ...others } = warmupOverrides;
    get().updateSettings({ warmupOverrides: on === warmups ? others : { ...others, [exerciseName]: on } });
  },

  updateCustomExercise: (from, next) => {
    get().updateSettings(updateOwnExercise(get().settings, from, next));
  },

  removeCustomExercise: (name) => {
    get().updateSettings(removeOwnExercise(get().settings, name));
  },

  addOwnDay: (split, name) => get().updateSettings(addOwnDay(get().settings, split, name)),
  renameOwnDay: (split, from, to) => get().updateSettings(renameOwnDay(get().settings, split, from, to)),
  removeOwnDay: (split, name) => get().updateSettings(removeOwnDay(get().settings, split, name)),

  toggleSuperset: (key, exerciseName) => {
    const { [key]: current = [], ...others } = get().settings.supersets;
    const next = current.includes(exerciseName)
      ? current.filter((n) => n !== exerciseName)
      : [...current, exerciseName];
    get().updateSettings({ supersets: next.length ? { ...others, [key]: next } : others });
  },

  togglePlate: (plate) => {
    const { plates } = get().settings;
    const next = plates.includes(plate) ? plates.filter((p) => p !== plate) : [...plates, plate];
    get().updateSettings({ plates: next.sort((a, b) => b - a) });
  },
}));
