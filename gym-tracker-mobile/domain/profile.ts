import { profileSchema } from '@/domain/schemas';
import type { Goal, Program, UserProfile } from '@/types';

const OLD_GOALS: Record<string, Goal> = {
  hypertrophy: 'muscle',
  pr: 'force',
  weight_loss: 'forme',
  health: 'forme',
  consistency: 'muscle',
};

/**
 * A stored profile, whatever version wrote it. Profiles from the previous
 * app have no goal/program: we map what they had. Null if it is unusable.
 */
export function normalizeProfile(raw: unknown): UserProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const old = raw as Partial<UserProfile> & {
    onboarding?: { primaryGoal?: string };
    trainingFrequency?: number;
  };
  const program: Program = old.program ?? {
    split: 'ppl',
    perWeek: Math.min(5, Math.max(2, old.trainingFrequency ?? 3)),
  };
  const result = profileSchema.safeParse({
    name: old.name,
    goal: old.goal ?? OLD_GOALS[old.onboarding?.primaryGoal ?? ''] ?? 'muscle',
    program,
    experience: old.experience,
    prs: old.prs ?? [],
    bodyStats: old.bodyStats ?? [],
  });
  return result.success ? result.data : null;
}
