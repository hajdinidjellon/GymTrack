import { describe, expect, it } from '@jest/globals';
import { EXERCISES } from '@/domain/programs';
import {
  breakDays,
  breakLabel,
  loadLabel,
  deltaLabel,
  lastTimeLabel,
  newRecords,
  nextDay,
  planDay,
  todayStatus,
  planLift,
  reasonLabel,
  supersetGroups,
  targetLabel,
  targetLoad,
  tonnage,
  weightHistory,
  toActiveExercise,
  toActiveExercises,
  type BuildContext,
} from '@/domain/sessionBuilder';
import type { ProgressionDecision } from '@/domain/progression';
import type { Exercise, Workout } from '@/types';

function workout(date: string, name: string, exercises: Exercise[]): Workout {
  return { id: date, date, name, type: 'strength', exercises, feeling: 3, completed: true };
}

function lift(name: string, weight: number, reps: number[]): Exercise {
  return {
    id: name,
    name,
    category: 'compound',
    muscleGroups: ['chest'],
    sets: reps.map((r) => ({ weight, reps: r, setType: 'normal', completed: true })),
  };
}

function ctx(workouts: Workout[] = [], patch: Partial<BuildContext['profile']> = {}): BuildContext {
  return {
    profile: { goal: 'muscle', program: { split: 'ppl', perWeek: 3 }, prs: [], ...patch },
    settings: { units: 'kg', defaultRestTime: 90, increments: {} },
    workouts,
  };
}

describe('nextDay', () => {
  it('starts the program on day one', () => {
    expect(nextDay(ctx()).name).toBe('Push');
  });

  it('follows the last day done and wraps around', () => {
    expect(nextDay(ctx([workout('2026-10-01', 'Push', [])])).name).toBe('Pull');
    expect(nextDay(ctx([workout('2026-10-01', 'Pull', []), workout('2026-10-03', 'Legs', [])])).name).toBe('Push');
  });

  it('uses the exercises the user chose for that day', () => {
    const c = ctx([workout('2026-10-01', 'Push', [])]);
    c.settings.customDays = { 'ppl/Pull': ['Rowing haltère', 'Curl marteau', 'Exercice supprimé'] };
    const day = nextDay(c);
    expect(day.name).toBe('Pull');
    expect(day.exercises.map((e) => e.name)).toEqual(['Rowing haltère', 'Curl marteau']);
  });

  it('ignores workouts from another program', () => {
    expect(nextDay(ctx([workout('2026-10-01', 'Séance', [])])).name).toBe('Push');
  });

  describe('with a week set', () => {
    // 2026-10-28 is a Wednesday
    const wednesday = new Date(2026, 9, 28, 18);
    const week = (schedule: (string | null)[], workouts: Workout[] = []) => ({
      ...ctx(workouts, { program: { split: 'ppl', perWeek: 3, schedule } }),
      now: wednesday,
    });

    it('does the session planned today, whatever was done before', () => {
      const c = week(['Push', null, 'Legs', null, 'Pull', null, null], [workout('2026-10-26', 'Push', [])]);
      expect(todayStatus(c)).toEqual({ kind: 'train', name: 'Legs' });
      expect(nextDay(c).name).toBe('Legs');
    });

    it('rests on a day off, and offers the next one in order', () => {
      const c = week(['Push', null, null, null, 'Pull', null, null], [workout('2026-10-26', 'Push', [])]);
      expect(todayStatus(c)).toEqual({ kind: 'rest' });
      expect(nextDay(c).name).toBe('Pull');
    });

    it('is done once a session is saved today', () => {
      const c = week(['Push', null, 'Legs', null, 'Pull', null, null], [workout(wednesday.toISOString(), 'Legs', [])]);
      expect(todayStatus(c)).toEqual({ kind: 'done' });
    });

    it('ignores a week that no longer fits the program', () => {
      expect(todayStatus(week(['Haut', null, 'Bas', null, null, null, null]))).toEqual({ kind: 'free' });
      expect(todayStatus(ctx())).toEqual({ kind: 'free' });
      // Trained today without a fixed week: done all the same, no second session "du jour"
      expect(todayStatus({ ...ctx([workout(new Date().toISOString(), 'Push', [])]), now: new Date() })).toEqual({
        kind: 'done',
      });
    });
  });
});

