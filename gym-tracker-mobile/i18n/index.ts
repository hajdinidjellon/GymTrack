/**
 * I18N — every text the user reads or hears, in French (source) and English.
 * Pure TypeScript like domain/: the current language is set once by the
 * settings store, and the whole tree re-renders when it changes.
 */

import { en } from '@/i18n/en';
import { DAY_NAMES_EN, EXERCISE_NAMES_EN } from '@/i18n/exerciseNames';
import { fr, type Dictionary } from '@/i18n/fr';

export type Locale = 'fr' | 'en';
/** The user's choice in Profile. `auto` follows the phone. */
export type LanguageSetting = 'auto' | Locale;

export const LOCALES: Locale[] = ['fr', 'en'];

/** "1 série" / "3 séries": `count` picks the form. */
export interface Plural {
  one: string;
  other: string;
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string | Plural ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Every key of the dictionary, checked by TypeScript: "session.rest.title". */
export type TKey = Leaves<Dictionary>;

export type TParams = Record<string, string | number>;

const DICTIONARIES: Record<Locale, Dictionary> = { fr, en };

let current: Locale = 'fr';

export function setLocale(locale: Locale): void {
  current = locale;
}

export function getLocale(): Locale {
  return current;
}

/** "fr-FR", "en-US" → the closest language the app speaks. French when unknown. */
export function localeFromTag(tag: string | null | undefined): Locale {
  const lang = (tag ?? '').toLowerCase().split(/[-_]/)[0];
  return LOCALES.find((l) => l === lang) ?? 'fr';
}

export function resolveLocale(setting: LanguageSetting, deviceTag: string | null | undefined): Locale {
  return setting === 'auto' ? localeFromTag(deviceTag) : setting;
}

/** For toLocaleDateString and the speech engine. */
export function localeTag(locale: Locale = current): string {
  return locale === 'fr' ? 'fr-FR' : 'en-US';
}

function lookup(dict: Dictionary, key: string): string | Plural | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' || (typeof node === 'object' && node !== null && 'other' in node)
    ? (node as string | Plural)
    : undefined;
}

/** French keeps 0 and 1 singular, English only 1. */
function pluralForm(locale: Locale, count: number): keyof Plural {
  return (locale === 'fr' ? Math.abs(count) < 2 : Math.abs(count) === 1) ? 'one' : 'other';
}

/**
 * The text for a key, `{name}` replaced by the params. A plural entry needs
 * `count`. Falls back to French, then to the key itself.
 */
export function t(key: TKey, params?: TParams): string {
  const entry = lookup(DICTIONARIES[current], key) ?? lookup(fr, key);
  if (entry === undefined) return key;
  const text = typeof entry === 'string' ? entry : entry[pluralForm(current, Number(params?.count ?? 0))];
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

/** "a, b et c" / "a, b and c" */
export function listOf(items: string[]): string {
  if (items.length <= 1) return items.join('');
  const and = current === 'fr' ? 'et' : 'and';
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

/**
 * The name of a catalog exercise in the current language. Names stay French in
 * storage (history, settings keys): only what is shown changes. The user's own
 * exercises keep the name they typed.
 */
export function exerciseName(name: string): string {
  return nicknames[name] ?? catalogName(name);
}

/** The exercise's own name in the current language, whatever the user calls it. */
export function catalogName(name: string): string {
  return current === 'fr' ? name : (EXERCISE_NAMES_EN[name] ?? name);
}

// The user's own names for catalog exercises (`settings.exerciseNicknames`), in every language
let nicknames: Record<string, string> = {};

export function setExerciseNicknames(names: Record<string, string>): void {
  nicknames = names;
}

/** The name of a program day ("Haut", "Push"), stored in French like the exercises. */
export function dayName(name: string): string {
  return current === 'fr' ? name : (DAY_NAMES_EN[name] ?? name);
}
