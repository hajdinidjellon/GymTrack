import {
  calculate1RM,
  calculateWeight,
  getRecommendedReps,
  generateWarmupSets,
  generatePRProgression,
} from '@/lib/aiPlanner';

// ── 1RM (formule d'Epley) ────────────────────────────────────────

describe('calculate1RM', () => {
  it('1 rep = le poids lui-même', () => {
    expect(calculate1RM(100, 1)).toBe(100);
  });

  it('100 kg × 5 ≈ 116,7 kg (Epley, arrondi au dixième)', () => {
    expect(calculate1RM(100, 5)).toBe(116.7);
  });

  it('60 kg × 10 = 80 kg', () => {
    expect(calculate1RM(60, 10)).toBe(80);
  });

  it('reste croissant avec les reps', () => {
    expect(calculate1RM(100, 8)).toBeGreaterThan(calculate1RM(100, 5));
  });

  it('reps=0 ne produit ni NaN ni Infinity', () => {
    expect(Number.isFinite(calculate1RM(100, 0))).toBe(true);
  });
});

// ── Charge cible ─────────────────────────────────────────────────

describe('calculateWeight', () => {
  it('arrondit au multiple de 2,5 kg (plaques réelles)', () => {
    expect(calculateWeight(100, 85)).toBe(85);
    expect(calculateWeight(103, 80)).toBe(82.5);
  });

  it('100 % du 1RM = le 1RM (arrondi)', () => {
    expect(calculateWeight(100, 100)).toBe(100);
  });
});

// ── Reps recommandées par intensité ──────────────────────────────

describe('getRecommendedReps', () => {
  it.each([
    [95, 1],
    [90, 2],
    [85, 3],
    [80, 5],
    [75, 6],
    [70, 8],
    [65, 10],
    [60, 12],
  ])('%i %% → %i reps', (intensity, reps) => {
    expect(getRecommendedReps(intensity)).toBe(reps);
  });

  it('les bornes sont inclusives (85 → 3, 84 → 5)', () => {
    expect(getRecommendedReps(85)).toBe(3);
    expect(getRecommendedReps(84)).toBe(5);
  });
});

// ── Échauffement ─────────────────────────────────────────────────

describe('generateWarmupSets', () => {
  it('charges strictement croissantes et toujours < charge de travail', () => {
    for (const working of [40, 60, 80, 100, 140, 180]) {
      const sets = generateWarmupSets(working, 5);
      const weights = sets.map((s) => s.weight);
      expect(weights).toEqual([...weights].sort((a, b) => a - b));
      expect(Math.max(...weights)).toBeLessThan(working);
    }
  });

  it('tous les sets sont typés warmup et multiples de 2,5', () => {
    for (const s of generateWarmupSets(100, 5)) {
      expect(s.setType).toBe('warmup');
      expect(s.weight % 2.5).toBe(0);
    }
  });

  it('charge légère (≤ 50 kg) : un seul set de chauffe', () => {
    expect(generateWarmupSets(40, 8)).toHaveLength(1);
  });

  it('force max lourde (140 kg × 2) : montée complète en 5 sets', () => {
    const sets = generateWarmupSets(140, 2);
    expect(sets).toHaveLength(5);
    // Le dernier set d'approche est à 1 rep, proche de la charge de travail
    expect(sets[4]!.reps).toBe(1);
    expect(sets[4]!.weight).toBeGreaterThanOrEqual(140 * 0.9);
  });

  it('hypertrophie modérée (100 kg × 5) : 3 sets', () => {
    expect(generateWarmupSets(100, 5)).toHaveLength(3);
  });
});

// ── Génération de plan PR ────────────────────────────────────────

describe('generatePRProgression', () => {
  const base = {
    exerciseName: 'Développé couché',
    currentMax: 100,
    targetMax: 110,
    weeks: 8,
    frequency: 3,
  } as const;

  it('débutant → progression linéaire', () => {
    const plan = generatePRProgression({ ...base, experienceLevel: 'beginner' });
    expect(plan.algorithm).toBe('linear');
    expect(plan.weeks).toHaveLength(8);
    expect(plan.duration).toBe(8);
    expect(plan.frequency).toBe(3);
  });

  it('intermédiaire + hypertrophie → DUP (undulating)', () => {
    const plan = generatePRProgression({
      ...base,
      experienceLevel: 'intermediate',
      trainingGoal: 'hypertrophy',
    });
    expect(plan.algorithm).toBe('undulating');
  });

  it('avancé → 5/3/1', () => {
    const plan = generatePRProgression({ ...base, experienceLevel: 'advanced' });
    expect(plan.algorithm).toBe('5_3_1');
  });

  it('linéaire : la semaine 4 est un deload (intensité réduite)', () => {
    const plan = generatePRProgression({ ...base, experienceLevel: 'beginner' });
    const week4 = plan.weeks[3]!;
    const week3 = plan.weeks[2]!;
    expect(week4.deloadWeek).toBe(true);
    expect(week4.intensity).toBeLessThan(week3.intensity);
  });

  it('le goal embarqué reflète les bornes demandées', () => {
    const plan = generatePRProgression({ ...base, experienceLevel: 'beginner' });
    expect(plan.goal).toMatchObject({
      type: 'pr',
      exercise: 'Développé couché',
      currentValue: 100,
      targetValue: 110,
      status: 'active',
    });
  });

  it('chaque semaine contient `frequency` sessions avec des charges plausibles', () => {
    const plan = generatePRProgression({ ...base, experienceLevel: 'beginner' });
    for (const week of plan.weeks) {
      expect(week.sessions).toHaveLength(3);
      for (const session of week.sessions) {
        for (const ex of session.exercises) {
          expect(ex.targetWeight).toBeGreaterThan(0);
          expect(ex.targetWeight! % 2.5).toBe(0);
        }
      }
    }
  });
});
