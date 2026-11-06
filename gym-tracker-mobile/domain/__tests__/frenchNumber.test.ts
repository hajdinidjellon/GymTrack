import { describe, expect, it } from '@jest/globals';
import { frenchNumber } from '@/domain/frenchNumber';

describe('frenchNumber', () => {
  it.each([
    [0, 'zéro'],
    [1, 'un'],
    [16, 'seize'],
    [17, 'dix-sept'],
    [20, 'vingt'],
    [21, 'vingt et un'],
    [22, 'vingt-deux'],
    [62, 'soixante-deux'],
    [70, 'soixante-dix'],
    [71, 'soixante et onze'],
    [77, 'soixante-dix-sept'],
    [80, 'quatre-vingts'],
    [81, 'quatre-vingt-un'],
    [90, 'quatre-vingt-dix'],
    [99, 'quatre-vingt-dix-neuf'],
    [100, 'cent'],
    [101, 'cent un'],
    [180, 'cent quatre-vingts'],
    [200, 'deux cents'],
    [245, 'deux cent quarante-cinq'],
    [1000, 'mille'],
    [2500, 'deux mille cinq cents'],
  ])('%i → %s', (n, words) => {
    expect(frenchNumber(n)).toBe(words);
  });

  it('refuses what it cannot say', () => {
    expect(() => frenchNumber(-1)).toThrow(RangeError);
    expect(() => frenchNumber(2.5)).toThrow(RangeError);
    expect(() => frenchNumber(10000)).toThrow(RangeError);
  });
});
