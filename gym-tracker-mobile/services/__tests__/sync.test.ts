import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as db from '@/services/db';
import { supabase } from '@/services/supabase';
import * as storage from '@/services/settingsStorage';
import { readLastPull, writeLastPull } from '@/services/dataOwner';
import {
  FLUSH_FAILURES_MAX,
  flushSyncQueue,
  initialSync,
  PULL_PAGE,
  pullAllFromCloud,
  queueSettingsSync,
  resumeSync,
} from '@/services/sync';
import type { Workout } from '@/types';

jest.mock('@/services/db');
jest.mock('@/services/settingsStorage');
jest.mock('@/services/supabase', () => ({
  supabase: { from: jest.fn() },
  getCurrentUserId: jest.fn(() => Promise.resolve('user-1')),
  isSupabaseConfigured: jest.fn(() => true),
}));

const mockedDb = jest.mocked(db);
const mockedStorage = jest.mocked(storage);
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
    gt: jest.fn(() => query),
    order: jest.fn(() => query),
    range: jest.fn(() => query),
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
  mockedStorage.readStoredSettings.mockResolvedValue({});
  mockedStorage.readSettingsMeta.mockResolvedValue({ updatedAt: null, pending: false });
});

/** One stand-in per table. */
function tables(results: Record<string, ReturnType<typeof table>>) {
  from.mockImplementation(((name: string) => results[name] ?? table({ data: null, error: null })) as never);
}

const RLS_ERROR = { message: 'new row violates row-level security policy for table "user_settings"' };
const settingsEntry = (id: number) => ({
  id,
  table_name: 'user_settings' as const,
  record_id: 'settings',
  operation: 'upsert' as const,
  created_at: '2026-11-05',
});
const OWN = { customDays: { 'ppl/Legs': ['Squat'] }, theme: 'dark' as const };

describe('settings push', () => {
  it("sends the settings without this phone's own, stamped with the time they changed", async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([settingsEntry(7)]);
    mockedStorage.readStoredSettings.mockResolvedValue(OWN);
    mockedStorage.readSettingsMeta.mockResolvedValue({ updatedAt: '2026-11-05T10:00:00.000Z', pending: false });
    const settings = table({ data: { updated_at: '2026-11-01T10:00:00+00:00' }, error: null });
    tables({ user_settings: settings });

    await flushSyncQueue();

    expect(settings.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(settings.upsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      data: { customDays: OWN.customDays },
      updated_at: '2026-11-05T10:00:00.000Z',
    });
    expect(mockedDb.clearSyncQueueEntry).toHaveBeenCalledWith(7);
  });

  it('leaves a newer copy from another phone alone', async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([settingsEntry(7)]);
    mockedStorage.readSettingsMeta.mockResolvedValue({ updatedAt: '2026-11-01T10:00:00.000Z', pending: false });
    const settings = table({ data: { updated_at: '2026-11-05T10:00:00+00:00' }, error: null });
    tables({ user_settings: settings });

    await flushSyncQueue();

    expect(settings.upsert).not.toHaveBeenCalled();
    expect(mockedDb.clearSyncQueueEntry).toHaveBeenCalledWith(7);
  });

  it('never sends defaults in place of settings it cannot read', async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([settingsEntry(7)]);
    mockedStorage.readStoredSettings.mockResolvedValue(null);
    mockedStorage.readSettingsMeta.mockResolvedValue({ updatedAt: '2026-11-05T10:00:00.000Z', pending: false });
    const settings = table({ data: null, error: null });
    tables({ user_settings: settings });

    await flushSyncQueue();

    expect(settings.upsert).not.toHaveBeenCalled();
  });

  it('keeps a refused settings entry without holding back the sessions', async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([settingsEntry(1), entry(2)]);
    const workouts = table({ error: null });
    tables({ user_settings: table({ data: null, error: RLS_ERROR }), workouts });

    await flushSyncQueue();

    expect(mockedDb.clearSyncQueueEntry).not.toHaveBeenCalledWith(1);
    expect(workouts.upsert).toHaveBeenCalled();
    expect(mockedDb.clearSyncQueueEntry).toHaveBeenCalledWith(2);
  });

  it('queues one entry once the user stops, then sends it', async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([]);
    mockedStorage.readSettingsMeta.mockResolvedValue({ updatedAt: '2026-11-05T10:00:00.000Z', pending: true });

    await queueSettingsSync();

    expect(mockedDb.enqueueSettingsSync).toHaveBeenCalledTimes(1);
    expect(mockedStorage.writeSettingsMeta).toHaveBeenCalledWith({
      updatedAt: '2026-11-05T10:00:00.000Z',
      pending: false,
    });
    expect(mockedDb.getPendingSyncQueue).toHaveBeenCalled();
  });
});

