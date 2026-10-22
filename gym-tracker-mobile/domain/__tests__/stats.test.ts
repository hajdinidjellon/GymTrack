import { describe, expect, it } from '@jest/globals';
import { personalBests, totals, weekDays, weeklyVolume } from '@/domain/stats';
import { lift, workout } from './fixtures';

// Jeudi 22 octobre 2026, midi
const now = new Date(2026, 9, 22, 12);
const at = (d: number, m = 9) => new Date(2026, m, d, 18).toISOString();

describe('weekDays', () => {
  it('lists Monday to Sunday with the days trained', () => {
    const days = weekDays([workout(at(19), 'Push', []), workout(at(22), 'Pull', [])], now);
    expect(days.map((d) => d.letter).join('')).toBe('LMMJVSD');
    expect(days.map((d) => d.done)).toEqual([true, false, false, true, false, false, false]);
    expect(days.findIndex((d) => d.today)).toBe(3);
    expect(days.map((d) => d.future)).toEqual([false, false, false, false, true, true, true]);
  });
});

describe('weeklyVolume', () => {
  it('sums the tonnage per week, oldest first, current week last', () => {
    const list = [
      workout(at(20), 'Legs', [lift('Squat', 100, [5, 5])], 'a'),
      workout(at(21), 'Legs', [lift('Squat', 100, [5])], 'b'),
      workout(at(13), 'Legs', [lift('Squat', 90, [5])], 'c'),
      workout(at(1), 'Legs', [lift('Squat', 50, [5])], 'old'),
    ];
    const weeks = weeklyVolume(list, 3, now);
    expect(weeks.map((w) => w.tonnage)).toEqual([0, 450, 1500]);
    expect(weeks.map((w) => w.sessions)).toEqual([0, 1, 2]);
    expect(weeks[2]!.start).toEqual(new Date(2026, 9, 19));
  });

  it('survives the daylight saving change', () => {
    const weeks = weeklyVolume([], 4, new Date(2026, 10, 4, 12));
    expect(weeks.map((w) => w.start.getDate())).toEqual([12, 19, 26, 2]);
  });
});

describe('personalBests', () => {
  it('keeps the heaviest set per exercise, latest record first', () => {
    const list = [
      workout(at(1), 'Push', [lift('Développé couché', 60, [8]), lift('Squat', 100, [5])], 'a'),
      workout(at(8), 'Push', [lift('Développé couché', 65, [6])], 'b'),
      workout(at(15), 'Push', [lift('Développé couché', 62.5, [10]), lift('Dips', 0, [12])], 'c'),
    ];
    expect(personalBests(list)).toEqual([
      { name: 'Développé couché', weight: 65, reps: 6, date: at(8) },
      { name: 'Squat', weight: 100, reps: 5, date: at(1) },
    ]);
  });

  it('gives a tie to whoever lifted it first', () => {
    const list = [
      workout(at(1), 'x', [lift('Squat', 100, [5])], 'a'),
      workout(at(8), 'x', [lift('Squat', 100, [6])], 'b'),
    ];
    expect(personalBests(list)[0]).toMatchObject({ date: at(1), reps: 5 });
  });
});

describe('totals', () => {
  it('counts sessions, tonnage and the first day', () => {
    const list = [
      workout(at(8), 'x', [lift('Squat', 100, [5])], 'a'),
      workout(at(1), 'x', [lift('Squat', 100, [5])], 'b'),
    ];
    expect(totals(list)).toEqual({ sessions: 2, tonnage: 1000, since: at(1) });
    expect(totals([])).toEqual({ sessions: 0, tonnage: 0, since: null });
  });
});
