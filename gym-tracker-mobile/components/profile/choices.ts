import type { AppSettings } from '@/types';
import { t, type LanguageSetting } from '@/i18n';

/** Language names are written in their own language, whatever the app speaks. */
export const LANGUAGES: { id: LanguageSetting; label: () => string; detail?: () => string }[] = [
  { id: 'auto', label: () => t('profile.language.auto'), detail: () => t('profile.language.autoHint') },
  { id: 'fr', label: () => 'Français' },
  { id: 'en', label: () => 'English' },
];

export const THEMES: { id: AppSettings['theme']; label: () => string; detail?: () => string }[] = [
  { id: 'auto', label: () => t('profile.appearance.auto'), detail: () => t('profile.appearance.hint') },
  { id: 'light', label: () => t('profile.appearance.light') },
  { id: 'dark', label: () => t('profile.appearance.dark') },
];

/** Short, for the Profile row: « Français », « Langue auto ». */
export function languageLabel(id: LanguageSetting): string {
  return id === 'auto' ? t('profile.settings.languageAuto') : (LANGUAGES.find((l) => l.id === id)?.label() ?? '');
}

/** Short, for the Profile row: « Clair », « Thème auto ». */
export function themeLabel(id: AppSettings['theme']): string {
  return id === 'auto' ? t('profile.settings.themeAuto') : (THEMES.find((x) => x.id === id)?.label() ?? '');
}
