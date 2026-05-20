import { create } from 'zustand';

export interface CelebrationEvent {
  type: 'pr' | 'weekly_goal';
  title: string;
  subtitle: string;
}

interface CelebrationStore {
  event: CelebrationEvent | null;
  show: (event: CelebrationEvent) => void;
  dismiss: () => void;
}

export const useCelebrationStore = create<CelebrationStore>((set) => ({
  event: null,
  show:    (event) => set({ event }),
  dismiss: ()      => set({ event: null }),
}));
