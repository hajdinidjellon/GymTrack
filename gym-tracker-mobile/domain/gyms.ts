/**
 * LES SALLES — what the big chains have, to prefill the gym at first launch:
 * the bar, the plates, the step of the machines' stacks and of the cables.
 * A starting point the user corrects: two clubs of one chain may differ.
 * Sources: the chains' equipment pages and buying-centre sheets (Matrix
 * stacks at 4,5 kg / 10 lb at Basic-Fit and L'Orange Bleue, 5 kg at Fitness Park).
 */

import { DEFAULT_BAR, DEFAULT_PLATES } from '@/domain/plates';
import { searchKey } from '@/domain/programs';

export interface GymChain {
  id: string;
  name: string;
  /** One of the four offered first. */
  popular?: boolean;
  barWeight: number;
  plates: number[];
  /** Null: not known, each machine keeps its usual step. */
  stackStep: number | null;
  cableStep: number | null;
}

const chain = (id: string, name: string, steps: Partial<GymChain> = {}): GymChain => ({
  id,
  name,
  barWeight: DEFAULT_BAR,
  plates: DEFAULT_PLATES,
  stackStep: null,
  cableStep: null,
  ...steps,
});

/** The four best known first, then the others alphabetically. */
export const GYM_CHAINS: GymChain[] = [
  chain('basicfit', 'Basic-Fit', { popular: true, stackStep: 4.5, cableStep: 2.3 }),
  chain('fitnesspark', 'Fitness Park', { popular: true, stackStep: 5, cableStep: 2.5 }),
  chain('orangebleue', "L'Orange Bleue", { popular: true, stackStep: 4.5, cableStep: 2.3 }),
  chain('keepcool', 'Keepcool', { popular: true }),
  chain('cmg', 'CMG Sports Club'),
  chain('gigagym', 'Gigagym'),
  chain('magicform', 'Magic Form'),
  chain('movida', 'Movida'),
  chain('neoness', 'Neoness'),
  chain('onair', 'On Air'),
  chain('vitaliberte', 'Vita Liberté'),
  chain('wellness', 'Wellness Sport Club'),
];

/** Not a chain: a club of its own, or at home. The usual plates, each machine its usual step. */
export const OTHER_GYM = chain('other', '');
export const HOME_GYM = chain('home', '', { plates: [20, 10, 5, 2.5, 1.25] });

export const POPULAR_GYMS = GYM_CHAINS.filter((g) => g.popular);

/** The chains whose name contains what was typed, accents and case aside ("orange" finds L'Orange Bleue). */
export function searchGyms(query: string): GymChain[] {
  const q = searchKey(query).replace(/[^a-z0-9]/g, '');
  if (!q) return [];
  return GYM_CHAINS.filter((g) =>
    searchKey(g.name)
      .replace(/[^a-z0-9]/g, '')
      .includes(q),
  );
}

export function findGym(id: string | null | undefined): GymChain | undefined {
  return [...GYM_CHAINS, OTHER_GYM, HOME_GYM].find((g) => g.id === id);
}
