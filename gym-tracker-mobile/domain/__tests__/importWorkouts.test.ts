import { describe, expect, it } from '@jest/globals';
import {
  catalogMatch,
  importWorkouts,
  nameKey,
  parseCsv,
  parseDate,
  parseNumber,
  type ImportResult,
} from '@/domain/importWorkouts';

const STRONG = [
  'Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE',
  '2024-01-15 18:30:00,"Push Day",1h 5m,Bench Press (Barbell),W,40,10,0,0,,,',
  '2024-01-15 18:30:00,"Push Day",1h 5m,Bench Press (Barbell),1,80,8,0,0,,,8',
  '2024-01-15 18:30:00,"Push Day",1h 5m,Bench Press (Barbell),2,80,7,0,0,"felt ""heavy""",,',
  '2024-01-15 18:30:00,"Push Day",1h 5m,Bench Press (Barbell),Rest Timer,0,0,0,90,,,',
  '2024-01-15 18:30:00,"Push Day",1h 5m,Bicep Curl (Dumbbell),1,14,12,0,0,,,',
  '2024-01-15 18:30:00,"Push Day",1h 5m,Plank,1,0,0,0,60,,,',
  '2024-01-17 19:00:00,"Legs",45m,Squat (Barbell),1,100,5,0,0,,,',
  '2024-01-17 19:00:00,"Legs",45m,Squat (Barbell),D,80,8,0,0,,,',
].join('\n');

const HEVY = [
  '"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_lbs","reps","distance_miles","duration_seconds","rpe"',
  '"Upper","15 Jan 2024, 18:30","15 Jan 2024, 19:40","","Lat Pulldown (Cable)","","","0","warmup","50","12","","",""',
  '"Upper","15 Jan 2024, 18:30","15 Jan 2024, 19:40","","Lat Pulldown (Cable)","","","1","normal","120","10","","","9"',
  '"Upper","15 Jan 2024, 18:30","15 Jan 2024, 19:40","","Lateral Raise (Dumbbell)","","","0","failure","20","15","","",""',
  '"Upper","15 Jan 2024, 18:30","15 Jan 2024, 19:40","","Pull Up","","","0","dropset","0","8","","",""',
].join('\r\n');

const ok = (r: ReturnType<typeof importWorkouts>) => {
  if (typeof r === 'string') throw new Error(r);
  return r as ImportResult;
};

