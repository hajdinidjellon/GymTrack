import { create } from 'zustand';
import type { Rank } from '@/types';

export interface CelebrationEvent {
  type: 'pr' | 'weekly_goal';
  title: string;
  subtitle: string;
  /** PR uniquement : permet au compteur de compter ancien → nouveau 1RM. */
  exercise?: string;
  prevValue?: number;
  newValue?: number;
}

export interface RankUpEvent {
  from: Rank;
  to: Rank;
}

interface CelebrationStore {
  event: CelebrationEvent | null;
  rankUp: RankUpEvent | null;
  show: (event: CelebrationEvent) => void;
  dismiss: () => void;
  showRankUp: (event: RankUpEvent) => void;
  dismissRankUp: () => void;
}

export const useCelebrationStore = create<CelebrationStore>((set) => ({
  event: null,
  rankUp: null,
  show:    (event) => set({ event }),
  dismiss: ()      => set({ event: null }),
  showRankUp:    (rankUp) => set({ rankUp }),
  dismissRankUp: ()       => set({ rankUp: null }),
}));