describe('planLift', () => {
  it('asks for calibration on a new barbell lift', () => {
    const p = planLift(EXERCISES.bench, ctx());
    expect(p.decision).toBe('calibrate');
    expect(deltaLabel(p)).toBe('à régler');
  });

  it('starts bodyweight lifts right away', () => {
    const p = planLift(EXERCISES.dips, ctx());
    expect(p.decision).toBe('start');
    expect(targetLabel(p.targets)).toBe('3 × 8 · Poids du corps');
    expect(targetLoad(p.targets)).toBe('Poids du corps × 8');
    expect(targetLoad([])).toBe('');
  });

  it('starts from a PR when there is one', () => {
    const p = planLift(
      EXERCISES.bench,
      ctx([], {
        prs: [{ exercise: 'Développé couché', weight: 100, reps: 1, oneRepMax: 100, date: '2026-01-01' }],
      }),
    );
    expect(p.decision).toBe('start');
    expect(p.targets[0]?.weight).toBe(70);
  });

  it('reads history under an old exercise name', () => {
    const p = planLift(
      EXERCISES.bench,
      ctx([workout('2026-10-01', 'Push', [lift('Développé couché barre', 62.5, [9, 9, 9])])]),
    );
    expect(p.decision).toBe('add_reps');
    expect(targetLabel(p.targets)).toBe('3 × 10 · 62,5 kg');
    expect(targetLoad(p.targets)).toBe('62,5 kg × 10');
  });

  it('uses the increment chosen by the user', () => {
    const c = ctx([workout('2026-10-01', 'Push', [lift('Développé couché', 60, [12, 12, 12])])]);
    c.settings.increments['Développé couché'] = 5;
    const p = planLift(EXERCISES.bench, c);
    expect(p.decision).toBe('add_weight');
    expect(p.targets[0]?.weight).toBe(65);
    expect(deltaLabel(p)).toBe('+5 kg');
  });

  it('uses the sets and reps the user chose for the exercise', () => {
    const c = ctx([workout('2026-10-01', 'Push', [lift('Développé couché', 60, [8, 8, 8, 8, 8])])]);
    c.settings.ruleOverrides = { 'Développé couché': { sets: 5, repMin: 5, repMax: 8 } };
    const p = planLift(EXERCISES.bench, c);
    expect(p.rule).toMatchObject({ sets: 5, repMin: 5, repMax: 8 });
    expect(p.decision).toBe('add_weight');
    expect(p.targets).toHaveLength(5);
  });

  it('goes heavy and rests longer for strength on barbell lifts only', () => {
    const c = ctx([], { goal: 'force' });
    expect(planLift(EXERCISES.squat, c).rule).toMatchObject({ sets: 5, repMin: 3, repMax: 5 });
    expect(planLift(EXERCISES.squat, c).restTime).toBe(240);
    expect(planLift(EXERCISES.curl, c).rule).toMatchObject({ sets: 3, repMin: 8 });
  });
});

