import { useCelebrationStore } from '@/stores/celebrationStore';
import type { CelebrationEvent, RankUpEvent } from '@/stores/celebrationStore';
import { RANKS } from '@/lib/gamification';

const prEvent: CelebrationEvent = {
  type: 'pr',
  title: 'Nouveau record !',
  subtitle: 'Développé couché',
  exercise: 'Développé couché',
  prevValue: 100,
  newValue: 105,
};

const rankUpEvent: RankUpEvent = {
  from: RANKS[0]!,
  to: RANKS[1]!,
};

beforeEach(() => {
  useCelebrationStore.setState({ event: null, rankUp: null });
});

describe('celebrationStore', () => {
  it('show / dismiss pilotent l’overlay de célébration', () => {
    useCelebrationStore.getState().show(prEvent);
    expect(useCelebrationStore.getState().event).toBe(prEvent);

    useCelebrationStore.getState().dismiss();
    expect(useCelebrationStore.getState().event).toBeNull();
  });

  it('showRankUp / dismissRankUp pilotent l’overlay de rank-up', () => {
    useCelebrationStore.getState().showRankUp(rankUpEvent);
    expect(useCelebrationStore.getState().rankUp).toBe(rankUpEvent);

    useCelebrationStore.getState().dismissRankUp();
    expect(useCelebrationStore.getState().rankUp).toBeNull();
  });

  it('les deux overlays sont indépendants', () => {
    useCelebrationStore.getState().show(prEvent);
    useCelebrationStore.getState().showRankUp(rankUpEvent);

    useCelebrationStore.getState().dismiss();
    expect(useCelebrationStore.getState().event).toBeNull();
    expect(useCelebrationStore.getState().rankUp).toBe(rankUpEvent);
  });

  it('un nouvel event remplace le précédent', () => {
    useCelebrationStore.getState().show(prEvent);
    const weekly: CelebrationEvent = { type: 'weekly_goal', title: 'Objectif atteint', subtitle: '4/4' };
    useCelebrationStore.getState().show(weekly);
    expect(useCelebrationStore.getState().event).toBe(weekly);
  });
});
