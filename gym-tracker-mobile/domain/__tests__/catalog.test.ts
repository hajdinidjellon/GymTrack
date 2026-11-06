import { describe, expect, it } from '@jest/globals';
import { formatDay, formatShortDay, formatThousands, parseAmount } from '@/domain/format';
import {
  aliasMatch,
  allExercises,
  alternativesFor,
  byPopularity,
  clampRule,
  dayKey,
  defaultIncrementFor,
  EXERCISES,
  equipmentShown,
  exercisesByPopularity,
  findDay,
  findExerciseDef,
  getSplit,
  isPlateLoaded,
  makeCustomExercise,
  searchExercises,
  searchKey,
  similarExercises,
  POPULARITY,
  programDays,
  restFor,
  easierVariant,
  ruleFor,
  SPLITS,
  withOverride,
} from '@/domain/programs';
import { findCurrent } from '@/domain/sessionCursor';
import { EXERCISE_NAMES_EN } from '@/i18n/exerciseNames';
import { active } from './fixtures';

describe('programs', () => {
  it('finds an exercise by name or old name, ignoring case', () => {
    expect(findExerciseDef('squat')).toBe(EXERCISES.squat);
    expect(findExerciseDef('Développé couché barre')).toBe(EXERCISES.bench);
    expect(findExerciseDef('Zercher')).toBeUndefined();
  });

  it('falls back to the first split for an unknown id', () => {
    expect(getSplit('ul').id).toBe('ul');
    expect(getSplit('nope' as never)).toBe(SPLITS[0]);
  });

  it('picks a weight step per equipment', () => {
    const E = EXERCISES;
    expect(defaultIncrementFor(E.bench, 'kg')).toBe(2.5);
    expect(defaultIncrementFor(E.curl, 'kg')).toBe(2);
    expect(defaultIncrementFor(E.dipsmachine, 'kg')).toBe(5); // big movement on a stack
    expect(defaultIncrementFor(E.legpress, 'kg', true)).toBe(2.5);
    expect(defaultIncrementFor(E.curl, 'lbs')).toBe(5);
  });

  it('never jumps by half on cables and single-muscle stack work', () => {
    const E = EXERCISES;
    expect(defaultIncrementFor(E.cablelateral, 'kg')).toBe(2.5);
    expect(defaultIncrementFor(E.pulldown, 'kg')).toBe(2.5);
    expect(defaultIncrementFor(E.legext, 'kg')).toBe(2.5);
  });

  it('offers an easier variant of the hard bodyweight lifts', () => {
    const E = EXERCISES;
    expect(easierVariant(E.pullup)).toBe(E.assisted);
    expect(easierVariant(E.chinup)).toBe(E.assisted);
    expect(easierVariant(E.dips)).toBe(E.assisteddips);
    expect(easierVariant(E.widepullup)).toBe(E.assisted);
    expect(E.assisteddips.assisted).toBe(true);
    expect(easierVariant(E.squat)).toBeUndefined();
    expect(E.assisted.assisted).toBe(true);
  });

  it('knows the plate-loaded machines, and lets the user say otherwise', () => {
    expect(isPlateLoaded(EXERCISES.legpress)).toBe(true);
    expect(isPlateLoaded(EXERCISES.pecdeck)).toBe(false);
    expect(isPlateLoaded(EXERCISES.legpress, { 'Presse à cuisses': false })).toBe(false);
    expect(isPlateLoaded(EXERCISES.pecdeck, { 'Pec deck': true })).toBe(true);
    expect(isPlateLoaded(EXERCISES.bench, { 'Développé couché': true })).toBe(false);
  });

  it('uses heavy sets for strength on the barbell only', () => {
    expect(ruleFor('force', EXERCISES.squat, 2.5)).toMatchObject({ sets: 5, repMin: 3, repMax: 5 });
    expect(ruleFor('force', EXERCISES.curl, 2)).toMatchObject({ sets: 3, repMin: 8, repMax: 12 });
    expect(ruleFor('forme', EXERCISES.squat, 2.5)).toMatchObject({ repMin: 10, repMax: 15 });
  });

  it('rests at least 3 minutes on heavy sets', () => {
    expect(restFor(ruleFor('force', EXERCISES.squat, 2.5), 90)).toBe(240);
    expect(restFor(ruleFor('muscle', EXERCISES.squat, 2.5), 90)).toBe(90);
  });
});

