import { parseGoal, getTotalSteps, getNextRoute } from '@/lib/onboardingFlow';
import type { OnboardingGoal } from '@/types';

const ALL_GOALS: OnboardingGoal[] = ['pr', 'hypertrophy', 'weight_loss', 'consistency', 'health'];

// ── parseGoal ────────────────────────────────────────────────────

describe('parseGoal', () => {
  it('accepte chaque goal valide', () => {
    for (const goal of ALL_GOALS) {
      expect(parseGoal(goal)).toBe(goal);
    }
  });

  it('retombe sur "pr" pour une string inconnue', () => {
    expect(parseGoal('musculation')).toBe('pr');
    expect(parseGoal('')).toBe('pr');
    expect(parseGoal('PR')).toBe('pr'); // casse stricte
  });

  it('retombe sur "pr" pour tout ce qui n’est pas une string', () => {
    expect(parseGoal(undefined)).toBe('pr');
    expect(parseGoal(null)).toBe('pr');
    expect(parseGoal(42)).toBe('pr');
    expect(parseGoal(['hypertrophy'])).toBe('pr');
  });
});

// ── getTotalSteps ────────────────────────────────────────────────

describe('getTotalSteps', () => {
  it('health a 7 étapes, les autres goals en ont 8', () => {
    expect(getTotalSteps('health')).toBe(7);
    for (const goal of ['pr', 'hypertrophy', 'weight_loss', 'consistency'] as const) {
      expect(getTotalSteps(goal)).toBe(8);
    }
  });
});

// ── getNextRoute ─────────────────────────────────────────────────

describe('getNextRoute', () => {
  it('les 4 premières étapes sont communes à tous les goals', () => {
    const common = [
      '/(auth)/onboarding/name',
      '/(auth)/onboarding/goal',
      '/(auth)/onboarding/level',
      '/(auth)/onboarding/frequency',
    ];
    for (const goal of ALL_GOALS) {
      common.forEach((route, i) => {
        expect(getNextRoute(goal, i)).toBe(route);
      });
    }
  });

  it('chaque flux se termine par "done"', () => {
    for (const goal of ALL_GOALS) {
      const last = getTotalSteps(goal) - 1;
      expect(getNextRoute(goal, last)).toBe('/(auth)/onboarding/done');
    }
  });

  it('les branches spécifiques démarrent à l’étape 5 (index 4)', () => {
    expect(getNextRoute('pr', 4)).toBe('/(auth)/onboarding/bench');
    expect(getNextRoute('hypertrophy', 4)).toBe('/(auth)/onboarding/muscle-focus');
    expect(getNextRoute('weight_loss', 4)).toBe('/(auth)/onboarding/current-weight');
    expect(getNextRoute('consistency', 4)).toBe('/(auth)/onboarding/preferred-days');
    expect(getNextRoute('health', 4)).toBe('/(auth)/onboarding/health-focus');
  });

  it('un index hors flux retombe sur "done" (pas de crash)', () => {
    for (const goal of ALL_GOALS) {
      expect(getNextRoute(goal, getTotalSteps(goal))).toBe('/(auth)/onboarding/done');
      expect(getNextRoute(goal, 999)).toBe('/(auth)/onboarding/done');
    }
  });

  it('aucune étape dupliquée dans un même flux', () => {
    for (const goal of ALL_GOALS) {
      const routes = Array.from({ length: getTotalSteps(goal) }, (_, i) =>
        getNextRoute(goal, i),
      );
      expect(new Set(routes).size).toBe(routes.length);
    }
  });
});
