import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBadgeQueueStore } from '@/stores/badgeQueueStore';
import type { UnlockedBadge } from '@/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const SEEN_KEY = '@gymtrack/seen-badges';

const badge = (id: string): UnlockedBadge => ({
  id,
  name: `Badge ${id}`,
  description: '',
  icon: 'trophy',
  category: 'milestone',
  xpReward: 50,
  rarity: 'common',
  unlockedAt: new Date().toISOString(),
  currentProgress: 100,
});

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  useBadgeQueueStore.setState({ queue: [], seenIds: new Set(), isHydrated: false });
});

describe('hydrate', () => {
  it('charge les ids vus depuis AsyncStorage', async () => {
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(['first_workout']));
    await useBadgeQueueStore.getState().hydrate();

    const s = useBadgeQueueStore.getState();
    expect(s.isHydrated).toBe(true);
    expect(s.seenIds.has('first_workout')).toBe(true);
  });

  it('storage corrompu : hydraté quand même (seenIds vide)', async () => {
    await AsyncStorage.setItem(SEEN_KEY, '{corrompu');
    await useBadgeQueueStore.getState().hydrate();
    expect(useBadgeQueueStore.getState().isHydrated).toBe(true);
  });
});

describe('checkUnlocks', () => {
  it('avant hydratation : no-op (pas de spam au premier lancement)', () => {
    useBadgeQueueStore.getState().checkUnlocks([badge('a')]);
    expect(useBadgeQueueStore.getState().queue).toHaveLength(0);
    expect(useBadgeQueueStore.getState().seenIds.size).toBe(0);
  });

  it('premier check après hydratation : marque l’existant comme vu SANS le célébrer', async () => {
    await useBadgeQueueStore.getState().hydrate();
    useBadgeQueueStore.getState().checkUnlocks([badge('a'), badge('b')]);

    const s = useBadgeQueueStore.getState();
    expect(s.queue).toHaveLength(0);
    expect(s.seenIds.has('a')).toBe(true);
    expect(s.seenIds.has('b')).toBe(true);
  });

  it('un badge réellement nouveau est mis en queue et persisté comme vu (NR-4)', async () => {
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(['a']));
    await useBadgeQueueStore.getState().hydrate();

    useBadgeQueueStore.getState().checkUnlocks([badge('a'), badge('nouveau')]);

    const s = useBadgeQueueStore.getState();
    expect(s.queue.map((b) => b.id)).toEqual(['nouveau']);
    expect(s.seenIds.has('nouveau')).toBe(true);

    const persisted = JSON.parse((await AsyncStorage.getItem(SEEN_KEY))!) as string[];
    expect(persisted).toContain('nouveau');
  });

  it('un badge déjà vu n’est jamais re-célébré, même appelé deux fois (NR-4)', async () => {
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(['a']));
    await useBadgeQueueStore.getState().hydrate();

    useBadgeQueueStore.getState().checkUnlocks([badge('a'), badge('b')]);
    useBadgeQueueStore.getState().checkUnlocks([badge('a'), badge('b')]);

    expect(useBadgeQueueStore.getState().queue.map((b) => b.id)).toEqual(['b']);
  });
});

describe('dismissCurrent', () => {
  it('fait défiler la queue un badge à la fois', async () => {
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(['x']));
    await useBadgeQueueStore.getState().hydrate();
    useBadgeQueueStore.getState().checkUnlocks([badge('a'), badge('b')]);

    useBadgeQueueStore.getState().dismissCurrent();
    expect(useBadgeQueueStore.getState().queue.map((b) => b.id)).toEqual(['b']);

    useBadgeQueueStore.getState().dismissCurrent();
    expect(useBadgeQueueStore.getState().queue).toHaveLength(0);

    // dismiss sur queue vide : no-op
    useBadgeQueueStore.getState().dismissCurrent();
    expect(useBadgeQueueStore.getState().queue).toHaveLength(0);
  });
});