describe('own sets and reps', () => {
  it.each([
    [
      { sets: 0, repMin: 8, repMax: 12 },
      { sets: 1, repMin: 8, repMax: 12 },
    ],
    [
      { sets: 12, repMin: 0, repMax: 60 },
      { sets: 10, repMin: 1, repMax: 50 },
    ],
    [
      { sets: 3, repMin: 10, repMax: 6 },
      { sets: 3, repMin: 10, repMax: 10 },
    ],
  ])('keeps %o valid', (rule, expected) => {
    expect(clampRule(rule)).toEqual(expected);
  });

  it('puts them over the goal rule, keeping the increment', () => {
    const base = ruleFor('muscle', EXERCISES.curl, 2);
    expect(withOverride(base, undefined)).toBe(base);
    expect(withOverride(base, { sets: 4, repMin: 6, repMax: 10 })).toEqual({
      kind: 'double',
      sets: 4,
      repMin: 6,
      repMax: 10,
      increment: 2,
    });
  });
});

describe('choosing a session', () => {
  it('finds a day of the program by name', () => {
    expect(findDay(getSplit('ppl'), 'Pull')?.exercises[0]).toBe(EXERCISES.pullup);
    expect(findDay(getSplit('ppl'), 'Haut')).toBeUndefined();
  });

  it('keeps the program days the user did not touch', () => {
    const days = programDays('ppl', { [dayKey('ppl', 'Legs')]: ['Squat', 'Hip thrust'] }, []);
    expect(days[0]).toBe(getSplit('ppl').days[0]);
    expect(days[2]?.exercises).toEqual([EXERCISES.squat, EXERCISES.hipthrust]);
  });

  it('lists the whole catalog from the most known to the least known', () => {
    const names = exercisesByPopularity().map((e) => e.name);
    expect(names).toHaveLength(Object.keys(EXERCISES).length);
    expect(names.slice(0, 5)).toEqual([
      'Développé couché',
      'Squat',
      'Soulevé de terre',
      'Tirage vertical',
      'Curl haltères',
    ]);
    expect(names.indexOf('Pec deck')).toBeLessThan(names.indexOf('Pull-over machine'));
    expect(names.at(-1)).toBe('Arraché');
  });
});

describe('parseAmount', () => {
  it.each<[string, boolean, number | null]>([
    ['62,5', false, 62.5],
    ['62.5', false, 62.5],
    [' 80 ', false, 80],
    ['62,', false, 62],
    [',5', false, 0.5],
    ['10.6', true, 11],
    ['', false, null],
    ['abc', false, null],
    ['-5', false, null],
    ['1,2,3', false, null],
  ])('reads %p', (text, integer, expected) => {
    expect(parseAmount(text, integer)).toBe(expected);
  });
});

describe('sessionCursor', () => {
  it('points at the first set not done', () => {
    const a = active('a', [{ weight: 50, reps: 5, completed: true }]);
    const b = active('b', [
      { weight: 50, reps: 5, completed: true },
      { weight: 50, reps: 5 },
    ]);
    expect(findCurrent([a, b])).toMatchObject({ exerciseIndex: 1, setIndex: 1 });
    expect(findCurrent([a])).toBeNull();
  });
});