describe('settings at sign-in', () => {
  const cloudRow = (data: unknown, updated_at = '2026-11-03T10:00:00+00:00') =>
    table({ data: { data, updated_at }, error: null });

  beforeEach(() => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([]);
  });

  it("takes the cloud's program on a fresh install, keeping the phone's theme", async () => {
    mockedStorage.readStoredSettings.mockResolvedValue({ theme: 'dark', plates: [20] });
    mockedStorage.readSettingsMeta.mockResolvedValue({ updatedAt: '2026-11-05T10:00:00.000Z', pending: true });
    tables({ user_settings: cloudRow({ customDays: { 'ppl/Legs': ['Squat'] }, plates: [25, 20], theme: 'light' }) });

    await initialSync();

    expect(mockedStorage.writeSettings).toHaveBeenCalledWith(
      { theme: 'dark', customDays: { 'ppl/Legs': ['Squat'] }, plates: [25, 20] },
      { updatedAt: '2026-11-03T10:00:00+00:00', pending: false },
    );
    expect(mockedDb.clearSettingsSyncQueue).toHaveBeenCalled();
    expect(mockedDb.enqueueSettingsSync).not.toHaveBeenCalled();
  });

  it("queues this phone's copy when it is newer", async () => {
    mockedStorage.readStoredSettings.mockResolvedValue(OWN);
    mockedStorage.readSettingsMeta.mockResolvedValue({ updatedAt: '2026-11-05T10:00:00.000Z', pending: false });
    tables({ user_settings: cloudRow({ voice: false }) });

    await initialSync();

    expect(mockedStorage.writeSettings).not.toHaveBeenCalled();
    expect(mockedDb.enqueueSettingsSync).toHaveBeenCalled();
  });

  it("sends this phone's settings to an account that has none, stamped once", async () => {
    mockedStorage.readStoredSettings.mockResolvedValue(OWN);
    tables({});

    await initialSync();

    expect(mockedDb.enqueueSettingsSync).toHaveBeenCalled();
    expect(mockedStorage.writeSettingsMeta).toHaveBeenCalledWith({ updatedAt: expect.any(String), pending: false });
  });

  it('sends nothing from a fresh install to an account that has none', async () => {
    tables({});

    await initialSync();

    expect(mockedDb.enqueueSettingsSync).not.toHaveBeenCalled();
    expect(mockedDb.clearSettingsSyncQueue).toHaveBeenCalled();
  });

  it("skips invalid cloud settings and keeps this phone's", async () => {
    mockedStorage.readStoredSettings.mockResolvedValue(OWN);
    tables({ user_settings: cloudRow({ barWeight: 'heavy' }) });

    await initialSync();

    expect(mockedStorage.writeSettings).not.toHaveBeenCalled();
    expect(mockedDb.enqueueSettingsSync).toHaveBeenCalled();
  });

  it('still syncs the sessions when the settings cannot be read (RLS, missing table)', async () => {
    tables({
      user_settings: table({ data: null, error: RLS_ERROR }),
      workouts: table({ data: [{ data: workout }], error: null }),
    });

    await initialSync();

    expect(mockedStorage.writeSettings).not.toHaveBeenCalled();
    expect(mockedDb.bulkInsertWorkouts).toHaveBeenCalledWith([workout]);
  });
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

  it('keeps the entry, and the later ones of the same session, when Supabase refuses it', async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([entry(1), entry(2, 'delete')]);
    const workouts = table({ error: { message: 'RLS violation' } });
    from.mockReturnValue(workouts as never);

    await flushSyncQueue();

    expect(mockedDb.clearSyncQueueEntry).not.toHaveBeenCalled();
    expect(mockedDb.markWorkoutSynced).not.toHaveBeenCalled();
    // The delete waits behind the refused upsert: their order matters
    expect(workouts.delete).not.toHaveBeenCalled();
  });

  it('never lets one refused session hold back the others', async () => {
    const other = { ...entry(2), record_id: 'w2' };
    mockedDb.getPendingSyncQueue.mockResolvedValue([entry(1), other]);
    mockedDb.loadWorkoutById.mockImplementation((id) => Promise.resolve({ ...workout, id }));
    const refused = table({ error: { message: 'duplicate key' } });
    const accepted = table({ error: null });
    from.mockReturnValueOnce(refused as never).mockReturnValue(accepted as never);

    await flushSyncQueue();

    expect(mockedDb.clearSyncQueueEntry).not.toHaveBeenCalledWith(1);
    expect(mockedDb.clearSyncQueueEntry).toHaveBeenCalledWith(2);
  });

  it('gives up for now after a few failures in a row (no network)', async () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({ ...entry(i + 1), record_id: `w${i}` }));
    mockedDb.getPendingSyncQueue.mockResolvedValue(entries);
    const offline = table({ error: { message: 'Network request failed' } });
    from.mockReturnValue(offline as never);

    await flushSyncQueue();

    expect(offline.upsert).toHaveBeenCalledTimes(FLUSH_FAILURES_MAX);
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

  it('reads a long history page by page, past the 1000 rows Supabase answers at most', async () => {
    const page = (n: number, at: string) =>
      Array.from({ length: n }, (_, i) => ({ data: { ...workout, id: `w${i}` }, updated_at: at }));
    const first = table({ data: page(PULL_PAGE, '2026-11-01T10:00:00Z'), error: null });
    const second = table({ data: page(3, '2026-11-02T10:00:00Z'), error: null });
    const profile = table({ data: null, error: null });
    let pages = 0;
    from.mockImplementation(((name: string) => {
      if (name !== 'workouts') return profile;
      return pages++ === 0 ? first : second;
    }) as never);

    const result = await pullAllFromCloud();

    expect(result?.workouts).toHaveLength(PULL_PAGE + 3);
    expect(first.range).toHaveBeenCalledWith(0, PULL_PAGE - 1);
    expect(second.range).toHaveBeenCalledWith(PULL_PAGE, 2 * PULL_PAGE - 1);
    expect(await readLastPull()).toBe('2026-11-02T10:00:00Z');
  });
});

