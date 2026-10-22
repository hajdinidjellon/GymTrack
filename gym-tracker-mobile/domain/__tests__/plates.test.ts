import { describe, expect, it } from '@jest/globals';
import { describeSide, formatKg, loadBar } from '@/domain/plates';

describe('loadBar', () => {
  it('loads 62.5 kg as 20 + 1.25 per side', () => {
    expect(loadBar(62.5)).toEqual({ perSide: [20, 1.25], missing: 0 });
  });

  it('returns an empty bar at or under the bar weight', () => {
    expect(loadBar(20).perSide).toEqual([]);
    expect(loadBar(15).perSide).toEqual([]);
  });

  it('uses only the plates the gym has', () => {
    expect(loadBar(100, 20, [20, 10, 5, 2.5, 1.25]).perSide).toEqual([20, 20]);
    expect(loadBar(70, 20, [20, 10, 5, 2.5, 1.25]).perSide).toEqual([20, 5]);
    expect(loadBar(70, 20, [20, 15, 10, 5]).perSide).toEqual([20, 5]);
  });

  it('reports what cannot be loaded', () => {
    const load = loadBar(63, 20, [20, 10, 5, 2.5, 1.25]);
    expect(load.perSide).toEqual([20, 1.25]);
    expect(load.missing).toBe(0.5);
  });

  it('handles a 15 kg bar', () => {
    expect(loadBar(35, 15).perSide).toEqual([10]);
  });
});

describe('formatting', () => {
  it('uses a decimal comma', () => {
    expect(formatKg(62.5)).toBe('62,5');
    expect(formatKg(1.25)).toBe('1,25');
    expect(formatKg(80)).toBe('80');
  });

  it('describes one side', () => {
    expect(describeSide([20, 1.25])).toBe('20 + 1,25');
    expect(describeSide([])).toBe('Barre à vide');
  });
});
