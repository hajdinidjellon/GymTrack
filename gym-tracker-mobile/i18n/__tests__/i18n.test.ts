import { afterEach, describe, expect, it } from '@jest/globals';
import {
  exerciseName,
  getLocale,
  listOf,
  localeFromTag,
  localeTag,
  resolveLocale,
  setLocale,
  t,
  type TKey,
} from '@/i18n';
import { en } from '@/i18n/en';
import { fr } from '@/i18n/fr';

afterEach(() => setLocale('fr'));

/** Every leaf path of a dictionary, with its kind. */
function leaves(node: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = `${prefix}${key}`;
    if (typeof value === 'string') out.set(path, 'text');
    else if (value && typeof value === 'object' && 'other' in value) out.set(path, 'plural');
    else for (const [k, v] of leaves(value, `${path}.`)) out.set(k, v);
  }
  return out;
}

/** "{name}" placeholders of a text or a plural. */
function placeholders(node: unknown, path: string): string[] {
  let value: unknown = node;
  for (const part of path.split('.')) value = (value as Record<string, unknown>)[part];
  const text = typeof value === 'string' ? value : Object.values(value as object).join(' ');
  return [...new Set(text.match(/\{\w+\}/g) ?? [])].sort();
}

describe('dictionaries', () => {
  it('English has every French key, of the same kind', () => {
    expect(leaves(en)).toEqual(leaves(fr));
  });

  it('English keeps the same placeholders', () => {
    for (const path of leaves(fr).keys())
      expect([path, placeholders(en, path)]).toEqual([path, placeholders(fr, path)]);
  });

  it('no text is left empty', () => {
    const texts = (node: unknown): string[] =>
      typeof node === 'string' ? [node] : Object.values(node as object).flatMap(texts);
    for (const text of [...texts(fr), ...texts(en)]) expect(text.trim()).not.toBe('');
  });
});

describe('t', () => {
  const key = (k: string) => k as TKey;

  it('falls back to the key when it does not exist', () => {
    expect(t(key('nope.nothing'))).toBe('nope.nothing');
  });

  it('replaces the params', () => {
    expect(t('common.sets', { count: 3 })).toBe('3 séries');
    expect(t('common.validate', { unused: 1 })).toBe('Valider');
  });

  it('picks the plural form of the language', () => {
    expect(t('common.sets', { count: 0 })).toBe('0 série');
    expect(t('common.sets', { count: 1 })).toBe('1 série');
    setLocale('en');
    expect(t('common.sets', { count: 0 })).toBe('0 sets');
    expect(t('common.sets', { count: 1 })).toBe('1 set');
    expect(t('common.sets')).toBe('{count} sets');
  });

  it('keeps an unknown placeholder as it is', () => {
    expect(t('common.sets', { other: 2 })).toBe('{count} série');
  });

  it('switches language', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    setLocale('fr');
    expect(getLocale()).toBe('fr');
  });
});

describe('locale', () => {
  it.each([
    ['fr-FR', 'fr'],
    ['en_US', 'en'],
    ['EN', 'en'],
    ['de-DE', 'fr'],
    [null, 'fr'],
    [undefined, 'fr'],
  ] as const)('%s → %s', (tag, locale) => {
    expect(localeFromTag(tag)).toBe(locale);
  });

  it('follows the phone on auto, else the choice', () => {
    expect(resolveLocale('auto', 'en-GB')).toBe('en');
    expect(resolveLocale('fr', 'en-GB')).toBe('fr');
    expect(resolveLocale('en', 'fr-FR')).toBe('en');
  });

  it('gives a tag for dates and the voice', () => {
    expect(localeTag('fr')).toBe('fr-FR');
    expect(localeTag('en')).toBe('en-US');
    setLocale('en');
    expect(localeTag()).toBe('en-US');
  });
});

describe('listOf', () => {
  it('joins with the language word', () => {
    expect(listOf([])).toBe('');
    expect(listOf(['a'])).toBe('a');
    expect(listOf(['a', 'b', 'c'])).toBe('a, b et c');
    setLocale('en');
    expect(listOf(['a', 'b'])).toBe('a and b');
  });
});

describe('exerciseName', () => {
  it('keeps the stored name in French and for unknown exercises', () => {
    expect(exerciseName('Développé couché')).toBe('Développé couché');
    setLocale('en');
    expect(exerciseName('Mon exercice à moi')).toBe('Mon exercice à moi');
  });
});
