import NetInfo from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';
import {
  flushSyncQueue,
  pullAllFromCloud,
  initialSync,
  startSyncConnectivityListener,
} from '@/lib/sync';
import { supabase, getCurrentUserId, isSupabaseConfigured } from '@/lib/supabase';
import {
  getPendingSyncQueue,
  clearSyncQueueEntry,
  loadWorkoutById,
  markWorkoutSynced,
  bulkInsertWorkouts,
  saveProfileLocal,
} from '@/lib/db';
import type { SyncQueueEntry } from '@/lib/db';
import type { Workout, UserProfile } from '@/types';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(),
    addEventListener: jest.fn(() => () => undefined),
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
  getCurrentUserId: jest.fn(),
  isSupabaseConfigured: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  getPendingSyncQueue: jest.fn(),
  clearSyncQueueEntry: jest.fn(),
  loadWorkoutById: jest.fn(),
  markWorkoutSynced: jest.fn(),
  bulkInsertWorkouts: jest.fn(),
  saveProfileLocal: jest.fn(),
  loadProfileLocal: jest.fn(),
  loadPlansLocal: jest.fn(),
  loadGoalsLocal: jest.fn(),
  loadWorkoutsLocal: jest.fn(),
}));

// ── Helpers de mock ──────────────────────────────────────────────

const mockConfigured = jest.mocked(isSupabaseConfigured);
const mockUserId = jest.mocked(getCurrentUserId);
const mockNetFetch = jest.mocked(NetInfo.fetch);
const mockFrom = supabase.from as unknown as jest.Mock;

const online = (isConnected: boolean) =>
  mockNetFetch.mockResolvedValue({ isConnected } as NetInfoState);

const workout = (id: string): Workout => ({
  id,
  date: '2026-07-01T12:00:00.000Z',
  name: 'Push',
  type: 'strength',
  exercises: [],
  feeling: 3,
  completed: true,
});

const profile: UserProfile = {
  name: 'Djell',
  height: 180,
  gender: 'male',
  experienceLevel: 'intermediate',
  prs: [],
  bodyStats: [],
  trainingFrequency: 4,
  goals: [],
};

const queueEntry = (over: Partial<SyncQueueEntry>): SyncQueueEntry => ({
  id: 1,
  table_name: 'workouts',
  record_id: 'w1',
  operation: 'upsert',
  created_at: '2026-07-01T12:00:00.000Z',
  ...over,
});

/** Builder chaînable façon supabase-js : chaque méthode retourne le builder,
 *  qui est thenable et résout `result` quand on l'attend. */
type QueryResult = { data: unknown; error: null };
type Chain = {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  single: jest.Mock;
  delete: jest.Mock;
  upsert: jest.Mock;
  then: (resolve: (v: QueryResult) => unknown) => Promise<unknown>;
};

function chainable(result: QueryResult): Chain {
  const chain: Chain = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    single: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    then: (resolve) => Promise.resolve(result).then(resolve),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.single.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.upsert.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockConfigured.mockReturnValue(true);
  mockUserId.mockResolvedValue('user-1');
  online(true);
});

// ── flushSyncQueue ───────────────────────────────────────────────

describe('flushSyncQueue', () => {
  it('ne fait rien si Supabase n’est pas configuré', async () => {
    mockConfigured.mockReturnValue(false);
    await flushSyncQueue();
    expect(getPendingSyncQueue).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('ne fait rien hors ligne', async () => {
    online(false);
    await flushSyncQueue();
    expect(getPendingSyncQueue).not.toHaveBeenCalled();
  });

  it('ne fait rien sans utilisateur connecté', async () => {
    mockUserId.mockResolvedValue(null);
    await flushSyncQueue();
    expect(getPendingSyncQueue).not.toHaveBeenCalled();
  });

  it('draine un upsert workout : push cloud, marque synced, vide la queue', async () => {
    const chain = chainable({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    jest.mocked(getPendingSyncQueue).mockResolvedValue([queueEntry({ id: 7 })]);
    jest.mocked(loadWorkoutById).mockResolvedValue(workout('w1'));

    await flushSyncQueue();

    expect(mockFrom).toHaveBeenCalledWith('workouts');
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'w1', user_id: 'user-1' }),
    );
    expect(markWorkoutSynced).toHaveBeenCalledWith('w1');
    expect(clearSyncQueueEntry).toHaveBeenCalledWith(7);
  });

  it('draine un delete : supprime côté cloud pour CET utilisateur', async () => {
    const chain = chainable({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    jest.mocked(getPendingSyncQueue).mockResolvedValue([
      queueEntry({ id: 2, operation: 'delete', record_id: 'w9' }),
    ]);

    await flushSyncQueue();

    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'w9');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(clearSyncQueueEntry).toHaveBeenCalledWith(2);
  });

  it('un workout local introuvable est quand même retiré de la queue', async () => {
    jest.mocked(getPendingSyncQueue).mockResolvedValue([queueEntry({ id: 3 })]);
    jest.mocked(loadWorkoutById).mockResolvedValue(null);

    await flushSyncQueue();

    expect(mockFrom).not.toHaveBeenCalled();
    expect(clearSyncQueueEntry).toHaveBeenCalledWith(3);
  });

  it('une entrée en échec reste en queue sans bloquer les suivantes', async () => {
    const failing = chainable({ data: null, error: null });
    failing.upsert.mockRejectedValue(new Error('network'));
    const ok = chainable({ data: null, error: null });
    mockFrom.mockReturnValueOnce(failing).mockReturnValue(ok);

    jest.mocked(getPendingSyncQueue).mockResolvedValue([
      queueEntry({ id: 1, record_id: 'w1' }),
      queueEntry({ id: 2, record_id: 'w2' }),
    ]);
    jest.mocked(loadWorkoutById).mockImplementation(async (id) => workout(id));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await flushSyncQueue();

    expect(clearSyncQueueEntry).not.toHaveBeenCalledWith(1);
    expect(clearSyncQueueEntry).toHaveBeenCalledWith(2);
    warn.mockRestore();
  });
});

// ── pullAllFromCloud / initialSync ───────────────────────────────

function mockPull(remote: {
  workouts: Workout[];
  profile: UserProfile | null;
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'workouts') {
      return chainable({ data: remote.workouts.map((w) => ({ data: w })), error: null });
    }
    if (table === 'profiles') {
      return chainable({
        data: remote.profile ? { data: remote.profile } : null,
        error: null,
      });
    }
    return chainable({ data: [], error: null }); // plans & goals
  });
}

