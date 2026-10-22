import { describe, expect, it } from '@jest/globals';
import { startOfWeek, weekStreak, workoutsThisWeek } from '@/domain/week';
import { workout } from './fixtures';

// Jeudi 22 octobre 2026, midi (heure locale)
const now = new Date(2026, 9, 22, 12);
const day = (d: number, h = 18) => new Date(2026, 9, d, h).toISOString();

describe('startOfWeek', () => {
  it('goes back to Monday midnight', () => {
    expect(startOfWeek(now)).toEqual(new Date(2026, 9, 19, 0, 0, 0, 0));
  });

  it('treats Sunday as the end of the week', () => {
    expect(startOfWeek(new Date(2026, 9, 25, 23))).toEqual(new Date(2026, 9, 19));
  });
});

describe('workoutsThisWeek', () => {
  it('counts from Monday', () => {
    const list = [workout(day(19, 7), 'Push', []), workout(day(18), 'Legs', []), workout(day(21), 'Pull', [])];
    expect(workoutsThisWeek(list, now).map((w) => w.name)).toEqual(['Push', 'Pull']);
  });
});

describe('weekStreak', () => {
  const twoPerWeek = (days: number[]) => days.map((d, i) => workout(day(d), 'x', [], `w${i}`));

  it('is zero with no history', () => {
    expect(weekStreak([], 2, now)).toBe(0);
  });

  it('counts past weeks that met the goal, without breaking on the current one', () => {
    // Semaines du 5, 12 : objectif atteint ; semaine en cours : une seule séance
    expect(weekStreak(twoPerWeek([6, 8, 13, 15, 20]), 2, now)).toBe(2);
  });

  it('includes the current week once it is met', () => {
    expect(weekStreak(twoPerWeek([13, 15, 20, 21]), 2, now)).toBe(2);
  });

  it('stops at the first week that missed the goal', () => {
    expect(weekStreak(twoPerWeek([1, 2, 13, 15]), 2, now)).toBe(1);
  });

  it('survives the daylight saving change', () => {
    // Passage à l'heure d'hiver le 25 octobre 2026 : on regarde depuis la semaine suivante
    const after = new Date(2026, 10, 4, 12);
    expect(weekStreak(twoPerWeek([20, 21, 27, 28]), 2, after)).toBe(2);
  });
});
