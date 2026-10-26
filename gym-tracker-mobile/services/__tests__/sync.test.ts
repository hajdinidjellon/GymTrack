import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as db from '@/services/db';
import { supabase } from '@/services/supabase';
import { flushSyncQueue, initialSync, pullAllFromCloud } from '@/services/sync';
import type { Workout } from '@/types';

jest.mock('@/services/db');
jest.mock('@/services/supabase', () => ({
  supabase: { from: jest.fn() },
  getCurrentUserId: jest.fn(() => Promise.resolve('user-1')),
  isSupabaseConfigured: jest.fn(() => true),
}));

const mockedDb = jest.mocked(db);
const from = jest.mocked(supabase.from);

type Result = { data?: unknown; error: { message: string } | null };

/** A tiny stand-in for the Supabase query builder: every call resolves to `result`. */
function table(result: Result) {
  const done = Promise.resolve(result);
  const query: Record<string, unknown> = {
    then: done.then.bind(done),
    upsert: jest.fn(() => done),
    delete: jest.fn(() => query),
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    maybeSingle: jest.fn(() => done),
  };
  return query;
}

const workout: Workout = {
  id: 'w1',
  date: '2026-10-20T18:00:00.000Z',
  name: 'Push',
  type: 'strength',
  exercises: [],
  feeling: 3,
  completed: true,
};

const entry = (id: number, operation: 'upsert' | 'delete' = 'upsert') => ({
  id,
  table_name: 'workouts' as const,
  record_id: 'w1',
  operation,
  created_at: '2026-10-20',
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedDb.loadWorkoutById.mockResolvedValue(workout);
});

describe('flushSyncQueue', () => {
  it('removes an entry once Supabase confirmed it', async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([entry(1)]);
    const workouts = table({ error: null });
    from.mockReturnValue(workouts as never);

    await flushSyncQueue();

    expect(workouts.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'w1', user_id: 'user-1' }));
    expect(mockedDb.markWorkoutSynced).toHaveBeenCalledWith('w1');
    expect(mockedDb.clearSyncQueueEntry).toHaveBeenCalledWith(1);
  });

  it('keeps the entry and stops when Supabase refuses it', async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([entry(1), entry(2)]);
    from.mockReturnValue(table({ error: { message: 'RLS violation' } }) as never);

    await flushSyncQueue();

    expect(mockedDb.clearSyncQueueEntry).not.toHaveBeenCalled();
    expect(mockedDb.markWorkoutSynced).not.toHaveBeenCalled();
  });

  it('deletes only rows of the signed-in user', async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([entry(3, 'delete')]);
    const workouts = table({ error: null });
    from.mockReturnValue(workouts as never);

    await flushSyncQueue();

    expect(workouts.eq).toHaveBeenCalledWith('id', 'w1');
    expect(workouts.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(mockedDb.clearSyncQueueEntry).toHaveBeenCalledWith(3);
  });

  it('shares one run between calls made at the same time', async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([]);
    await Promise.all([flushSyncQueue(), flushSyncQueue()]);
    expect(mockedDb.getPendingSyncQueue).toHaveBeenCalledTimes(1);
  });
});

describe('pullAllFromCloud', () => {
  it('keeps only valid rows from the cloud', async () => {
    from.mockImplementation(((name: string) =>
      name === 'workouts'
        ? table({ data: [{ data: workout }, { data: { id: 'bad' } }], error: null })
        : table({ data: null, error: null })) as never);

    const result = await pullAllFromCloud();

    expect(result).toEqual({ workouts: [workout], profile: null });
  });

  it('returns null when the request fails', async () => {
    from.mockReturnValue(table({ data: null, error: { message: 'offline' } }) as never);
    expect(await pullAllFromCloud()).toBeNull();
  });
});

describe('initialSync', () => {
  it('stores the cloud copy without queueing it again', async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([]);
    const profile = { goal: 'muscle', program: { split: 'ppl', perWeek: 3 }, prs: [], bodyStats: [] };
    from.mockImplementation(((name: string) =>
      name === 'workouts'
        ? table({ data: [{ data: workout }], error: null })
        : table({ data: { data: profile }, error: null })) as never);

    await initialSync();

    expect(mockedDb.bulkInsertWorkouts).toHaveBeenCalledWith([workout]);
    expect(mockedDb.saveProfileLocal).toHaveBeenCalledWith(profile, { sync: false });
  });
});
