import { describe, expect, it } from '@jest/globals';
import { EFFORT_RPE, EFFORTS, effortOf, RPE_STEPS } from '@/domain/effort';

describe('precise RPE', () => {
  it('goes from 6 to 10 by half points, read back as the three efforts', () => {
    expect(RPE_STEPS).toEqual([6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]);
    expect(RPE_STEPS.map((r) => effortOf(r))).toEqual([
      'easy',
      'easy',
      'easy',
      'good',
      'good',
      'good',
      'good',
      'good',
      'max',
    ]);
  });
});

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
