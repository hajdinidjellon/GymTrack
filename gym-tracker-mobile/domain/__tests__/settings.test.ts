import { describe, expect, it } from '@jest/globals';
import {
  applyCloudSettings,
  DEFAULT_SETTINGS,
  hasOwnSettings,
  pickSettingsSource,
  syncedSettings,
  syncedSettingsChanged,
} from '@/domain/settings';

describe('syncedSettings', () => {
  it('leaves out what belongs to the phone', () => {
    const synced = syncedSettings(DEFAULT_SETTINGS);
    for (const key of ['signedOut', 'notifications', 'voiceCommands', 'theme', 'language']) {
      expect(synced).not.toHaveProperty(key);
    }
    expect(synced).toMatchObject({ customDays: {}, plates: DEFAULT_SETTINGS.plates, voice: true });
  });
});

describe('syncedSettingsChanged', () => {
  it.each([
    [{ theme: 'dark' as const }, false],
    [{ signedOut: true }, false],
    [{ restOverrides: { 'Développé couché': 120 } }, true],
    [{ voice: false }, true],
  ])('%j → %s', (patch, changed) => {
    expect(syncedSettingsChanged(DEFAULT_SETTINGS, { ...DEFAULT_SETTINGS, ...patch })).toBe(changed);
  });
});

describe('hasOwnSettings', () => {
  it.each([
    ['nothing stored', {}, false],
    ['the defaults', DEFAULT_SETTINGS, false],
    ['only the first-launch answers', { barWeight: 15, plates: [20, 10] }, false],
    ['only phone settings', { theme: 'dark' as const, language: 'en' as const }, false],
    ['an own day', { customDays: { 'ppl/Legs': ['Squat'] } }, true],
    ['an own rest', { defaultRestTime: 120 }, true],
  ])('%s → %s', (_label, settings, expected) => {
    expect(hasOwnSettings(settings)).toBe(expected);
  });
});

describe('pickSettingsSource', () => {
  const own = { customDays: { 'ppl/Legs': ['Squat'] } };

  it('takes the cloud on a phone with nothing of its own, even newer', () => {
    expect(
      pickSettingsSource({ local: { plates: [20] }, localUpdatedAt: '2026-11-05', cloudUpdatedAt: '2026-01-01' }),
    ).toBe('cloud');
  });

  it('keeps the most recent copy', () => {
    expect(pickSettingsSource({ local: own, localUpdatedAt: '2026-11-05', cloudUpdatedAt: '2026-11-01' })).toBe(
      'local',
    );
    expect(pickSettingsSource({ local: own, localUpdatedAt: '2026-11-01', cloudUpdatedAt: '2026-11-05' })).toBe(
      'cloud',
    );
  });

  it('takes the cloud on a tie, or when the phone has no time', () => {
    const at = '2026-11-05T10:00:00.000Z';
    expect(pickSettingsSource({ local: own, localUpdatedAt: at, cloudUpdatedAt: at })).toBe('cloud');
    expect(pickSettingsSource({ local: own, localUpdatedAt: null, cloudUpdatedAt: at })).toBe('cloud');
    expect(pickSettingsSource({ local: own, localUpdatedAt: 'garbage', cloudUpdatedAt: at })).toBe('cloud');
  });
});

describe('applyCloudSettings', () => {
  it("takes the cloud's training and keeps the phone's own settings", () => {
    const local = { theme: 'dark' as const, signedOut: false, voice: true, customDays: { 'ppl/Push': ['Dips'] } };
    const cloud = { theme: 'light' as const, voice: false, customDays: { 'ppl/Legs': ['Squat'] } };
    expect(applyCloudSettings(local, cloud)).toEqual({
      theme: 'dark',
      signedOut: false,
      voice: false,
      customDays: { 'ppl/Legs': ['Squat'] },
    });
  });
});