describe('personal touches', () => {
  it('starts lighter after a break and says why', () => {
    const c = ctx([workout('2026-10-01T18:00:00Z', 'Push', [lift('Développé couché', 80, [12, 12, 12])])]);
    c.now = new Date('2026-10-22T18:00:00Z');
    const p = planLift(EXERCISES.bench, c);
    expect(p).toMatchObject({ decision: 'comeback', daysOff: 21 });
    expect(p.targets[0]?.weight).toBe(72.5); // 72 kg, on the nearest step
    expect(deltaLabel(p)).toBe('reprise');
    expect(reasonLabel(p)).toBe(
      '3 semaines sans cet exercice : on reprend un peu plus léger pour retrouver tes marques.',
    );
  });

  it('rests by kind of exercise, or as the user chose', () => {
    const c = ctx();
    expect(planLift(EXERCISES.squat, c)).toMatchObject({ restTime: 180, restSource: 'kind' });
    expect(planLift(EXERCISES.curl, c).restTime).toBe(120);
    c.settings.restOverrides = { Squat: 150 };
    expect(planLift(EXERCISES.squat, c)).toMatchObject({ restTime: 150, restSource: 'own' });
  });

  it('counts a plate-loaded machine per side, unless the user has a stack', () => {
    const c = ctx();
    const press = planLift(EXERCISES.chestpress, c);
    expect(press).toMatchObject({ plateLoaded: true, rule: { increment: 2.5 } });
    expect(toActiveExercise(press).plateLoaded).toBe(true);
    // A single muscle on a stack moves by 2,5 kg, a big movement by a full stack plate
    expect(planLift(EXERCISES.pecdeck, c)).toMatchObject({ plateLoaded: false, rule: { increment: 2.5 } });
    expect(toActiveExercise(planLift(EXERCISES.pecdeck, c)).plateLoaded).toBeUndefined();
    c.settings.plateLoaded = { 'Chest press': false };
    expect(planLift(EXERCISES.chestpress, c)).toMatchObject({ plateLoaded: false, rule: { increment: 5 } });
  });

  it('learns the rest the user really takes', () => {
    const sets = [0, 200, 200, 200].map((restTaken, i) => ({
      weight: 60,
      reps: 10,
      setType: 'normal' as const,
      completed: true,
      restTaken: i === 0 ? undefined : restTaken,
    }));
    const done = { ...lift('Curl haltères', 12, []), sets };
    const c = ctx([workout('2026-10-01', 'Pull', [done]), workout('2026-10-03', 'Pull', [done])]);
    const p = planLift(EXERCISES.curl, c);
    expect(p).toMatchObject({ restTime: 195, restSource: 'learned' });
    expect(toActiveExercise(p).restNote).toMatch(/tu prends ton temps/);
    expect(toActiveExercise(p).sets[0]?.restTime).toBe(195);
  });

  it('plans the user own exercises in their days', () => {
    const own = {
      name: 'Écarté Panatta',
      equipment: 'machine' as const,
      category: 'isolation' as const,
      muscleGroups: ['chest' as const],
    };
    const c = ctx();
    c.settings.customExercises = [own];
    c.settings.customDays = { 'ppl/Push': ['Écarté Panatta', 'Développé couché'] };
    expect(nextDay(c).exercises.map((e) => e.name)).toEqual(['Écarté Panatta', 'Développé couché']);
  });

  it('says how long the break was', () => {
    expect(breakLabel(10)).toBe('1 semaine');
    expect(breakLabel(15)).toBe('2 semaines');
    expect(breakLabel(45)).toBe('1 mois');
    expect(breakLabel(95)).toBe('3 mois');
  });
});

describe('planDay', () => {
  it('turns a day into active exercises', () => {
    const day = planDay({ name: 'Push', exercises: [EXERCISES.bench, EXERCISES.dips] }, ctx());
    const active = toActiveExercises(day);
    expect(active[0]).toMatchObject({ name: 'Développé couché', needsWeight: true, calibration: true });
    expect(active[1]).toMatchObject({ name: 'Dips', needsWeight: false, equipment: 'bodyweight' });
    expect(active[1]?.sets).toHaveLength(3);
    expect(active[1]?.sets[0]).toMatchObject({
      reps: 8,
      completed: false,
      restTime: 180,
      target: { weight: 0, reps: 8 },
    });
  });
});

describe('tonnage', () => {
  it('counts validated working sets only', () => {
    const ex = lift('Squat', 100, [5, 5]);
    ex.sets.push({ weight: 100, reps: 5, setType: 'normal', completed: false });
    ex.sets.push({ weight: 40, reps: 10, setType: 'warmup', completed: true });
    expect(tonnage(workout('2026-10-01', 'Legs', [ex]))).toBe(1000);
  });
});

