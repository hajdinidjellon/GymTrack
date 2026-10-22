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
