/**
 * SETTINGS — the defaults, and what of them follows the account to another phone.
 */

import { DEFAULT_BAR, DEFAULT_PLATES } from '@/domain/plates';
import type { AppSettings } from '@/types';

export const DEFAULT_SETTINGS: AppSettings = {
  units: 'kg',
  defaultRestTime: 90,
  restTimerEnabled: true,
  notifications: true,
  voice: true,
  voiceCommands: false,
  restBell: true,
  barWeight: DEFAULT_BAR,
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

/**
 * Kept on each phone, never sent to the cloud:
 * - signedOut: the state of this phone, not a choice;
 * - notifications, voiceCommands: they depend on this phone's permissions (and on the
 *   speech module, missing in Expo Go);
 * - theme, language: how this phone shows the app, `auto` follows this phone.
 * Everything else is the user's training (program days, sets and reps, rests, plates,
 * notes, voice and bell) and follows the account.
 */
export const PER_DEVICE_SETTINGS = [
  'signedOut',
  'notifications',
  'voiceCommands',
  'theme',
  'language',
] as const satisfies readonly (keyof AppSettings)[];

type PerDevice = (typeof PER_DEVICE_SETTINGS)[number];
export type SyncedSettings = Partial<Omit<AppSettings, PerDevice>>;

const isPerDevice = (key: string): key is PerDevice => (PER_DEVICE_SETTINGS as readonly string[]).includes(key);

/** What is sent to the cloud. */
export function syncedSettings(settings: Partial<AppSettings>): SyncedSettings {
  return Object.fromEntries(Object.entries(settings).filter(([key]) => !isPerDevice(key))) as SyncedSettings;
}

function perDeviceSettings(settings: Partial<AppSettings>): Partial<Pick<AppSettings, PerDevice>> {
  return Object.fromEntries(Object.entries(settings).filter(([key]) => isPerDevice(key)));
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** True when something the cloud keeps changed: a theme change sends nothing. */
export function syncedSettingsChanged(before: AppSettings, after: AppSettings): boolean {
  return !same(syncedSettings(before), syncedSettings(after));
}

/** Asked by the first-launch questions: a new phone has them too, they say nothing of the user's program. */
const FIRST_LAUNCH_SETTINGS: readonly (keyof AppSettings)[] = ['barWeight', 'plates'];

/** The user changed something of their training on this phone (a fresh install has not). */
export function hasOwnSettings(settings: Partial<AppSettings>): boolean {
  return Object.entries(syncedSettings(settings)).some(
    ([key, value]) =>
      !FIRST_LAUNCH_SETTINGS.includes(key as keyof AppSettings) &&
      !same(value, DEFAULT_SETTINGS[key as keyof AppSettings]),
  );
}

const time = (iso: string | null) => (iso ? Date.parse(iso) || 0 : 0);

/**
 * At sign-in, which copy to keep. A phone with nothing of its own takes the cloud;
 * otherwise the most recent change wins (the cloud on a tie).
 */
export function pickSettingsSource(input: {
  local: Partial<AppSettings>;
  localUpdatedAt: string | null;
  cloudUpdatedAt: string;
}): 'cloud' | 'local' {
  if (!hasOwnSettings(input.local)) return 'cloud';
  return time(input.cloudUpdatedAt) >= time(input.localUpdatedAt) ? 'cloud' : 'local';
}

/** The cloud's copy, with this phone's own settings kept. */
export function applyCloudSettings(local: Partial<AppSettings>, cloud: Partial<AppSettings>): Partial<AppSettings> {
  return { ...perDeviceSettings(local), ...syncedSettings(cloud) };
}