describe('last time and reason', () => {
  it('carries the last session into the plan and the active exercise', () => {
    const history = [workout('2026-10-01', 'Push', [lift('Développé couché', 60, [10, 10, 9])])];
    const planned = planLift(EXERCISES.bench, ctx(history));
    expect(planned.last).toEqual([
      { weight: 60, reps: 10 },
      { weight: 60, reps: 10 },
      { weight: 60, reps: 9 },
    ]);
    const [active] = toActiveExercises({ name: 'Push', lifts: [planned], minutes: 10 });
    expect(active).toMatchObject({
      lastTime: '60 kg × 10 · 10 · 9',
      reason: expect.stringContaining('Une rep de plus'),
    });
  });

  it('writes the last time at bodyweight', () => {
    expect(
      lastTimeLabel([
        { weight: 0, reps: 12 },
        { weight: 0, reps: 11 },
      ]),
    ).toBe('Poids du corps × 12 · 11');
  });

  it('writes bodyweight and assisted loads', () => {
    expect(loadLabel(0, 12)).toBe('Poids du corps × 12');
    expect(loadLabel(30, 8, false, true)).toBe('Aide : 30 kg × 8');
    expect(loadLabel(30, 40, true, true)).toBe('Aide : 30 kg × 40 s');
    expect(targetLabel([{ weight: 0, reps: 8 }])).toBe('1 × 8 · Poids du corps');
    expect(targetLabel([{ weight: 0, reps: 30 }], true)).toBe('1 × 30 s');
    expect(targetLabel([{ weight: 30, reps: 8 }], false, true)).toBe('1 × 8 · Aide : 30 kg');
    expect(targetLoad([{ weight: 30, reps: 8 }], false, true)).toBe('Aide : 30 kg × 8');
  });

  it('leaves a kept top set out of the target, and says it is kept', () => {
    const targets = [
      { weight: 185, reps: 3, top: true },
      { weight: 165, reps: 5 },
      { weight: 165, reps: 5 },
    ];
    expect(targetLabel(targets)).toBe('2 × 5 · 165 kg');
    expect(targetLoad(targets)).toBe('165 kg × 5');
    const rule = { kind: 'double' as const, sets: 3, repMin: 3, repMax: 5, increment: 2.5 };
    expect(reasonLabel({ decision: 'add_reps', rule, targets })).toContain('Ton top set reste tel quel');
  });

  it.each<[ProgressionDecision, number, string]>([
    ['add_weight', 60, 'atteint 12 reps : on ajoute 2,5 kg'],
    ['add_reps', 60, 'À 12 reps partout'],
    ['add_reps', 0, 'Une rep de plus par série que la dernière fois'],
    ['add_two_reps', 60, 'était facile : deux reps de plus'],
    ['hold', 60, 'était à fond : on garde la même cible'],
    ['repeat', 60, 'sous 8 reps'],
    ['deload', 60, "Deux séances de suite sous 8 reps à ce poids : on allège d'environ 10 %"],
    ['ease', 0, 'on part des reps que tu as vraiment faites'],
    ['start', 60, '70 % de ton record'],
    ['start', 0, 'vise le bas de la fourchette'],
    ['calibrate', 0, 'choisis ta charge'],
  ])('explains %s', (decision, weight, expected) => {
    const rule = { kind: 'double' as const, sets: 3, repMin: 8, repMax: 12, increment: 2.5 };
    expect(reasonLabel({ decision, rule, targets: [{ weight, reps: 8 }] })).toContain(expected);
  });

  it('explains seconds and assisted machines in their own words', () => {
    const rule = { kind: 'double' as const, sets: 3, repMin: 30, repMax: 60, increment: 2.5, repStep: 5 };
    const targets = [{ weight: 10, reps: 30 }];
    expect(reasonLabel({ decision: 'deload', rule, targets })).toContain('sous 30 s');
    expect(reasonLabel({ decision: 'ease', rule, targets })).toContain('tenu');
    const reps = { ...rule, repMin: 8, repMax: 12, repStep: undefined };
    const def = { name: 'Tractions assistées', assisted: true };
    expect(reasonLabel({ decision: 'add_weight', rule: reps, targets, def })).toContain("on enlève 2,5 kg d'aide");
    expect(reasonLabel({ decision: 'deload', rule: reps, targets, def })).toContain("plus d'aide");
    expect(deltaLabel({ decision: 'add_weight', rule: reps, def })).toBe("−2,5 kg d'aide");
    expect(deltaLabel({ decision: 'deload', rule: reps, def })).toBe("plus d'aide");
  });

  it('offers the easier variant when bodyweight reps are lowered', () => {
    const rule = { kind: 'double' as const, sets: 3, repMin: 8, repMax: 12, increment: 2.5 };
    const targets = [{ weight: 0, reps: 3 }];
    expect(reasonLabel({ decision: 'ease', rule, targets, def: EXERCISES.pullup })).toContain(
      'Essaie plutôt « Tractions assistées »',
    );
    expect(reasonLabel({ decision: 'ease', rule, targets, def: EXERCISES.crunch })).not.toContain('Essaie');
  });
});

