import { describe, expect, it } from '@jest/globals';
import { EFFORT_RPE, EFFORTS, effortOf } from '@/domain/effort';

describe('effortOf', () => {
  it.each([
    [undefined, undefined],
    [0, 'easy'],
    [7, 'easy'],
    [7.5, 'good'],
    [9.5, 'good'],
    [10, 'max'],
  ])('reads RPE %s as %s', (rpe, effort) => {
    expect(effortOf(rpe)).toBe(effort);
  });

  it('reads back every effort it stores', () => {
    for (const effort of EFFORTS) expect(effortOf(EFFORT_RPE[effort])).toBe(effort);
  });
});
