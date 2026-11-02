import { describe, expect, it } from '@jest/globals';
import { backupFileName, makeBackup, mergeWorkouts, parseBackup, type ParsedBackup } from '@/domain/backup';
import type { UserProfile } from '@/types';
import { lift, workout } from './fixtures';

const profile: UserProfile = { goal: 'force', program: { split: 'ul', perWeek: 4 }, prs: [], bodyStats: [] };
const NOW = new Date(2026, 10, 2, 9, 5);
const sessions = [
  workout('2026-11-01', 'Haut', [lift('Développé couché', 80, [8, 8])]),
  workout('2026-10-28', 'Bas', []),
];

describe('makeBackup / parseBackup', () => {
  it('gives back what was saved, without the device-only settings', () => {
    const text = makeBackup(
      { profile, workouts: sessions, settings: { voice: false, signedOut: true, barWeight: 15 } },
      NOW,
    );
    expect(JSON.parse(text)).toMatchObject({ app: 'gymtrack', version: 1, exportedAt: NOW.toISOString() });
    const back = parseBackup(text) as ParsedBackup;
    expect(back.profile).toEqual(profile);
    expect(back.workouts).toEqual(sessions);
    expect(back.settings.barWeight).toBe(15);
    expect(back.settings).not.toHaveProperty('signedOut');
    expect(back.rejected).toBe(0);
  });

  it('skips broken sessions and unreadable settings, keeps the rest', () => {
    const text = JSON.stringify({
      app: 'gymtrack',
      version: 1,
      profile: null,
      workouts: [sessions[0], { id: 1 }],
      settings: { barWeight: 'heavy' },
    });
    const back = parseBackup(`﻿${text}`) as ParsedBackup;
    expect(back.workouts).toHaveLength(1);
    expect(back.rejected).toBe(1);
    expect(back.settings).toEqual({});
    expect(back.profile).toBeNull();
  });

  it('reads a backup without sessions or settings', () => {
    expect(parseBackup(JSON.stringify({ app: 'gymtrack', version: 1 }))).toEqual({
      profile: null,
      workouts: [],
      settings: {},
      rejected: 0,
    });
  });

  it('refuses anything that is not a GymTrack backup', () => {
    expect(parseBackup('not json')).toBe('notJson');
    expect(parseBackup('42')).toBe('notBackup');
    expect(parseBackup('null')).toBe('notBackup');
    expect(parseBackup(JSON.stringify({ app: 'other', version: 1 }))).toBe('notBackup');
    expect(parseBackup(JSON.stringify({ app: 'gymtrack' }))).toBe('notBackup');
    expect(parseBackup(JSON.stringify({ app: 'gymtrack', version: 2 }))).toBe('newerVersion');
  });
});

describe('backupFileName', () => {
  it('dates the file', () => {
    expect(backupFileName(NOW)).toBe('gymtrack-2026-11-02.json');
    expect(backupFileName(NOW, 'csv')).toBe('gymtrack-2026-11-02.csv');
  });
});

describe('mergeWorkouts', () => {
  it('adds only the sessions not there yet, newest first', () => {
    const older = workout('2026-10-01', 'Push', []);
    const { workouts, added } = mergeWorkouts([sessions[1]!], [sessions[0]!, sessions[1]!, older, older]);
    expect(added.map((w) => w.id)).toEqual(['2026-11-01', '2026-10-01']);
    expect(workouts.map((w) => w.id)).toEqual(['2026-11-01', '2026-10-28', '2026-10-01']);
  });
});