describe('newRecords', () => {
  const bench = (date: string, weight: number) => workout(date, 'Push', [lift('Développé couché', weight, [8])]);

  it('spots a lift heavier than ever before', () => {
    const today = bench('2026-10-10', 65);
    expect(newRecords(today, [today, bench('2026-10-03', 62.5), bench('2026-09-26', 60)])).toEqual([
      { name: 'Développé couché', weight: 65, previous: 62.5 },
    ]);
  });

  it('does not celebrate a first session or a tie', () => {
    const first = bench('2026-10-10', 65);
    expect(newRecords(first, [first])).toEqual([]);
    expect(newRecords(first, [first, bench('2026-10-03', 65)])).toEqual([]);
  });

  it('never celebrates more help on an assisted machine', () => {
    const pull = (date: string, weight: number) => workout(date, 'Pull', [lift('Tractions assistées', weight, [8])]);
    const today = pull('2026-10-10', 40);
    expect(newRecords(today, [today, pull('2026-10-03', 30)])).toEqual([]);
  });

  it('ignores later sessions and unknown exercises', () => {
    const old = bench('2026-10-03', 60);
    expect(newRecords(old, [old, bench('2026-10-10', 50)])).toEqual([]);
    const odd = workout('2026-10-10', 'x', [lift('Zercher', 100, [5])]);
    expect(newRecords(odd, [odd, workout('2026-10-01', 'x', [lift('Zercher', 80, [5])])])).toEqual([]);
  });
});

describe('labels', () => {
  const rule = { kind: 'double' as const, sets: 3, repMin: 8, repMax: 12, increment: 2.5 };

  it.each<[ProgressionDecision, string]>([
    ['add_reps', '+1 rep'],
    ['add_two_reps', '+2 reps'],
    ['hold', 'même cible'],
    ['add_weight', '+2,5 kg'],
    ['repeat', 'même cible'],
    ['deload', 'allégé'],
    ['ease', 'à ta mesure'],
    ['start', 'départ'],
    ['calibrate', 'à régler'],
  ])('sums up %s', (decision, expected) => {
    expect(deltaLabel({ decision, rule })).toBe(expected);
  });
});

describe('weightHistory', () => {
  it('lists the reference weight per session, oldest first, skipping bodyweight', () => {
    const history = [
      workout('2026-10-08', 'Legs', [lift('Squat', 105, [5])]),
      workout('2026-10-01', 'Legs', [lift('Squat', 100, [5])]),
      workout('2026-09-24', 'Legs', [lift('Squat', 0, [5])]),
    ];
    expect(weightHistory(EXERCISES.squat, history)).toEqual([
      { date: '2026-10-01', weight: 100 },
      { date: '2026-10-08', weight: 105 },
    ]);
  });
});

describe('timed exercises', () => {
  const held = { kind: 'double' as const, sets: 3, repMin: 30, repMax: 60, increment: 2.5, repStep: 5 };
  const targets = [
    { weight: 0, reps: 45 },
    { weight: 0, reps: 40 },
  ];

  it('says seconds everywhere', () => {
    expect(targetLabel(targets, true)).toBe('2 × 40 s');
    expect(targetLoad(targets, true)).toBe('40 s');
    expect(targetLoad([{ weight: 10, reps: 45 }], true)).toBe('10 kg × 45 s');
    expect(lastTimeLabel(targets, true)).toBe('45 · 40 s');
    expect(deltaLabel({ decision: 'add_reps', rule: held })).toBe('+5 s');
    expect(deltaLabel({ decision: 'add_two_reps', rule: held })).toBe('+10 s');
  });

  it('explains the target in seconds', () => {
    const base = { rule: held, targets };
    expect(reasonLabel({ ...base, decision: 'add_reps' })).toBe('5 secondes de plus par série que la dernière fois.');
    expect(reasonLabel({ ...base, decision: 'add_two_reps' })).toBe(
      'Ta dernière série était facile : 10 secondes de plus par série.',
    );
    expect(reasonLabel({ ...base, decision: 'repeat' })).toBe(
      'Une série a tenu moins de 30 s : on garde la même cible.',
    );
    expect(reasonLabel({ ...base, decision: 'add_weight' })).toBe(
      'Toutes tes séries ont tenu 60 s : on ajoute 2,5 kg.',
    );
  });

  it('plans a plank in seconds and marks it timed', () => {
    const plank = planLift(EXERCISES.plank, ctx());
    expect(plank.rule).toMatchObject({ repMin: 30, repMax: 60, repStep: 5 });
    expect(plank.targets.map((x) => x.reps)).toEqual([30, 30, 30]);
    expect(toActiveExercise(plank).timed).toBe(true);
    expect(toActiveExercise(planLift(EXERCISES.squat, ctx())).timed).toBeUndefined();
  });
});

