import { describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS } from '@/domain/settings';
import { readDataOwner, writeDataOwner } from '@/services/dataOwner';
import { countPendingSync, wipeLocalData } from '@/services/db';
import { getCurrentUserId, signOut } from '@/services/supabase';
import { initialSync, resumeSync } from '@/services/sync';
import {
  clearLocalData,
  loadAccountData,
  pendingAfterSync,
  resumeAccountSync,
  signOutAndClear,
} from '@/stores/accountData';
import { useSessionStore } from '@/stores/sessionStore';
import { useProfileStore } from '@/stores/profileStore';
import { useRecoveryStore } from '@/stores/recoveryStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';

jest.mock('@/services/db', () => ({
  wipeLocalData: jest.fn(() => Promise.resolve()),
  countPendingSync: jest.fn(() => Promise.resolve(0)),
}));
jest.mock('@/services/supabase', () => ({
  getCurrentUserId: jest.fn(() => Promise.resolve(null)),
  signOut: jest.fn(() => Promise.resolve()),
  isSupabaseConfigured: () => true,
}));

jest.mock('@/services/sync', () => ({
  initialSync: jest.fn(() => Promise.reject(new Error('offline'))),
  resumeSync: jest.fn(() => Promise.resolve(false)),
  flushSyncQueue: jest.fn(() => Promise.resolve()),
  queueSettingsSync: jest.fn(() => Promise.resolve()),
}));

describe('recovery store', () => {
  it('holds the code in memory until it is kept, then forgets it', () => {
    useRecoveryStore.getState().show('OKL-7K2M-9QXR-4HTZ', 'poseidon', 'goal');
    expect(useRecoveryStore.getState()).toMatchObject({
      code: 'OKL-7K2M-9QXR-4HTZ',
      username: 'poseidon',
      then: 'goal',
    });
    useRecoveryStore.getState().forget();
    expect(useRecoveryStore.getState().code).toBeNull();
  });
});

describe('stores read again after a sign-in', () => {
  it('puts the sessions in place', () => {
    useWorkoutStore.getState().setWorkouts([]);
    expect(useWorkoutStore.getState().workouts).toEqual([]);
  });

  it('falls back to the defaults when the settings cannot be read', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));
    await useSettingsStore.getState().loadSettings();
    expect(useSettingsStore.getState()).toMatchObject({ isLoaded: true, settings: DEFAULT_SETTINGS });
    jest.restoreAllMocks();
  });
});

describe('loadAccountData', () => {
  it('reads every store again, even when the cloud cannot be reached', async () => {
    const loads = [
      jest.spyOn(useWorkoutStore.getState(), 'loadWorkouts').mockResolvedValue(),
      jest.spyOn(useProfileStore.getState(), 'loadProfile').mockResolvedValue(),
      jest.spyOn(useSettingsStore.getState(), 'loadSettings').mockResolvedValue(),
    ];
    await loadAccountData();
    expect(initialSync).toHaveBeenCalled();
    for (const load of loads) expect(load).toHaveBeenCalled();
  });
});

describe('whose data is on this phone', () => {
  const loads = () => [
    jest.spyOn(useWorkoutStore.getState(), 'loadWorkouts').mockResolvedValue(),
    jest.spyOn(useProfileStore.getState(), 'loadProfile').mockResolvedValue(),
    jest.spyOn(useSettingsStore.getState(), 'loadSettings').mockResolvedValue(),
  ];

  it('gives the sessions done before any account to the first one that signs in', async () => {
    loads();
    await writeDataOwner(null);
    jest.mocked(getCurrentUserId).mockResolvedValue('user-a');
    await loadAccountData();
    expect(wipeLocalData).not.toHaveBeenCalled();
    expect(await readDataOwner()).toBe('user-a');
  });

  it("never sends another account's sessions to the one signing in", async () => {
    loads();
    await writeDataOwner('user-a');
    jest.mocked(getCurrentUserId).mockResolvedValue('user-b');
    await loadAccountData();
    expect(wipeLocalData).toHaveBeenCalled();
    expect(jest.mocked(wipeLocalData).mock.invocationCallOrder[0]!).toBeLessThan(
      jest.mocked(initialSync).mock.invocationCallOrder.at(-1)!,
    );
    expect(await readDataOwner()).toBe('user-b');
  });
});

describe('signing out', () => {
  it("takes the account's data off the phone, keeping the theme and language", async () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, theme: 'dark', plates: [20], barWeight: 15 } });
    useWorkoutStore.setState({ workouts: [{ id: 'w1' } as never] });
    useProfileStore.setState({ profile: { goal: 'muscle' } as never });
    useSessionStore.setState({ activeSession: { workoutId: 'w2' } as never });
    await writeDataOwner('user-a');

    await signOutAndClear();

    expect(signOut).toHaveBeenCalled();
    expect(wipeLocalData).toHaveBeenCalled();
    expect(useWorkoutStore.getState().workouts).toEqual([]);
    expect(useProfileStore.getState().profile).toBeNull();
    expect(useSessionStore.getState().activeSession).toBeNull();
    expect(useSettingsStore.getState().settings).toEqual({ ...DEFAULT_SETTINGS, theme: 'dark' });
    expect(JSON.parse((await AsyncStorage.getItem('@gymtrack/settings'))!)).toMatchObject({ theme: 'dark' });
    expect(await readDataOwner()).toBeNull();
  });

  it('says how much has not reached the account yet', async () => {
    jest.mocked(countPendingSync).mockResolvedValueOnce(2);
    expect(await pendingAfterSync()).toBe(2);
  });

  it('clears even when nothing is running', async () => {
    useSessionStore.setState({ activeSession: null });
    await expect(clearLocalData()).resolves.toBeUndefined();
  });
});

describe('back in the app', () => {
  it('reads the stores again only when the cloud brought something', async () => {
    const loadWorkouts = jest.spyOn(useWorkoutStore.getState(), 'loadWorkouts').mockResolvedValue();
    loadWorkouts.mockClear();
    await resumeAccountSync();
    expect(loadWorkouts).not.toHaveBeenCalled();
    jest.mocked(resumeSync).mockResolvedValueOnce(true);
    jest.spyOn(useSettingsStore.getState(), 'loadSettings').mockResolvedValue();
    await resumeAccountSync();
    expect(loadWorkouts).toHaveBeenCalled();
  });

  it('shares one run between calls at the same time', async () => {
    jest.mocked(resumeSync).mockClear();
    await Promise.all([resumeAccountSync(), resumeAccountSync()]);
    expect(resumeSync).toHaveBeenCalledTimes(1);
  });
});
