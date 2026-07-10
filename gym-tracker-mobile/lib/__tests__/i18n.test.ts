import * as fs from 'fs';
import * as path from 'path';
import { tStatic } from '@/lib/i18n';
import { useSettingsStore } from '@/stores/settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

type TKey = Parameters<typeof tStatic>[0];

const setLanguage = (language: 'fr' | 'en') =>
  useSettingsStore.setState((s) => ({ settings: { ...s.settings, language } }));

afterEach(() => setLanguage('fr'));

// ── tStatic ──────────────────────────────────────────────────────

describe('tStatic', () => {
  it('traduit en français par défaut', () => {
    expect(tStatic('account.exportBtn')).toBe('Exporter mes données');
  });

  it('suit la langue du settingsStore', () => {
    setLanguage('en');
    expect(tStatic('account.exportBtn')).toBe('Export my data');
  });

  it('retourne la clé elle-même si elle est inconnue (pas de crash)', () => {
    expect(tStatic('cle.inexistante' as TKey)).toBe('cle.inexistante');
  });
});

// ── Parité des dictionnaires fr / en ─────────────────────────────
// Les clés sont extraites du source : toute clé ajoutée dans une seule
// langue casse ce test (règle projet : fr + en obligatoires).

describe('dictionnaires fr / en', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'i18n.ts'), 'utf8');
  const frStart = source.indexOf('fr: {');
  const enStart = source.indexOf('en: {');
  const enEnd = source.indexOf('} as const');

  const extractKeys = (block: string): string[] =>
    Array.from(block.matchAll(/^\s+'([^']+)':/gm), (m) => m[1]!);

  const frKeys = extractKeys(source.slice(frStart, enStart));
  const enKeys = extractKeys(source.slice(enStart, enEnd));

  it('les deux blocs sont bien trouvés dans le source', () => {
    expect(frStart).toBeGreaterThan(-1);
    expect(enStart).toBeGreaterThan(frStart);
    expect(frKeys.length).toBeGreaterThan(50);
  });

  it('aucune clé fr manquante côté en', () => {
    const en = new Set(enKeys);
    expect(frKeys.filter((k) => !en.has(k))).toEqual([]);
  });

  it('aucune clé en manquante côté fr', () => {
    const fr = new Set(frKeys);
    expect(enKeys.filter((k) => !fr.has(k))).toEqual([]);
  });

  it('aucune clé dupliquée dans un même dictionnaire', () => {
    expect(new Set(frKeys).size).toBe(frKeys.length);
    expect(new Set(enKeys).size).toBe(enKeys.length);
  });
});
