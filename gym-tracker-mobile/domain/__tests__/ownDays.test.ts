import { describe, expect, it } from '@jest/globals';
import { addOwnDay, checkDayName, removeOwnDay, renameOwnDay } from '@/domain/ownDays';
import { choosableDays, programDays } from '@/domain/programs';
import { nextDay, type BuildContext } from '@/domain/sessionBuilder';

const base = { ownDays: {}, customDays: {}, supersets: {} };

describe('own days', () => {
  it('checks the name: not empty, not a day of a program', () => {
    expect(checkDayName('  Épaules  ', 'ppl', base)).toBe('Épaules');
    expect(checkDayName('   ', 'ppl', base)).toEqual({ error: 'Donne un nom à ta séance.' });
    expect(checkDayName('push', 'ppl', base)).toEqual({ error: 'Une séance porte déjà ce nom.' });
    expect(checkDayName('Haut', 'ppl', base)).toEqual({ error: 'Une séance porte déjà ce nom.' });
    const withDay = { ...base, ownDays: { ppl: ['Épaules'] } };
    expect(checkDayName('épaules', 'ppl', withDay)).toEqual({ error: 'Une séance porte déjà ce nom.' });
    expect(checkDayName('Épaules', 'ppl', withDay, 'Épaules')).toBe('Épaules');
  });

  it('adds a day after the program, listed even empty', () => {
    const settings = { ...base, ...addOwnDay(base, 'ppl', 'Épaules') };
    const days = programDays('ppl', settings.customDays, [], settings.ownDays);
    expect(days.map((d) => d.name)).toEqual(['Push', 'Pull', 'Legs', 'Épaules']);
    expect(days[3]).toMatchObject({ own: true, exercises: [] });
    expect(
      choosableDays('ppl', settings.customDays, [], settings.ownDays).find((d) => d.name === 'Épaules'),
    ).toBeTruthy();
  });

  it('renames a day with its exercises and supersets, and removes it', () => {
    const settings = {
      ownDays: { ppl: ['Épaules'] },
      customDays: { 'ppl/Épaules': ['Développé militaire', 'Élévations latérales'] },
      supersets: { 'ppl/Épaules': ['Développé militaire'] },
    };
    const renamed = { ...settings, ...renameOwnDay(settings, 'ppl', 'Épaules', 'Delts') };
    expect(renamed.ownDays).toEqual({ ppl: ['Delts'] });
    expect(renamed.customDays).toEqual({ 'ppl/Delts': ['Développé militaire', 'Élévations latérales'] });
    expect(renamed.supersets).toEqual({ 'ppl/Delts': ['Développé militaire'] });
    expect(renameOwnDay(base, 'ppl', 'X', 'Y')).toEqual({ ownDays: { ppl: [] }, customDays: {}, supersets: {} });
    const removed = removeOwnDay(renamed, 'ppl', 'Delts');
    expect(removed).toEqual({ ownDays: { ppl: [] }, customDays: {}, supersets: {} });
  });

  it('puts a filled own day in the rotation, never an empty one', () => {
    const ctx = (ownDays: Record<string, string[]>, customDays: Record<string, string[]> = {}): BuildContext => ({
      profile: { goal: 'muscle', program: { split: 'ppl', perWeek: 4 }, prs: [] },
      settings: { units: 'kg', defaultRestTime: 90, increments: {}, ownDays, customDays },
      workouts: [
        { id: '1', date: '2026-10-01', name: 'Legs', type: 'strength', exercises: [], feeling: 3, completed: true },
      ],
    });
    expect(nextDay(ctx({ ppl: ['Épaules'] })).name).toBe('Push');
    expect(nextDay(ctx({ ppl: ['Épaules'] }, { 'ppl/Épaules': ['Développé militaire'] })).name).toBe('Épaules');
  });
});
