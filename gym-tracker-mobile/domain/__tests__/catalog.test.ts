import { describe, expect, it } from '@jest/globals';
import { formatDay, formatShortDay, formatThousands, parseAmount } from '@/domain/format';
import {
  aliasMatch,
  allExercises,
  alternativesFor,
  catalogByMuscle,
  clampRule,
  dayKey,
  defaultIncrementFor,
  EXERCISES,
  findDay,
  findExerciseDef,
  getSplit,
  isPlateLoaded,
  makeCustomExercise,
  searchExercises,
  searchKey,
  programDays,
  restFor,
  ruleFor,
  SPLITS,
  withOverride,
} from '@/domain/programs';
import { findCurrent } from '@/domain/sessionCursor';
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
    expect(defaultIncrementFor('barbell', 'kg')).toBe(2.5);
    expect(defaultIncrementFor('dumbbell', 'kg')).toBe(2);
    expect(defaultIncrementFor('machine', 'kg')).toBe(5);
    expect(defaultIncrementFor('machine', 'kg', true)).toBe(2.5);
    expect(defaultIncrementFor('dumbbell', 'lbs')).toBe(5);
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

  it('groups the whole catalog by main muscle, without empty groups', () => {
    const groups = catalogByMuscle();
    expect(groups[0]?.muscle).toBe('chest');
    expect(groups.flatMap((g) => g.exercises)).toHaveLength(Object.keys(EXERCISES).length);
    expect(groups.some((g) => g.muscle === 'arms')).toBe(false);
    expect(groups.map((g) => g.muscle)).toContain('biceps');
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
    expect(searchExercises('ecarte poulie').map((e) => e.name)).toEqual(['Écarté poulie', 'Écarté poulie basse']);
    expect(searchExercises('smith').length).toBe(3);
    expect(searchExercises('  ')).toEqual([]);
  });

  it('tells which other name the search found an exercise under', () => {
    expect(searchExercises('lat pulldown').map((e) => e.name)).toEqual(['Tirage vertical']);
    expect(aliasMatch(EXERCISES.pulldown, 'lat pull')).toBe('Lat pulldown');
    expect(aliasMatch(EXERCISES.pulldown, 'tirage')).toBeUndefined();
    expect(aliasMatch(EXERCISES.squat, '  ')).toBeUndefined();
  });

  it('lets the user create a variant that is not the same exercise', () => {
    const input = { equipment: 'machine' as const, category: 'compound' as const, muscle: 'back' as const };
    for (const name of ['Tirage horizontal', 'Dips triceps', 'Rowing convergent', 'Curl haltères alternés']) {
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
    expect(
      catalogByMuscle(own)
        .find((g) => g.muscle === 'chest')
        ?.exercises.map((e) => e.name),
    ).toContain('Écarté Panatta');
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