describe('supersets', () => {
  it('groups each exercise chained with the next, three in a row included', () => {
    expect(supersetGroups(['a', 'b', 'c', 'd'], ['a'])).toEqual(['a', 'a', undefined, undefined]);
    expect(supersetGroups(['a', 'b', 'c', 'd'], ['a', 'b'])).toEqual(['a', 'a', 'a', undefined]);
    expect(supersetGroups(['a', 'b'], ['b'])).toEqual([undefined, undefined]);
    expect(supersetGroups(['a', 'b'])).toEqual([undefined, undefined]);
  });

  it("reads the day's links and starts the session with them", () => {
    const day = { name: 'Push', exercises: [EXERCISES.bench, EXERCISES.ohp, EXERCISES.dips] };
    const c = ctx();
    const plan = planDay(day, { ...c, settings: { ...c.settings, supersets: { 'ppl/Push': ['Développé couché'] } } });
    expect(plan.links).toEqual(['Développé couché']);
    expect(toActiveExercises(plan).map((e) => e.superset)).toEqual(['Développé couché', 'Développé couché', undefined]);
    expect(planDay(day, c).links).toBeUndefined();
  });
});

describe('the engine through planLift', () => {
  const at = (date: string, name: string, weight: number, reps: number[]) =>
    workout(date, 'Push', [lift(name, weight, reps)]);

  it('never comes back under the empty bar', () => {
    const c = { ...ctx([at('2026-09-01', 'Développé couché', 20, [12, 12, 12])]), now: new Date(2026, 9, 15) };
    c.settings = { ...c.settings, barWeight: 20 };
    const p = planLift(EXERCISES.bench, c);
    expect(p.decision).toBe('comeback');
    expect(p.targets.map((x) => x.weight)).toEqual([20, 20, 20]);
  });

  it('progresses an assisted machine by taking help away, with no start from a record', () => {
    const c = ctx([at('2026-10-01', 'Tractions assistées', 30, [12, 12, 12])]);
    const p = planLift(EXERCISES.assisted, c);
    expect(p.decision).toBe('add_weight');
    expect(p.targets[0]?.weight).toBe(25); // one stack plate of help less
    const first = planLift(EXERCISES.assisted, {
      ...ctx([], {
        prs: [{ exercise: 'Tractions assistées', weight: 30, reps: 1, oneRepMax: 30, date: '2026-01-01' }],
      }),
    });
    expect(first.decision).toBe('calibrate');
    expect(toActiveExercise(p).assisted).toBe(true);
  });

  it('steps cables by 2,5 kg and rests per goal', () => {
    const c = ctx([at('2026-10-01', 'Élévations latérales poulie', 10, [12, 12, 12])]);
    expect(planLift(EXERCISES.cablelateral, c).targets[0]?.weight).toBe(12.5);
    const forme = ctx([], { goal: 'forme' });
    forme.settings = { ...forme.settings, defaultRestTime: 60 };
    expect(planLift(EXERCISES.squat, forme).restTime).toBe(90);
  });

  it('marks a kept top set as a top set in the logger', () => {
    const top: Exercise = {
      ...lift('Développé couché', 100, [3, 10, 10, 10]),
      sets: [
        { weight: 120, reps: 3, setType: 'normal', completed: true },
        ...[10, 10, 10].map((r) => ({ weight: 100, reps: r, setType: 'normal' as const, completed: true })),
      ],
    };
    const active = toActiveExercise(planLift(EXERCISES.bench, ctx([workout('2026-10-01', 'Push', [top])])));
    expect(active.sets.map((s) => s.setType)).toEqual(['top', 'normal', 'normal']);
    expect(active.sets[0]?.target).toEqual({ weight: 120, reps: 3 });
  });
});

describe('breakDays', () => {
  const now = new Date('2026-10-26T12:00:00Z');
  const w = (date: string) => ({ date });

  it("counts the user's own break, not the longest one of a single exercise", () => {
    const lifts = [{ decision: 'comeback' as const }, { decision: 'add_reps' as const }];
    expect(breakDays(lifts, [w('2026-10-01T12:00:00Z'), w('2026-09-01T12:00:00Z')], now)).toBe(25);
  });

  it('says nothing when no lift comes back, or the user trained recently', () => {
    expect(breakDays([{ decision: 'add_reps' }], [w('2026-10-01')], now)).toBe(0);
    expect(breakDays([{ decision: 'comeback' }], [w('2026-10-20')], now)).toBe(0);
    expect(breakDays([{ decision: 'comeback' }], [], now)).toBe(0);
  });
});
