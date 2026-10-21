import { create } from 'zustand';
import { saveProfileLocal, loadProfileLocal } from '@/lib/db';
import { flushSyncQueue } from '@/lib/sync';
import type { Goal, PersonalRecord, Program, UserProfile } from '@/types';

interface ProfileStore {
  profile: UserProfile | null;

  loadProfile: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  addPR: (pr: PersonalRecord) => Promise<void>;
}

const OLD_GOALS: Record<string, Goal> = {
  hypertrophy: 'muscle',
  pr: 'force',
  weight_loss: 'forme',
  health: 'forme',
  consistency: 'muscle',
};

/** Profiles from the previous app version have no goal/program: map what they had. */
function normalizeProfile(raw: Record<string, unknown>): UserProfile {
  const old = raw as {
    onboarding?: { primaryGoal?: string };
    trainingFrequency?: number;
  } & Partial<UserProfile>;
  const goal = old.goal ?? OLD_GOALS[old.onboarding?.primaryGoal ?? ''] ?? 'muscle';
  const program: Program = old.program ?? {
    split: 'ppl',
    perWeek: Math.min(5, Math.max(2, old.trainingFrequency ?? 3)),
  };
  return {
    name: old.name,
    goal,
    program,
    prs: old.prs ?? [],
    bodyStats: old.bodyStats ?? [],
  };
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,

  loadProfile: async () => {
    const raw = await loadProfileLocal();
    set({ profile: raw ? normalizeProfile(raw as unknown as Record<string, unknown>) : null });
  },

  saveProfile: async (profile) => {
    await saveProfileLocal(profile);
    set({ profile });
    flushSyncQueue().catch(() => null);
  },

  updateProfile: async (patch) => {
    const current = get().profile;
    if (!current) return;
    await get().saveProfile({ ...current, ...patch });
  },

  addPR: async (pr) => {
    const current = get().profile;
    if (!current) return;
    const prs = current.prs.filter((p) => p.exercise.toLowerCase() !== pr.exercise.toLowerCase());
    await get().saveProfile({ ...current, prs: [...prs, pr] });
  },
}));
