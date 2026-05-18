import type { Href } from 'expo-router';
import type { OnboardingGoal } from '@/types';

/**
 * Flux d'onboarding adapté à chaque goal.
 * Les 4 premières étapes sont communes (name → goal → level → frequency).
 * Les étapes 5+ varient selon le goal choisi.
 */

type FlowStep = {
  /** Path Expo Router (sans le préfixe '/(auth)') */
  route: string;
};

const COMMON_PREFIX: FlowStep[] = [
  { route: '/(auth)/onboarding/name' },
  { route: '/(auth)/onboarding/goal' },
  { route: '/(auth)/onboarding/level' },
  { route: '/(auth)/onboarding/frequency' },
];

const FLOWS: Record<OnboardingGoal, FlowStep[]> = {
  pr: [
    ...COMMON_PREFIX,
    { route: '/(auth)/onboarding/bench' },
    { route: '/(auth)/onboarding/squat' },
    { route: '/(auth)/onboarding/deadlift' },
    { route: '/(auth)/onboarding/done' },
  ],
  hypertrophy: [
    ...COMMON_PREFIX,
    { route: '/(auth)/onboarding/muscle-focus' },
    { route: '/(auth)/onboarding/body-stats' },
    { route: '/(auth)/onboarding/records' },
    { route: '/(auth)/onboarding/done' },
  ],
  weight_loss: [
    ...COMMON_PREFIX,
    { route: '/(auth)/onboarding/current-weight' },
    { route: '/(auth)/onboarding/target-weight' },
    { route: '/(auth)/onboarding/cardio' },
    { route: '/(auth)/onboarding/done' },
  ],
  consistency: [
    ...COMMON_PREFIX,
    { route: '/(auth)/onboarding/preferred-days' },
    { route: '/(auth)/onboarding/time-of-day' },
    { route: '/(auth)/onboarding/reminder' },
    { route: '/(auth)/onboarding/done' },
  ],
  health: [
    ...COMMON_PREFIX,
    { route: '/(auth)/onboarding/health-focus' },
    { route: '/(auth)/onboarding/sport-background' },
    { route: '/(auth)/onboarding/done' },
  ],
};

/** Goal par défaut si l'utilisateur arrive sur une étape sans avoir choisi */
const DEFAULT_GOAL: OnboardingGoal = 'pr';

export function parseGoal(raw: unknown): OnboardingGoal {
  if (typeof raw !== 'string') return DEFAULT_GOAL;
  if (raw === 'pr' || raw === 'hypertrophy' || raw === 'weight_loss' ||
      raw === 'consistency' || raw === 'health') {
    return raw;
  }
  return DEFAULT_GOAL;
}

/** Nombre total d'étapes du flux pour ce goal (utilisé par la progress bar) */
export function getTotalSteps(goal: OnboardingGoal): number {
  return FLOWS[goal].length;
}

/** Route de l'étape suivante dans le flux du goal donné */
export function getNextRoute(goal: OnboardingGoal, currentStep: number): Href {
  const flow = FLOWS[goal];
  const next = flow[currentStep];
  return (next ? next.route : '/(auth)/onboarding/done') as Href;
}
