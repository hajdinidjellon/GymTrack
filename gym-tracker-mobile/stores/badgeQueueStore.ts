import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UnlockedBadge } from '@/types';

/**
 * Queue de badges à célébrer. Détecte les nouveaux unlocks
 * (vs ceux déjà vus) et fait défiler les modals un par un.
 *
 * Persistance des "seen" en AsyncStorage pour ne pas re-célébrer
 * après un restart de l'app.
 */

const SEEN_KEY = '@gymtrack/seen-badges';

interface BadgeQueueStore {
  /** Badges en attente d'être affichés */
  queue: UnlockedBadge[];
  /** IDs des badges déjà vus (par l'utilisateur) */
  seenIds: Set<string>;
  /** True une fois que seenIds a été chargé depuis AsyncStorage */
  isHydrated: boolean;

  hydrate: () => Promise<void>;

  /**
   * À appeler à chaque update du gamification state.
   * Compare avec seenIds et enqueue les nouveaux badges.
   */
  checkUnlocks: (currentUnlocked: UnlockedBadge[]) => void;

  /** Retire le badge actuellement affiché */
  dismissCurrent: () => void;
}

export const useBadgeQueueStore = create<BadgeQueueStore>((set, get) => ({
  queue: [],
  seenIds: new Set(),
  isHydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(SEEN_KEY);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      set({ seenIds: new Set(ids), isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },

  checkUnlocks: (currentUnlocked) => {
    const { seenIds, queue, isHydrated } = get();

    // Avant l'hydratation : on considère tout comme déjà vu pour éviter
    // de spammer l'utilisateur au premier lancement
    if (!isHydrated) return;

    // Premier check après hydratation : si seenIds est vide ET il y a déjà
    // des badges débloqués, on les marque comme vus sans les afficher
    if (seenIds.size === 0 && currentUnlocked.length > 0) {
      const ids = currentUnlocked.map((b) => b.id);
      const nextSeen = new Set(ids);
      AsyncStorage.setItem(SEEN_KEY, JSON.stringify(ids)).catch(() => null);
      set({ seenIds: nextSeen });
      return;
    }

    const newBadges = currentUnlocked.filter((b) => !seenIds.has(b.id));
    if (newBadges.length === 0) return;

    // Évite de re-queue ceux déjà dans la queue
    const inQueueIds = new Set(queue.map((b) => b.id));
    const toAdd = newBadges.filter((b) => !inQueueIds.has(b.id));
    if (toAdd.length === 0) return;

    // Marque comme vus tout de suite + persiste
    const nextSeen = new Set(seenIds);
    toAdd.forEach((b) => nextSeen.add(b.id));
    AsyncStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(nextSeen))).catch(() => null);

    set({
      queue: [...queue, ...toAdd],
      seenIds: nextSeen,
    });
  },

  dismissCurrent: () => {
    set((s) => ({ queue: s.queue.slice(1) }));
  },
}));