describe('parseCsv', () => {
  it('reads quotes, escaped quotes and line breaks inside a cell', () => {
    expect(parseCsv('a,b\n"x, y","say ""hi""\nthere"\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"\nthere'],
    ]);
  });

  it('finds a semicolon separator, drops the BOM and blank lines', () => {
    expect(parseCsv('﻿a;b\r\n\r\n1;2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('values', () => {
  it('reads Strong, Hevy and ISO dates in local time', () => {
    expect(parseDate('2024-01-15 18:30:00')).toEqual(new Date(2024, 0, 15, 18, 30));
    expect(parseDate('2024-01-15')).toEqual(new Date(2024, 0, 15, 0, 0));
    expect(parseDate('15 Jan 2024, 18:30')).toEqual(new Date(2024, 0, 15, 18, 30));
    expect(parseDate('3 September 2024, 07:05')).toEqual(new Date(2024, 8, 3, 7, 5));
    expect(parseDate('Mon, 15 Jan 2024 18:30:00 GMT')).toEqual(new Date(Date.UTC(2024, 0, 15, 18, 30)));
    expect(parseDate('15 Foo 2024, 18:30')).toBeNull();
    expect(parseDate('nope')).toBeNull();
  });

  it('reads numbers with a dot or a comma', () => {
    expect(parseNumber('62.5')).toBe(62.5);
    expect(parseNumber(' 62,5 ')).toBe(62.5);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
    expect(parseNumber('abc')).toBeNull();
  });
});

describe('catalogMatch', () => {
  it('matches the movement only with the same equipment', () => {
    expect(catalogMatch('Bench Press (Barbell)')?.name).toBe('Développé couché');
    expect(catalogMatch('Bench Press (Dumbbell)')?.name).toBe('Développé couché haltères');
    expect(catalogMatch('Lateral Raise (Dumbbell)')?.name).toBe('Élévations latérales');
    expect(catalogMatch('Lat Pulldown (Cable)')?.name).toBe('Tirage vertical');
    expect(catalogMatch('Pull Up')?.name).toBe('Tractions');
    expect(catalogMatch('Squat (Barbell)')?.name).toBe('Squat');
    expect(catalogMatch('Développé couché')?.name).toBe('Développé couché');
  });

  it('keeps unknown or unsure names out of the catalog', () => {
    expect(catalogMatch('Bicep Curl (Dumbbell)')).toBeUndefined();
    expect(catalogMatch('Squat (Kettlebell)')).toBeUndefined();
    expect(catalogMatch('Squat (Dumbbell)')).toBeUndefined();
    expect(catalogMatch('Zercher thing')).toBeUndefined();
  });

  it('finds the exercises the user created', () => {
    const own = [
      {
        name: 'Presse Hammer',
        equipment: 'machine' as const,
        category: 'compound' as const,
        muscleGroups: ['legs' as const],
      },
    ];
    expect(catalogMatch('Presse Hammer', own)?.name).toBe('Presse Hammer');
  });

  it('meets plurals, hyphens and accents', () => {
    expect(nameKey('Pull-ups')).toBe(nameKey('Pull Up'));
    expect(nameKey('Élévations latérales')).toBe('elevation laterale');
  });
});

describe('importWorkouts from Strong', () => {
  const result = ok(importWorkouts(STRONG));

  it('groups the lines into sessions and exercises, newest data kept as logged', () => {
    expect(result.source).toBe('strong');
    expect(result.workouts.map((w) => w.name)).toEqual(['Push Day', 'Legs']);
    const push = result.workouts[0]!;
    expect(push.date).toBe(new Date(2024, 0, 15, 18, 30).toISOString());
    expect(push.duration).toBe(65);
    expect(push.exercises.map((e) => e.name)).toEqual(['Développé couché', 'Bicep Curl (Dumbbell)']);
    expect(push.exercises[0]!.sets).toEqual([
      { weight: 40, reps: 10, setType: 'warmup', completed: true },
      { weight: 80, reps: 8, setType: 'normal', rpe: 8, completed: true },
      { weight: 80, reps: 7, setType: 'normal', completed: true },
    ]);
    expect(push.exercises[0]!.muscleGroups).toContain('chest');
    expect(push.exercises[1]!.muscleGroups).toEqual([]);
    expect(result.workouts[1]!.duration).toBe(45);
    expect(result.workouts[1]!.exercises[0]!.sets[1]!.setType).toBe('drop');
  });

  it('counts what it recognized, kept and skipped', () => {
    expect(result.recognized).toBe(2);
    expect(result.unknown).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('gives the same ids to the same file, so a second import adds nothing', () => {
    expect(ok(importWorkouts(STRONG)).workouts.map((w) => w.id)).toEqual(result.workouts.map((w) => w.id));
  });

  it('reads a duration in seconds and a semicolon export', () => {
    const csv = STRONG.replace(/,/g, ';').replace(/1h 5m/g, '3600');
    expect(ok(importWorkouts(csv)).workouts[0]!.duration).toBe(60);
  });
});

describe('importWorkouts from Hevy', () => {
  const result = ok(importWorkouts(HEVY));

  it('converts pounds to kilos and keeps the set types', () => {
    expect(result.source).toBe('hevy');
    const upper = result.workouts[0]!;
    expect(upper.duration).toBe(70);
    expect(upper.exercises.map((e) => e.name)).toEqual(['Tirage vertical', 'Élévations latérales', 'Tractions']);
    expect(upper.exercises[0]!.sets).toEqual([
      { weight: 22.68, reps: 12, setType: 'warmup', completed: true },
      { weight: 54.43, reps: 10, setType: 'normal', rpe: 9, completed: true },
    ]);
    expect(upper.exercises[1]!.sets[0]!.setType).toBe('failure');
    expect(upper.exercises[2]!.sets[0]).toMatchObject({ weight: 0, setType: 'drop' });
    expect(result.unknown).toBe(0);
  });

  it('reads kilos when the export is in kilos', () => {
    const kilos = ok(importWorkouts(HEVY.replace('weight_lbs', 'weight_kg')));
    expect(kilos.workouts[0]!.exercises[0]!.sets[1]!.weight).toBe(120);
  });
});

describe('importWorkouts errors', () => {
  it('says why a file cannot be imported', () => {
    expect(importWorkouts('')).toBe('empty');
    expect(importWorkouts('a,b,c\n1,2,3')).toBe('unknownFormat');
    expect(importWorkouts(STRONG.split('\n').slice(0, 1).concat(STRONG.split('\n')[6]!).join('\n'))).toBe('noSets');
  });

  it('skips lines without a date or a name', () => {
    const broken = STRONG.split('\n')
      .slice(0, 3)
      .concat([
        'not a date,"Push Day",,Squat (Barbell),1,100,5,0,0,,,',
        '2024-01-15 18:30:00,"Push Day",,,1,100,5,0,0,,,',
      ])
      .join('\n');
    expect(ok(importWorkouts(broken)).skipped).toBe(2);
  });

  it('skips Hevy lines without reps', () => {
    const cardio = `${HEVY}\r\n"Upper","15 Jan 2024, 18:30","","","Running","","","0","normal","","","2","600",""`;
    const r = ok(importWorkouts(cardio));
    expect(r.skipped).toBe(1);
    expect(r.workouts[0]!.duration).toBe(70);
  });
});
