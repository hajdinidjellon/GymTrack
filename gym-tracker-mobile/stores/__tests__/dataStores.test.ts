import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as db from '@/services/db';
import { flushSyncQueue } from '@/services/sync';
import { useProfileStore } from '@/stores/profileStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import type { UserProfile, Workout } from '@/types';

jest.mock('@/services/db');
jest.mock('@/services/sync', () => ({ flushSyncQueue: jest.fn(() => Promise.resolve()) }));

const mockedDb = jest.mocked(db);
const profile: UserProfile = { goal: 'muscle', program: { split: 'ppl', perWeek: 3 }, prs: [], bodyStats: [] };
const workout = (id: string): Workout => ({
  id,
  date: '2026-10-20',
  name: 'Push',
  type: 'strength',
  exercises: [],
  feeling: 3,
  completed: true,
});

beforeEach(() => {
  jest.clearAllMocks();
  useProfileStore.setState({ profile: null });
  useWorkoutStore.setState({ workouts: [] });
});

describe('profileStore', () => {
  it('loads and normalizes the stored profile', async () => {
    mockedDb.loadProfileLocal.mockResolvedValue({ onboarding: { primaryGoal: 'pr' } });
    await useProfileStore.getState().loadProfile();
    expect(useProfileStore.getState().profile).toMatchObject({ goal: 'force' });
  });

  it('saves locally first, then syncs', async () => {
    await useProfileStore.getState().saveProfile(profile);
    expect(mockedDb.saveProfileLocal).toHaveBeenCalledWith(profile);
    expect(flushSyncQueue).toHaveBeenCalled();
  });

  it('replaces the record of the same exercise', async () => {
    useProfileStore.setState({ profile });
    const pr = { exercise: 'Squat', weight: 100, reps: 5, oneRepMax: 116, date: '2026-10-01' };
    await useProfileStore.getState().addPR(pr);
    await useProfileStore.getState().addPR({ ...pr, exercise: 'squat', weight: 110 });
    expect(useProfileStore.getState().profile?.prs).toEqual([{ ...pr, exercise: 'squat', weight: 110 }]);
  });

  it('does nothing to update without a profile', async () => {
    await useProfileStore.getState().updateProfile({ goal: 'force' });
    expect(mockedDb.saveProfileLocal).not.toHaveBeenCalled();
  });
});

describe('workoutStore', () => {
  it('adds a workout on top, without duplicates', async () => {
    useWorkoutStore.setState({ workouts: [workout('a'), workout('b')] });
    await useWorkoutStore.getState().addWorkout(workout('b'));
    expect(useWorkoutStore.getState().workouts.map((w) => w.id)).toEqual(['b', 'a']);
    expect(mockedDb.saveWorkoutLocal).toHaveBeenCalled();
  });

  it('deletes a workout', async () => {
    useWorkoutStore.setState({ workouts: [workout('a')] });
    await useWorkoutStore.getState().deleteWorkout('a');
    expect(useWorkoutStore.getState().workouts).toEqual([]);
    expect(mockedDb.deleteWorkoutLocal).toHaveBeenCalledWith('a');
  });

  it('loads the history', async () => {
    mockedDb.loadWorkoutsLocal.mockResolvedValue([workout('a')]);
    await useWorkoutStore.getState().loadWorkouts();
    expect(useWorkoutStore.getState().workouts).toHaveLength(1);
  });
});
