/**
 * SETTINGS STORE — AsyncStorage (compatible Expo Go), sent to the cloud a moment after the last change.
 */

import { create } from 'zustand';
import { cleanNote } from '@/domain/notes';
import { addOwnDay, removeOwnDay, renameOwnDay } from '@/domain/ownDays';
import { removeOwnExercise, updateOwnExercise } from '@/domain/ownExercises';
import type { ExerciseDef } from '@/domain/programs';
import { applyRule } from '@/domain/ruleSync';
import { settingsPatchSchema } from '@/domain/schemas';
import { DEFAULT_SETTINGS, hasOwnSettings, syncedSettingsChanged } from '@/domain/settings';
import { resolveLocale, setLocale } from '@/i18n';
import { deviceLocaleTag } from '@/services/locale';
import { logger } from '@/services/logger';
import { readSettingsMeta, readSettingsRaw, writeSettings, writeSettingsMeta } from '@/services/settingsStorage';
import { queueSettingsSync } from '@/services/sync';
import type { AppSettings, CustomExercise, Goal, RuleOverride, SplitId } from '@/types';

export { DEFAULT_SETTINGS };

/** A slider or a run of taps sends one push, this long after the last change. */
export const SETTINGS_SYNC_DELAY_MS = 2000;

let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSettingsSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    queueSettingsSync().catch((error: unknown) => logger.warn('settings not queued for sync', error));
  }, SETTINGS_SYNC_DELAY_MS);
}

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
    return parseSettings(await readSettingsRaw());
  } catch (error) {
    logger.warn('settings unreadable, using defaults', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * A change not queued yet (app closed during the wait) goes now. Settings from before the
 * cloud kept them have no time: they are this phone's, stamped now and sent once.
 */
async function resumeSettingsSync(settings: AppSettings): Promise<void> {
  const meta = await readSettingsMeta();
  if (meta.pending) {
    scheduleSettingsSync();
  } else if (!meta.updatedAt && hasOwnSettings(settings)) {
    await writeSettingsMeta({ updatedAt: new Date().toISOString(), pending: true });
    scheduleSettingsSync();
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
    await resumeSettingsSync(settings).catch((error: unknown) => logger.warn('settings sync not resumed', error));
  },

  updateSettings: (patch) => {
    const before = get().settings;
    const updated = { ...before, ...patch };
    applyLanguage(updated);
    set({ settings: updated });
    // Only what the cloud keeps is stamped and sent: a theme change stays on this phone
    if (syncedSettingsChanged(before, updated)) {
      void writeSettings(updated, { updatedAt: new Date().toISOString(), pending: true });
      scheduleSettingsSync();
    } else {
      void writeSettings(updated);
    }
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
