/**
 * BASE DE DONNÉES LOCALE — expo-sqlite
 *
 * Stratégie : les données métier sont stockées en JSON dans des colonnes JSONB.
 * Même schéma que Supabase → merge trivial lors du sync.
 * Migrations versionnées : chaque migration est idempotente (CREATE TABLE IF NOT EXISTS).
 */

import * as SQLite from 'expo-sqlite';
import type {
  Workout,
  UserProfile,
  TrainingPlan,
  TrainingGoal,
} from '@/types';

const DB_NAME = 'gymtrack.db';
const SCHEMA_VERSION = 3;

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations(_db);
  return _db;
}

// ============================================================
// MIGRATIONS
// ============================================================

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1',
  );
  const currentVersion = row?.version ?? 0;

  if (currentVersion < 1) await migrateV1(db);
  if (currentVersion < 2) await migrateV2(db);
  if (currentVersion < 3) await migrateV3(db);

  if (currentVersion < SCHEMA_VERSION) {
    await db.runAsync(
      'INSERT OR REPLACE INTO schema_version (version) VALUES (?)',
      SCHEMA_VERSION,
    );
  }
}

async function migrateV1(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts (
      json_extract(data, '$.date')
    );
  `);
}

async function migrateV2(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );
  `);
}

async function migrateV3(db: SQLite.SQLiteDatabase): Promise<void> {
  // Table de file d'attente pour les ops offline
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK (operation IN ('upsert','delete')),
      created_at TEXT NOT NULL
    );
  `);
}

// ============================================================
// WORKOUTS
// ============================================================

export async function saveWorkoutLocal(workout: Workout): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO workouts (id, data, updated_at, synced)
     VALUES (?, ?, ?, 0)`,
    workout.id,
    JSON.stringify(workout),
    now,
  );
  await enqueueSync(db, 'workouts', workout.id, 'upsert');
}

export async function deleteWorkoutLocal(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM workouts WHERE id = ?', id);
  await enqueueSync(db, 'workouts', id, 'delete');
}

export async function loadWorkoutsLocal(): Promise<Workout[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ data: string }>(
    `SELECT data FROM workouts ORDER BY json_extract(data, '$.date') DESC`,
  );
  return rows.map((r) => JSON.parse(r.data) as Workout);
}

export async function loadWorkoutById(id: string): Promise<Workout | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ data: string }>(
    'SELECT data FROM workouts WHERE id = ?',
    id,
  );
  return row ? (JSON.parse(row.data) as Workout) : null;
}

export async function markWorkoutSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE workouts SET synced = 1 WHERE id = ?',
    id,
  );
}

// ============================================================
// PROFILE
// ============================================================

export async function saveProfileLocal(profile: UserProfile): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO profile (id, data, updated_at, synced)
     VALUES (1, ?, ?, 0)`,
    JSON.stringify(profile),
    now,
  );
  await enqueueSync(db, 'profiles', 'profile', 'upsert');
}

export async function loadProfileLocal(): Promise<UserProfile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ data: string }>(
    'SELECT data FROM profile WHERE id = 1',
  );
  return row ? (JSON.parse(row.data) as UserProfile) : null;
}

// ============================================================
// PLANS
// ============================================================

export async function savePlanLocal(plan: TrainingPlan): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO plans (id, data, updated_at, synced)
     VALUES (?, ?, ?, 0)`,
    plan.id,
    JSON.stringify(plan),
    now,
  );
  await enqueueSync(db, 'plans', plan.id, 'upsert');
}

export async function deletePlanLocal(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM plans WHERE id = ?', id);
  await enqueueSync(db, 'plans', id, 'delete');
}

export async function loadPlansLocal(): Promise<TrainingPlan[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM plans');
  return rows.map((r) => JSON.parse(r.data) as TrainingPlan);
}

// ============================================================
// GOALS
// ============================================================

export async function saveGoalLocal(goal: TrainingGoal): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO goals (id, data, updated_at, synced)
     VALUES (?, ?, ?, 0)`,
    goal.id,
    JSON.stringify(goal),
    now,
  );
  await enqueueSync(db, 'goals', goal.id, 'upsert');
}

export async function loadGoalsLocal(): Promise<TrainingGoal[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM goals');
  return rows.map((r) => JSON.parse(r.data) as TrainingGoal);
}

// ============================================================
// SYNC QUEUE
// ============================================================

type SyncOperation = 'upsert' | 'delete';

async function enqueueSync(
  db: SQLite.SQLiteDatabase,
  tableName: string,
  recordId: string,
  operation: SyncOperation,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO sync_queue (table_name, record_id, operation, created_at)
     VALUES (?, ?, ?, ?)`,
    tableName,
    recordId,
    operation,
    new Date().toISOString(),
  );
}

export interface SyncQueueEntry {
  id: number;
  table_name: string;
  record_id: string;
  operation: SyncOperation;
  created_at: string;
}

export async function getPendingSyncQueue(): Promise<SyncQueueEntry[]> {
  const db = await getDb();
  return db.getAllAsync<SyncQueueEntry>(
    'SELECT * FROM sync_queue ORDER BY id ASC',
  );
}

export async function clearSyncQueueEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', id);
}

// ============================================================
// UTILITAIRES
// ============================================================

/** Efface TOUTES les données locales (suppression de compte / RGPD).
 *  Les tables restent, le schéma est conservé. */
export async function wipeAllLocalData(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM workouts;
      DELETE FROM profile;
      DELETE FROM plans;
      DELETE FROM goals;
      DELETE FROM sync_queue;
    `);
  });
}

export async function getUnsyncedWorkouts(): Promise<Workout[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ data: string }>(
    'SELECT data FROM workouts WHERE synced = 0',
  );
  return rows.map((r) => JSON.parse(r.data) as Workout);
}

export async function bulkInsertWorkouts(workouts: Workout[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const w of workouts) {
      await db.runAsync(
        `INSERT OR REPLACE INTO workouts (id, data, updated_at, synced)
         VALUES (?, ?, ?, 1)`,
        w.id,
        JSON.stringify(w),
        w.date,
      );
    }
  });
}
