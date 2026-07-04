import {
  RANKS,
  getRankByXP,
  getProgressToNextRank,
  getNextRank,
  calculateXPFromWorkouts,
  calculateStreakFromWorkouts,
  getUnlockedBadges,
  getNextBadges,
  getMuscleActivity,
  getRecoveredMuscles,
} from '@/lib/gamification';
import type { Workout, MuscleGroup, GamificationData, UserProfile } from '@/types';

// ── Fixtures ─────────────────────────────────────────────────────

/** Séance datée à midi (heure locale) il y a `daysAgo` jours — évite les
 *  effets de bord de fuseau autour de minuit dans le calcul de streak. */
function workout(daysAgo: number, overrides: Partial<Workout> = {}): Workout {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(12, 0, 0, 0);
  return {
    id: `w-${daysAgo}-${Math.random()}`,
    date: d.toISOString(),
    name: 'Push',
    type: 'strength',
    exercises: [],
    feeling: 3,
    completed: true,
    ...overrides,
  };
}

function exerciseWith(muscles: MuscleGroup[], sets: Array<{ weight: number; reps: number }>) {
  return {
    id: `e-${Math.random()}`,
    name: 'Exercice',
    category: 'compound' as const,
    muscleGroups: muscles,
    sets: sets.map((s) => ({ ...s, setType: 'normal' as const, completed: true })),
  };
}

const gamificationData = (over: Partial<GamificationData> = {}): GamificationData => ({
  workouts: [],
  profile: null,
  totalXP: 0,
  streak: 0,
  ...over,
});

// ── RANGS ────────────────────────────────────────────────────────

describe('getRankByXP', () => {
  it('0 XP = Bronze I', () => {
    expect(getRankByXP(0)).toMatchObject({ tier: 'bronze', level: 1 });
  });

  it('couvre la borne minXP exacte de chaque rang', () => {
    for (const rank of RANKS) {
      expect(getRankByXP(rank.minXP)).toEqual(rank);
    }
  });

  it('la borne maxXP appartient au rang suivant (intervalle semi-ouvert)', () => {
    expect(getRankByXP(500)).toMatchObject({ tier: 'bronze', level: 2 });
    expect(getRankByXP(499)).toMatchObject({ tier: 'bronze', level: 1 });
  });

  it('XP énorme = Légende', () => {
    expect(getRankByXP(10_000_000)).toMatchObject({ tier: 'legend' });
  });

  it('les rangs sont contigus (aucun trou entre maxXP et minXP suivant)', () => {
    for (let i = 0; i < RANKS.length - 1; i++) {
      expect(RANKS[i]!.maxXP).toBe(RANKS[i + 1]!.minXP);
    }
  });
});

describe('getProgressToNextRank', () => {
  it('0 % au début du rang, 50 % au milieu', () => {
    expect(getProgressToNextRank(0)).toBe(0);
    expect(getProgressToNextRank(250)).toBe(50);
  });

  it('100 % pour le rang Légende (maxXP = Infinity)', () => {
    expect(getProgressToNextRank(200_000)).toBe(100);
  });
});

describe('getNextRank', () => {
  it('Bronze I → Bronze II', () => {
    expect(getNextRank('bronze', 1)).toMatchObject({ tier: 'bronze', level: 2 });
  });
  it('Légende n’a pas de rang suivant', () => {
    expect(getNextRank('legend', 1)).toBeNull();
  });
  it('tier inconnu → null', () => {
    expect(getNextRank('bronze', 99)).toBeNull();
  });
});

// ── STREAK ───────────────────────────────────────────────────────

describe('calculateStreakFromWorkouts', () => {
  it('0 sans séance', () => {
    expect(calculateStreakFromWorkouts([])).toBe(0);
  });

  it("1 pour une séance aujourd'hui", () => {
    expect(calculateStreakFromWorkouts([workout(0)])).toBe(1);
  });

  it('2 séances le même jour comptent pour 1 jour de streak', () => {
    expect(calculateStreakFromWorkouts([workout(0), workout(0), workout(1)])).toBe(2);
  });

  it('streak consécutif sur 3 jours', () => {
    expect(calculateStreakFromWorkouts([workout(0), workout(1), workout(2)])).toBe(3);
  });

  it('un trou de 2 jours casse le streak', () => {
    expect(calculateStreakFromWorkouts([workout(0), workout(3), workout(4)])).toBe(1);
  });

  it("le streak survit si la dernière séance date d'hier (pas encore cassé)", () => {
    expect(calculateStreakFromWorkouts([workout(1), workout(2)])).toBe(2);
  });
});

// ── XP ───────────────────────────────────────────────────────────

