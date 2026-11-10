/**
 * The journeys run offline: storage, the cloud and the account are stubbed so only the screens
 * and the stores work, as on a phone with a fast network.
 */
import { jest } from '@jest/globals';

const quiet = () => jest.fn(async () => undefined);

jest.mock('@/services/db', () => ({
  getDb: jest.fn(),
  saveWorkoutLocal: quiet(),
  deleteWorkoutLocal: quiet(),
  loadWorkoutsLocal: jest.fn(async () => []),
  loadWorkoutById: jest.fn(async () => null),
  markWorkoutSynced: quiet(),
  bulkInsertWorkouts: quiet(),
  saveProfileLocal: quiet(),
  loadProfileLocal: jest.fn(async () => null),
  getPendingSyncQueue: jest.fn(async () => []),
  enqueueSettingsSync: quiet(),
  clearSettingsSyncQueue: quiet(),
  countPendingSync: jest.fn(async () => 0),
  wipeLocalData: quiet(),
  clearSyncQueueEntry: quiet(),
}));

jest.mock('@/services/sync', () => ({
  flushSyncQueue: jest.fn(async () => undefined),
  pullAllFromCloud: quiet(),
  initialSync: quiet(),
  resumeSync: jest.fn(async () => false),
  queueSettingsSync: quiet(),
}));

jest.mock('@/services/supabase', () => ({
  supabase: {},
  isSupabaseConfigured: () => true,
  getCurrentUserId: jest.fn(async () => 'journey-user'),
  hasSession: jest.fn(async () => true),
  signInWithEmail: jest.fn(async () => ({ ok: true })),
  signUp: jest.fn(async () => ({ ok: true })),
  signOut: quiet(),
}));

jest.mock('@/services/recovery', () => ({
  createRecoveryCode: jest.fn(async () => ({ ok: true, code: 'OKL-ABCD-EFGH-JKMN' })),
  requestResetEmail: jest.fn(async () => 'ok'),
  resetWithCode: jest.fn(async () => 'ok'),
  resetWithEmailLink: jest.fn(async () => 'ok'),
  getContactEmail: jest.fn(async () => null),
  deleteAccount: jest.fn(async () => 'ok'),
  updateContactEmail: jest.fn(async () => 'ok'),
}));