describe('resumeSync', () => {
  it('takes only the sessions changed in the cloud since the last read (another phone)', async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([]);
    await writeLastPull('2026-11-05T10:00:00.000Z');
    const workouts = table({ data: [{ data: workout, updated_at: '2026-11-06T08:00:00Z' }], error: null });
    tables({ workouts });

    expect(await resumeSync()).toBe(true);

    // A little before the last read: a phone whose clock is behind is not missed
    expect(workouts.gt).toHaveBeenCalledWith('updated_at', '2026-11-05T09:50:00.000Z');
    expect(mockedDb.bulkInsertWorkouts).toHaveBeenCalledWith([workout]);
    expect(await readLastPull()).toBe('2026-11-06T08:00:00Z');
  });

  it('says nothing changed when the cloud has nothing new', async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([]);
    await writeLastPull('2026-11-05T10:00:00.000Z');
    tables({ workouts: table({ data: [], error: null }) });

    expect(await resumeSync()).toBe(false);
    expect(mockedDb.bulkInsertWorkouts).not.toHaveBeenCalled();
    expect(await readLastPull()).toBe('2026-11-05T10:00:00.000Z');
  });

  it("takes settings changed since on another phone, never this phone's older copy over them", async () => {
    mockedDb.getPendingSyncQueue.mockResolvedValue([]);
    mockedStorage.readStoredSettings.mockResolvedValue(OWN);
    mockedStorage.readSettingsMeta.mockResolvedValue({ updatedAt: '2026-11-05T10:00:00.000Z', pending: false });
    tables({
      user_settings: table({
        data: { data: { plates: [20, 10] }, updated_at: '2026-11-06T10:00:00+00:00' },
        error: null,
      }),
      workouts: table({ data: [], error: null }),
    });

    expect(await resumeSync()).toBe(true);
    expect(mockedStorage.writeSettings).toHaveBeenCalled();
    expect(mockedDb.enqueueSettingsSync).not.toHaveBeenCalled();
  });

  it('does nothing signed out', async () => {
    const { getCurrentUserId } = jest.requireMock<{ getCurrentUserId: jest.Mock }>('@/services/supabase');
    getCurrentUserId.mockResolvedValueOnce(null as never);
    expect(await resumeSync()).toBe(false);
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