describe('calculateXPFromWorkouts', () => {
  it('0 workout = 0 XP', () => {
    expect(calculateXPFromWorkouts([])).toBe(0);
  });

  it('décompose correctement une séance simple', () => {
    // base 50 + 0 set + durée 60min (60) + volume 0 + feeling 3 (20)
    // + récent ≤7j (20) + streak 1 (15) = 165
    const w = workout(0, { duration: 60 });
    expect(calculateXPFromWorkouts([w])).toBe(165);
  });

  it('compte les sets (5 XP/set) et le volume (2 XP/100kg)', () => {
    // 2 sets de 100kg x 5 = 1000kg de volume
    // base 50 + sets 10 + volume 20 + feeling 20 + récent 20 + streak 15 = 135 + xp durée 0
    const w = workout(0, {
      exercises: [exerciseWith(['chest'], [{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }])],
    });
    expect(calculateXPFromWorkouts([w])).toBe(135);
  });

  it("une séance vieille de 30 jours ne touche pas le bonus récent", () => {
    const recent = calculateXPFromWorkouts([workout(0, { duration: 0 })]);
    const old = calculateXPFromWorkouts([workout(30, { duration: 0 })]);
    // même séance : différence = bonus récent (20) + streak (15)
    expect(recent - old).toBe(35);
  });

  it('ne retourne jamais NaN', () => {
    const weird = workout(0, { duration: undefined, feeling: undefined as never });
    expect(Number.isNaN(calculateXPFromWorkouts([weird]))).toBe(false);
  });
});

// ── BADGES ───────────────────────────────────────────────────────

describe('getUnlockedBadges', () => {
  it('aucun badge sans données', () => {
    expect(getUnlockedBadges(gamificationData())).toHaveLength(0);
  });

  it('first_workout se débloque à la première séance', () => {
    const unlocked = getUnlockedBadges(gamificationData({ workouts: [workout(0)] }));
    expect(unlocked.map((b) => b.id)).toContain('first_workout');
  });

  it('streak_7 exige un streak ≥ 7', () => {
    const at6 = getUnlockedBadges(gamificationData({ streak: 6 }));
    const at7 = getUnlockedBadges(gamificationData({ streak: 7 }));
    expect(at6.map((b) => b.id)).not.toContain('streak_7');
    expect(at7.map((b) => b.id)).toContain('streak_7');
  });

  it('volume_1ton : 1000 kg dans UNE séance (pas cumulé)', () => {
    const w500a = workout(0, { exercises: [exerciseWith(['chest'], [{ weight: 100, reps: 5 }])] });
    const w500b = workout(1, { exercises: [exerciseWith(['back'], [{ weight: 100, reps: 5 }])] });
    const cumulated = getUnlockedBadges(gamificationData({ workouts: [w500a, w500b] }));
    expect(cumulated.map((b) => b.id)).not.toContain('volume_1ton');

    const oneTon = workout(0, {
      exercises: [exerciseWith(['legs'], [{ weight: 200, reps: 5 }])],
    });
    const single = getUnlockedBadges(gamificationData({ workouts: [oneTon] }));
    expect(single.map((b) => b.id)).toContain('volume_1ton');
  });

  it('bench_100 matche le nom d’exercice en français (« couché »)', () => {
    const profile = {
      prs: [{ exercise: 'Développé couché', weight: 100, reps: 1, oneRepMax: 100, date: new Date().toISOString() }],
    } as unknown as UserProfile;
    const unlocked = getUnlockedBadges(gamificationData({ profile }));
    expect(unlocked.map((b) => b.id)).toContain('bench_100');
  });
});

describe('getNextBadges', () => {
  it('retourne au plus 5 badges, triés par progression décroissante', () => {
    const next = getNextBadges(gamificationData({ workouts: [workout(0)], streak: 2 }));
    expect(next.length).toBeLessThanOrEqual(5);
    for (let i = 0; i < next.length - 1; i++) {
      expect(next[i]!.currentProgress).toBeGreaterThanOrEqual(next[i + 1]!.currentProgress);
    }
  });
});

// ── MUSCLE ACTIVITY / RÉCUPÉRATION ───────────────────────────────

describe('getMuscleActivity', () => {
  it('tout à 0 sans séance', () => {
    const activity = getMuscleActivity([]);
    for (const v of Object.values(activity)) expect(v).toBe(0);
  });

  it('normalise sur le muscle le plus travaillé (max = 100)', () => {
    const w = workout(1, {
      exercises: [
        exerciseWith(['chest'], [{ weight: 60, reps: 8 }, { weight: 60, reps: 8 }, { weight: 60, reps: 8 }]),
        exerciseWith(['back'], [{ weight: 60, reps: 8 }]),
      ],
    });
    const activity = getMuscleActivity([w]);
    expect(activity.chest).toBe(100);
    expect(activity.back).toBe(33);
    expect(activity.legs).toBe(0);
  });

  it('ignore les séances hors fenêtre', () => {
    const w = workout(10, { exercises: [exerciseWith(['chest'], [{ weight: 60, reps: 8 }])] });
    expect(getMuscleActivity([w], 7).chest).toBe(0);
  });
});

describe('getRecoveredMuscles', () => {
  it('tous récupérés sans historique', () => {
    expect(getRecoveredMuscles([])).toHaveLength(8);
  });

  it('un muscle travaillé il y a < 48 h n’est pas récupéré', () => {
    const w = workout(1, { exercises: [exerciseWith(['chest'], [{ weight: 60, reps: 8 }])] });
    const recovered = getRecoveredMuscles([w]);
    expect(recovered).not.toContain('chest');
    expect(recovered).toContain('back');
  });

  it('un muscle travaillé il y a 3 jours est récupéré', () => {
    const w = workout(3, { exercises: [exerciseWith(['chest'], [{ weight: 60, reps: 8 }])] });
    expect(getRecoveredMuscles([w])).toContain('chest');
  });
});