describe('catalog', () => {
  it('never gives two exercises the same name', () => {
    const keys = Object.values(EXERCISES).flatMap((e) => [e.name, ...(e.aliases ?? [])].map(searchKey));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('has the usual gym machines and variants', () => {
    for (const name of ['Hack squat', 'Développé couché Smith', 'Développé convergent machine', 'Pendulum squat']) {
      expect(findExerciseDef(name)).toBeDefined();
    }
    expect(findExerciseDef('Bench press convergent')?.name).toBe('Développé convergent machine');
  });

  it('finds an exercise from a few letters, accents or not', () => {
    expect(searchExercises('hack').map((e) => e.name)).toEqual(['Hack squat']);
    // "Oiseau poulie" is also called "Écarté inversé poulie"
    expect(searchExercises('ecarte poulie').map((e) => e.name)).toEqual([
      'Écarté poulie',
      'Oiseau poulie',
      'Écarté poulie basse',
      'Écarté poulie haute',
    ]);
    expect(searchExercises('smith').map((e) => e.name)).toEqual(
      expect.arrayContaining(['Squat Smith', 'Développé couché Smith', 'Hip thrust Smith']),
    );
    expect(searchExercises('  ')).toEqual([]);
  });

  it('tells which other name the search found an exercise under', () => {
    expect(searchExercises('lat pulldown')[0]?.name).toBe('Tirage vertical');
    expect(aliasMatch(EXERCISES.pulldown, 'lat pull')).toBe('Lat pulldown');
    expect(aliasMatch(EXERCISES.pulldown, 'tirage')).toBeUndefined();
    expect(aliasMatch(EXERCISES.squat, '  ')).toBeUndefined();
  });

  it('lets the user create a variant that is not the same exercise', () => {
    const input = { equipment: 'machine' as const, category: 'compound' as const, muscle: 'back' as const };
    for (const name of ['Tirage incliné', 'Dips triceps', 'Rowing convergent', 'Curl haltères alternés']) {
      expect(makeCustomExercise({ ...input, name })).toMatchObject({ name });
    }
  });
});

describe('own exercises', () => {
  const own = [
    {
      name: 'Écarté Panatta',
      equipment: 'machine' as const,
      category: 'isolation' as const,
      muscleGroups: ['chest' as const],
    },
  ];

  it('sit next to the catalog', () => {
    expect(allExercises(own).at(-1)).toMatchObject({ name: 'Écarté Panatta', custom: true });
    expect(findExerciseDef(' écarté PANATTA ', own)).toMatchObject({ name: 'Écarté Panatta' });
    expect(findExerciseDef('Écarté Panatta')).toBeUndefined();
    expect(exercisesByPopularity(own)[0]?.name).toBe('Écarté Panatta');
    expect(alternativesFor(EXERCISES.pecdeck, own)[0]?.name).toBe('Écarté Panatta');
    expect(programDays('ppl', { 'ppl/Push': ['Écarté Panatta'] }, own)[0]?.exercises[0]?.name).toBe('Écarté Panatta');
  });

  it('are created from the form, with a clean and unique name', () => {
    const input = { equipment: 'machine' as const, category: 'isolation' as const, muscle: 'biceps' as const };
    expect(makeCustomExercise({ ...input, name: '  Curl   spider ' })).toEqual({
      name: 'Curl spider',
      equipment: 'machine',
      category: 'isolation',
      muscleGroups: ['biceps'],
    });
    expect(makeCustomExercise({ ...input, name: '   ' })).toEqual({ error: 'Donne un nom à ton exercice.' });
    expect(makeCustomExercise({ ...input, name: 'squat' })).toEqual({ error: 'Cet exercice existe déjà.' });
    expect(makeCustomExercise({ ...input, name: 'Leg press' })).toEqual({
      error: 'Il existe déjà sous le nom « Presse à cuisses ».',
    });
    expect(makeCustomExercise({ ...input, name: 'Écarté Panatta' }, own)).toEqual({
      error: 'Cet exercice existe déjà.',
    });
  });

  it('suggests other exercises for the same muscle to swap', () => {
    const names = alternativesFor(EXERCISES.bench, own).map((e) => e.name);
    expect(names).toEqual(
      expect.arrayContaining(['Écarté poulie', 'Pec deck', 'Développé convergent machine', 'Écarté Panatta']),
    );
    expect(names).not.toContain('Développé couché');
    expect(names).not.toContain('Squat');
  });
});

describe('popularity', () => {
  it('ranks every catalog exercise exactly once', () => {
    expect([...POPULARITY].sort()).toEqual(Object.keys(EXERCISES).sort());
  });

  it('sorts any list most known first, the unknown ones last', () => {
    const stranger = { ...EXERCISES.squat, name: 'Inconnu' };
    const sorted = byPopularity([EXERCISES.snatch, stranger, EXERCISES.squat, EXERCISES.bench]);
    expect(sorted.map((e) => e.name)).toEqual(['Développé couché', 'Squat', 'Arraché', 'Inconnu']);
  });

  it('offers the swaps for the same muscle, most known first', () => {
    const names = alternativesFor(EXERCISES.legpress).map((e) => e.name);
    expect(names.slice(0, 3)).toEqual(['Squat', 'Leg extension', 'Leg curl']);
  });

  it('finds an exercise by its English name, in French too', () => {
    expect(searchExercises('deadlift')[0]?.name).toBe('Soulevé de terre');
    expect(aliasMatch(EXERCISES.deadlift, 'deadlift')).toBe('Deadlift');
    expect(searchExercises('lat pulldown')[0]?.name).toBe('Tirage vertical');
    const input = { equipment: 'barbell' as const, category: 'isolation' as const, muscle: 'biceps' as const };
    expect(makeCustomExercise({ ...input, name: 'Wrist curl' })).toEqual({
      error: 'Il existe déjà sous le nom « Curl poignets ».',
    });
  });

  it('never gives two exercises the same name, English names included', () => {
    const owner = new Map<string, string>();
    for (const def of Object.values(EXERCISES)) {
      const english = EXERCISE_NAMES_EN[def.name] ?? '';
      for (const key of new Set([def.name, english, ...(def.aliases ?? [])].map(searchKey))) {
        expect([key, owner.get(key) ?? def.name]).toEqual([key, def.name]);
        owner.set(key, def.name);
      }
    }
  });
});

describe('kettlebells', () => {
  it('are shown as kettlebells and move by 4 kg', () => {
    expect(equipmentShown(EXERCISES.swing)).toBe('kettlebell');
    expect(equipmentShown(EXERCISES.curl)).toBe('dumbbell');
    expect(defaultIncrementFor(EXERCISES.swing, 'kg')).toBe(4);
    expect(defaultIncrementFor(EXERCISES.swing, 'lbs')).toBe(10);
  });
});

describe('format', () => {
  it('writes dates the French way, from a Date or a string', () => {
    expect(formatDay(new Date(2026, 9, 22))).toMatch(/^Jeudi 22 oct/);
    expect(formatShortDay('2026-10-22T12:00:00')).toMatch(/^Jeu\.? 22 oct/);
  });

  it('separates thousands with a narrow no-break space', () => {
    expect(formatThousands(4800)).toBe('4\u202f800');
    expect(formatThousands(1234567.6)).toBe('1\u202f234\u202f568');
    expect(formatThousands(950)).toBe('950');
  });
});

describe('timed exercises in the catalog', () => {
  it('holds planks for 3 × 30-60 s, whatever the goal', () => {
    expect(ruleFor('force', EXERCISES.plank, 2.5)).toMatchObject({ sets: 3, repMin: 30, repMax: 60, repStep: 5 });
    expect(findExerciseDef('Planche')?.name).toBe('Gainage');
  });

  it('keeps seconds between 5 s and 10 min, own seconds included', () => {
    expect(clampRule({ sets: 3, repMin: 2, repMax: 900 }, true)).toEqual({ sets: 3, repMin: 5, repMax: 600 });
    const held = ruleFor('muscle', EXERCISES.plank, 2.5);
    expect(withOverride(held, { sets: 4, repMin: 45, repMax: 90 })).toMatchObject({ repMin: 45, repMax: 90 });
  });

  it('never mixes held and counted exercises as similar', () => {
    const names = (def: (typeof EXERCISES)[keyof typeof EXERCISES]) => similarExercises(def).map((e) => e.name);
    expect(names(EXERCISES.plank)).toContain('Gainage latéral');
    expect(names(EXERCISES.plank)).not.toContain('Crunch');
    expect(names(EXERCISES.crunch)).not.toContain('Gainage');
  });

  it('creates an own exercise counted in seconds', () => {
    expect(
      makeCustomExercise({
        name: 'Planche lestée',
        equipment: 'bodyweight',
        category: 'isolation',
        muscle: 'core',
        timed: true,
      }),
    ).toMatchObject({ timed: true });
    expect(
      makeCustomExercise({ name: 'Curl câble', equipment: 'machine', category: 'isolation', muscle: 'biceps' }),
    ).not.toHaveProperty('timed');
  });
});
