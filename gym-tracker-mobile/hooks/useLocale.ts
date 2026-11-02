import { useColorScheme } from 'react-native';
import { setColorScheme, type ColorScheme } from '@/constants/theme';
import { getLocale, type Locale } from '@/i18n';
import { useSettingsStore } from '@/stores/settingsStore';
import type { AppSettings } from '@/types';

/** Light or dark: the user's choice, else the phone's. */
export function resolveScheme(theme: AppSettings['theme'], system: string | null | undefined): ColorScheme {
  if (theme !== 'auto') return theme;
  return system === 'dark' ? 'dark' : 'light';
}

/**
 * Light or dark mode, applied before the children read `colors`. Follows
 * the phone when set to automatic.
 */
export function useAppearance(): ColorScheme {
  const theme = useSettingsStore((s) => s.settings.theme);
  const system = useColorScheme();
  const scheme = resolveScheme(theme, system);
  // Idempotent: the same value each render, set before anything below reads a colour
  setColorScheme(scheme);
  return scheme;
}

/**
 * Re-renders the screen when the language or the appearance changes. Every
 * route calls it once, at the top: the components below re-render with it.
 */
export function useLocale(): Locale {
  useSettingsStore((s) => s.settings.language);
  useAppearance();
  return getLocale();
}
