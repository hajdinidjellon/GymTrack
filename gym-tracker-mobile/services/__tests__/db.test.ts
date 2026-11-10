import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type * as Db from '@/services/db';

type Call = { sql: string; params: unknown[] };

/** Records every statement; rows to return are set per test. */
function fakeDatabase() {
  const calls: Call[] = [];
  const state = { version: 0, rows: [] as { data: string }[], inTransaction: false, transactions: 0 };
  const db = {
    calls,
    state,
    execAsync: jest.fn(async (sql: string) => void calls.push({ sql, params: [] })),
    runAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      calls.push({ sql, params });
      if (sql.includes('schema_version')) state.version = params[0] as number;
    }),
    getFirstAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      calls.push({ sql, params });
      if (sql.includes('schema_version')) return state.version ? { version: state.version } : null;
      return state.rows[0] ?? null;
    }),
    getAllAsync: jest.fn(async (sql: string) => {
      calls.push({ sql, params: [] });
      return state.rows;
    }),
    withTransactionAsync: jest.fn(async (fn: () => Promise<void>) => {
      state.transactions++;
      await fn();
    }),
  };
  return db;
}

let fake: ReturnType<typeof fakeDatabase>;
let db: typeof Db;

beforeEach(() => {
  jest.resetModules();
  fake = fakeDatabase();
  jest.doMock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn(async () => fake) }));
  db = require('@/services/db');
});

const workout = {
  id: 'w1',
  date: '2026-10-20T18:00:00.000Z',
  name: 'Push',
  type: 'strength',
  exercises: [],
  feeling: 3,
  completed: true,
} as const;

describe('getDb', () => {
  it('migrates once, in a transaction, even with concurrent callers', async () => {
    await Promise.all([db.getDb(), db.getDb()]);
    expect(fake.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(fake.state.version).toBe(3);
    expect(fake.calls.some((c) => c.sql.includes('CREATE TABLE IF NOT EXISTS sync_queue'))).toBe(true);
  });

  it('skips the migrations when the schema is current', async () => {
    fake.state.version = 3;
    await db.getDb();
    expect(fake.withTransactionAsync).not.toHaveBeenCalled();
  });
});

describe('workouts', () => {
  it('saves and queues the sync in the same transaction', async () => {
    fake.state.version = 3;
    await db.saveWorkoutLocal({ ...workout, exercises: [] });
    expect(fake.state.transactions).toBe(1);
    const inserts = fake.calls.filter((c) => c.sql.startsWith('INSERT'));
    expect(inserts.map((c) => c.params[0])).toEqual(['w1', 'workouts']);
  });

  it('refuses a session that would not read back, before writing anything', async () => {
    fake.state.version = 3;
    await expect(db.saveWorkoutLocal({ ...workout, exercises: [], name: 'x'.repeat(500) })).rejects.toThrow(
      'invalid data',
    );
    expect(fake.calls.some((c) => c.sql.startsWith('INSERT'))).toBe(false);
  });

  it('wipes every table of the account in one transaction', async () => {
    fake.state.version = 3;
    await db.wipeLocalData();
    expect(fake.state.transactions).toBe(1);
    const deletes = fake.calls.filter((c) => c.sql.startsWith('DELETE')).map((c) => c.sql);
    expect(deletes).toEqual(['workouts', 'profile', 'sync_queue', 'plans', 'goals'].map((t) => `DELETE FROM ${t}`));
  });

  it('takes the cloud copy without overwriting a change not sent yet, nor bringing back a deleted session', async () => {
    fake.state.version = 3;
    fake.state.rows = [{ record_id: 'gone' }] as never;
    await db.bulkInsertWorkouts([
      { ...workout, exercises: [] },
      { ...workout, exercises: [], id: 'gone' },
    ]);
    const inserts = fake.calls.filter((c) => c.sql.includes('INSERT INTO workouts'));
    expect(inserts.map((c) => c.params[0])).toEqual(['w1']);
    expect(inserts[0]!.sql).toContain('WHERE workouts.synced = 1');
  });

  it('always binds values as parameters', async () => {
    fake.state.version = 3;
    await db.deleteWorkoutLocal("x'); DROP TABLE workouts; --");
    const del = fake.calls.find((c) => c.sql.startsWith('DELETE'));
    expect(del?.sql).toBe('DELETE FROM workouts WHERE id = ?');
    expect(del?.params).toEqual(["x'); DROP TABLE workouts; --"]);
  });

  it('skips rows that are not valid workouts', async () => {
    fake.state.version = 3;
    fake.state.rows = [{ data: JSON.stringify(workout) }, { data: '{broken' }, { data: '{"id":1}' }];
    expect(await db.loadWorkoutsLocal()).toEqual([workout]);
  });

  it('reads one workout by id, or null', async () => {
    fake.state.version = 3;
    fake.state.rows = [{ data: JSON.stringify(workout) }];
    expect(await db.loadWorkoutById('w1')).toEqual(workout);
    fake.state.rows = [];
    expect(await db.loadWorkoutById('w1')).toBeNull();
  });
});

describe('profile', () => {
  it('does not queue a profile that came from the cloud', async () => {
    fake.state.version = 3;
    await db.saveProfileLocal({ goal: 'muscle' }, { sync: false });
    expect(fake.calls.some((c) => c.sql.includes('sync_queue'))).toBe(false);
  });

  it('returns the raw profile for the store to normalize', async () => {
    fake.state.version = 3;
    fake.state.rows = [{ data: '{"goal":"force"}' }];
    expect(await db.loadProfileLocal()).toEqual({ goal: 'force' });
  });
});

describe('settings sync queue', () => {
  const clearSettings = "DELETE FROM sync_queue WHERE table_name = 'user_settings'";

  it('keeps a single settings entry: a new one replaces the waiting one', async () => {
    fake.state.version = 3;
    await db.enqueueSettingsSync();
    const queue = fake.calls.filter((c) => c.sql.includes('sync_queue'));
    expect(queue[0]?.sql).toBe(clearSettings);
    expect(queue[1]?.sql).toContain('INSERT INTO sync_queue');
    expect(queue[1]?.params.slice(0, 3)).toEqual(['user_settings', 'settings', 'upsert']);
    expect(fake.state.transactions).toBe(1);
  });

  it('drops the waiting settings entry', async () => {
    fake.state.version = 3;
    await db.clearSettingsSyncQueue();
    expect(fake.calls.some((c) => c.sql === clearSettings)).toBe(true);
  });

  it('sends the settings entries with the others', async () => {
    fake.state.version = 3;
    await db.getPendingSyncQueue();
    expect(fake.calls.some((c) => c.sql.includes("'user_settings'"))).toBe(true);
  });
});
