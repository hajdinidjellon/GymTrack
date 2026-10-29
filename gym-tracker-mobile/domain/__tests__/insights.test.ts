import { describe, expect, it } from '@jest/globals';
import { countFr, listFr } from '@/domain/format';
import { insights } from '@/domain/insights';
import { workoutsToCsv } from '@/domain/exportCsv';
import type { Exercise, Workout } from '@/types';
import { lift, workout } from './fixtures';

/** A local date: hours are read in the phone's time zone. */
const on = (month: number, day: number, hour = 19) => new Date(2026, month - 1, day, hour).toISOString();

function squat(weight: number, rests: number[] = []): Exercise {
  const done = lift('Squat', weight, [10, 10, 10, 10]);
  return { ...done, sets: done.sets.map((s, i) => (i > 0 && rests[i - 1] ? { ...s, restTaken: rests[i - 1] } : s)) };
}

/** Monday, Wednesday and Friday in the evening, 50 min, for three weeks of October 2026. */
function threeWeeks(): Workout[] {
  return [5, 7, 9, 12, 14, 16, 19, 21, 23].map((day, i) => ({
    ...workout(on(10, day), 'Full body A', [squat(60 + i * 2.5, [150, 150, 150])]),
    duration: 50,
  }));
}

const now = new Date(2026, 9, 26, 12);

describe('insights', () => {
  it('says nothing before a few sessions', () => {
    expect(insights(threeWeeks().slice(0, 2), { perWeek: 3, now })).toEqual([]);
  });

  it('tells when, which days, how long, how regular, how long the rests and where it grows', () => {
    const found = insights(threeWeeks(), { perWeek: 3, now });
    const text = Object.fromEntries(found.map((i) => [i.id, i.text]));
    expect(text).toEqual({
      time: "Tu t'entraînes surtout le soir.",
      days: 'Tu viens le plus souvent le lundi, mercredi et vendredi.',
      duration: 'Tes séances durent environ 50 min.',
      rhythm: '6 séances en 2 semaines : tu tiens ton rythme de 3 par semaine.',
      rest: 'Squat 2 min 30, en moyenne entre deux séries.',
      strong: 'Squat : +20 kg depuis le début.',
    });
  });

  it('stays quiet when there is no clear habit', () => {
    const mixed = [
      workout(on(10, 5, 8), 'A', [lift('Squat', 60, [10])]),
      workout(on(10, 13, 13), 'B', [lift('Squat', 60, [10])]),
      workout(on(10, 21, 16), 'A', [lift('Squat', 50, [10])]),
      workout(on(10, 23, 20), 'B', []),
    ];
    const ids = insights(mixed, { perWeek: 3, now }).map((i) => i.id);
    expect(ids).toEqual(['rhythm']);
    expect(insights(mixed, { perWeek: 3, now })[0]!.text).toBe('3 séances sur 9 prévues ces 3 dernières semaines.');
  });

  it('joins words the French way', () => {
    expect(listFr([])).toBe('');
    expect(listFr(['lundi'])).toBe('lundi');
    expect(listFr(['lundi', 'mardi', 'jeudi'])).toBe('lundi, mardi et jeudi');
  });
});

describe('workoutsToCsv', () => {
  it('writes one line per validated set, oldest first, French style', () => {
    const late = workout(on(10, 9, 18), 'Push; lourd', [
      {
        ...lift('Développé "couché"', 62.5, [10, 8]),
        sets: [
          { weight: 20, reps: 10, setType: 'warmup', completed: true },
          { weight: 62.5, reps: 8, setType: 'normal', completed: true, restTaken: 120 },
          { weight: 62.5, reps: 8, setType: 'normal', completed: false },
        ],
      },
    ]);
    const early = workout(on(10, 7, 7), 'Legs', [lift('Squat', 100, [5])]);
    expect(workoutsToCsv([late, early]).split('\n')).toEqual([
      'date;heure;séance;exercice;série;charge (kg);reps;échauffement;repos (s)',
      '2026-10-07;07:00;Legs;Squat;1;100;5;non;',
      '2026-10-09;18:00;"Push; lourd";"Développé ""couché""";1;20;10;oui;',
      '2026-10-09;18:00;"Push; lourd";"Développé ""couché""";2;62,5;8;non;120',
    ]);
  });
});

describe('countFr', () => {
  it('keeps 0 and 1 singular', () => {
    expect(countFr(0, 'record')).toBe('0 record');
    expect(countFr(1, 'série')).toBe('1 série');
    expect(countFr(3, 'série')).toBe('3 séries');
    expect(countFr(1200, 'disque', (n) => `~${n}`)).toBe('~1200 disques');
  });
});