describe('pullAllFromCloud', () => {
  it('retourne null hors ligne', async () => {
    online(false);
    expect(await pullAllFromCloud()).toBeNull();
  });

  it('retourne null sans utilisateur', async () => {
    mockUserId.mockResolvedValue(null);
    expect(await pullAllFromCloud()).toBeNull();
  });

  it('déballe les colonnes data de chaque table', async () => {
    mockPull({ workouts: [workout('w1'), workout('w2')], profile });
    const result = await pullAllFromCloud();
    expect(result).toEqual({
      workouts: [workout('w1'), workout('w2')],
      profile,
      plans: [],
      goals: [],
    });
  });

  it('profil absent côté cloud → profile null', async () => {
    mockPull({ workouts: [], profile: null });
    const result = await pullAllFromCloud();
    expect(result?.profile).toBeNull();
  });
});

describe('initialSync', () => {
  it('flush la queue PUIS écrase le local avec le cloud (cloud gagne)', async () => {
    jest.mocked(getPendingSyncQueue).mockResolvedValue([]);
    mockPull({ workouts: [workout('cloud-1')], profile });

    const result = await initialSync();

    expect(getPendingSyncQueue).toHaveBeenCalled(); // étape 1 : flush
    expect(bulkInsertWorkouts).toHaveBeenCalledWith([workout('cloud-1')]);
    expect(saveProfileLocal).toHaveBeenCalledWith(profile);
    expect(result?.workouts).toHaveLength(1);
  });

  it('hors ligne : retourne null sans toucher au local', async () => {
    online(false);
    expect(await initialSync()).toBeNull();
    expect(bulkInsertWorkouts).not.toHaveBeenCalled();
    expect(saveProfileLocal).not.toHaveBeenCalled();
  });

  it('ne sauve pas de profil local si le cloud n’en a pas', async () => {
    jest.mocked(getPendingSyncQueue).mockResolvedValue([]);
    mockPull({ workouts: [], profile: null });
    await initialSync();
    expect(saveProfileLocal).not.toHaveBeenCalled();
  });
});

// ── startSyncConnectivityListener ────────────────────────────────

describe('startSyncConnectivityListener', () => {
  it('ne s’abonne pas si Supabase n’est pas configuré', () => {
    mockConfigured.mockReturnValue(false);
    startSyncConnectivityListener();
    expect(NetInfo.addEventListener).not.toHaveBeenCalled();
  });

  it('flush uniquement à la transition offline → online', async () => {
    let listener: ((state: NetInfoState) => void) | undefined;
    jest.mocked(NetInfo.addEventListener).mockImplementation((cb) => {
      listener = cb;
      return () => undefined;
    });
    jest.mocked(getPendingSyncQueue).mockResolvedValue([]);

    startSyncConnectivityListener();
    expect(listener).toBeDefined();

    // 1er event online : pas de flush (pas de transition connue)
    listener!({ isConnected: true } as NetInfoState);
    await Promise.resolve();
    expect(getPendingSyncQueue).not.toHaveBeenCalled();

    // offline puis online : flush
    listener!({ isConnected: false } as NetInfoState);
    listener!({ isConnected: true } as NetInfoState);
    await new Promise((r) => setTimeout(r, 0));
    expect(getPendingSyncQueue).toHaveBeenCalledTimes(1);
  });
});
