import { create } from 'zustand';
import { normalizeProfile } from '@/domain/profile';
import { loadProfileLocal, saveProfileLocal } from '@/services/db';
import { flushSyncQueue } from '@/services/sync';
import type { PersonalRecord, UserProfile } from '@/types';

interface ProfileStore {
  profile: UserProfile | null;

  loadProfile: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  addPR: (pr: PersonalRecord) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,

  loadProfile: async () => {
    set({ profile: normalizeProfile(await loadProfileLocal()) });
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
