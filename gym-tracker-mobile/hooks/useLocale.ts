import { getLocale, type Locale } from '@/i18n';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Re-renders the screen when the language changes. Every route calls it once,
 * at the top: the components below re-render with it.
 */
export function useLocale(): Locale {
  useSettingsStore((s) => s.settings.language);
  return getLocale();
}
