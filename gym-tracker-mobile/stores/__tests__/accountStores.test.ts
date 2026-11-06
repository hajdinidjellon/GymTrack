import { describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS } from '@/domain/settings';
import { initialSync } from '@/services/sync';
import { loadAccountData } from '@/stores/accountData';
import { useProfileStore } from '@/stores/profileStore';
import { useRecoveryStore } from '@/stores/recoveryStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';

jest.mock('@/services/sync', () => ({
  initialSync: jest.fn(() => Promise.reject(new Error('offline'))),
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
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('disk'));
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
