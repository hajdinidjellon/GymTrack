import { describe, expect, it } from '@jest/globals';
import { EXERCISES } from '@/domain/programs';
import {
  deltaLabel,
  nextDay,
  planDay,
  planLift,
  targetLabel,
  tonnage,
  weightHistory,
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

  it('ignores workouts from another program', () => {
    expect(nextDay(ctx([workout('2026-10-01', 'Séance', [])])).name).toBe('Push');
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
    expect(targetLabel(p.targets)).toBe('3 × 8');
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
  });

  it('uses the increment chosen by the user', () => {
    const c = ctx([workout('2026-10-01', 'Push', [lift('Développé couché', 60, [12, 12, 12])])]);
    c.settings.increments['Développé couché'] = 5;
    const p = planLift(EXERCISES.bench, c);
    expect(p.decision).toBe('add_weight');
    expect(p.targets[0]?.weight).toBe(65);
    expect(deltaLabel(p)).toBe('+5 kg');
  });

  it('goes heavy and rests longer for strength on barbell lifts only', () => {
    const c = ctx([], { goal: 'force' });
    expect(planLift(EXERCISES.squat, c).rule).toMatchObject({ sets: 5, repMin: 3, repMax: 5 });
    expect(planLift(EXERCISES.squat, c).restTime).toBe(180);
    expect(planLift(EXERCISES.curl, c).rule).toMatchObject({ sets: 3, repMin: 8 });
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
      restTime: 90,
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

describe('labels', () => {
  const rule = { kind: 'double' as const, sets: 3, repMin: 8, repMax: 12, increment: 2.5 };

  it.each<[ProgressionDecision, string]>([
    ['add_reps', '+1 rep'],
    ['add_weight', '+2,5 kg'],
    ['repeat', 'même cible'],
    ['deload', 'allégé'],
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
