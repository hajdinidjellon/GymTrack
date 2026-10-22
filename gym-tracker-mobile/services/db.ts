/**
 * BASE DE DONNÉES LOCALE — expo-sqlite
 *
 * Les données métier sont stockées en JSON, comme sur Supabase. Toute ligne
 * relue passe par les schémas zod : une ligne abîmée est ignorée au lieu
 * de faire planter l'app. Requêtes toujours paramétrées.
 */

import * as SQLite from 'expo-sqlite';
import { parseList, workoutSchema } from '@/domain/schemas';
import { logger } from '@/services/logger';
import type { Workout } from '@/types';

const DB_NAME = 'gymtrack.db';
const SCHEMA_VERSION = 3;

export type SyncTable = 'workouts' | 'profiles';
export type SyncOperation = 'upsert' | 'delete';

export interface SyncQueueEntry {
  id: number;
  table_name: SyncTable;
  record_id: string;
  operation: SyncOperation;
  created_at: string;
}

// La promesse est partagée : deux appels simultanés n'ouvrent pas deux connexions
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await runMigrations(db);
    return db;
  })().catch((error: unknown) => {
    dbPromise = null;
    throw error;
  });
  return dbPromise;
}

// ============================================================
// MIGRATIONS — idempotentes, jamais modifiées une fois publiées
// ============================================================

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);');
  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1',
  );
  const current = row?.version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  await db.withTransactionAsync(async () => {
    if (current < 1) await migrateV1(db);
    if (current < 2) await migrateV2(db);
    if (current < 3) await migrateV3(db);
    await db.runAsync('INSERT OR REPLACE INTO schema_version (version) VALUES (?)', SCHEMA_VERSION);
  });
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
    CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts (json_extract(data, '$.date'));
  `);
}

// Tables de l'ancienne version (plans, objectifs) : gardées pour ne rien perdre, plus utilisées
async function migrateV2(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL, synced INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS goals (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL, synced INTEGER NOT NULL DEFAULT 0);
  `);
}

async function migrateV3(db: SQLite.SQLiteDatabase): Promise<void> {
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

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

// ============================================================
// WORKOUTS
// ============================================================

export async function saveWorkoutLocal(workout: Workout): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT OR REPLACE INTO workouts (id, data, updated_at, synced) VALUES (?, ?, ?, 0)',
      workout.id,
      JSON.stringify(workout),
      new Date().toISOString(),
    );
    await enqueueSync(db, 'workouts', workout.id, 'upsert');
  });
}

export async function deleteWorkoutLocal(id: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM workouts WHERE id = ?', id);
    await enqueueSync(db, 'workouts', id, 'delete');
  });
}

export async function loadWorkoutsLocal(): Promise<Workout[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ data: string }>(
    "SELECT data FROM workouts ORDER BY json_extract(data, '$.date') DESC",
  );
  const { valid, rejected } = parseList(
    workoutSchema,
    rows.map((r) => parseJson(r.data)),
  );
  if (rejected) logger.warn(`${rejected} workout(s) skipped: invalid data`);
  return valid;
}

export async function loadWorkoutById(id: string): Promise<Workout | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM workouts WHERE id = ?', id);
  if (!row) return null;
  const result = workoutSchema.safeParse(parseJson(row.data));
  return result.success ? result.data : null;
}

export async function markWorkoutSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE workouts SET synced = 1 WHERE id = ?', id);
}

/** Workouts pulled from the cloud: already in sync, nothing to queue. */
export async function bulkInsertWorkouts(workouts: Workout[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const w of workouts) {
      await db.runAsync(
        'INSERT OR REPLACE INTO workouts (id, data, updated_at, synced) VALUES (?, ?, ?, 1)',
        w.id,
        JSON.stringify(w),
        w.date,
      );
    }
  });
}

// ============================================================
// PROFIL — relu brut : profileStore le normalise (anciennes versions) puis le valide
// ============================================================

export async function saveProfileLocal(profile: unknown, options: { sync: boolean } = { sync: true }): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT OR REPLACE INTO profile (id, data, updated_at, synced) VALUES (1, ?, ?, ?)',
      JSON.stringify(profile),
      new Date().toISOString(),
      options.sync ? 0 : 1,
    );
    if (options.sync) await enqueueSync(db, 'profiles', 'profile', 'upsert');
  });
}

export async function loadProfileLocal(): Promise<unknown> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM profile WHERE id = 1');
  return row ? parseJson(row.data) : null;
}

// ============================================================
// FILE DE SYNCHRO
// ============================================================

async function enqueueSync(
  db: SQLite.SQLiteDatabase,
  table: SyncTable,
  recordId: string,
  operation: SyncOperation,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO sync_queue (table_name, record_id, operation, created_at) VALUES (?, ?, ?, ?)',
    table,
    recordId,
    operation,
    new Date().toISOString(),
  );
}

export async function getPendingSyncQueue(): Promise<SyncQueueEntry[]> {
  const db = await getDb();
  return db.getAllAsync<SyncQueueEntry>(
    "SELECT * FROM sync_queue WHERE table_name IN ('workouts', 'profiles') ORDER BY id ASC",
  );
}

export async function clearSyncQueueEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', id);
}
