import { describe, expect, it } from '@jest/globals';
import { dropIndex, moveItem, shiftFor } from '@/domain/reorder';

describe('dropIndex', () => {
  it.each<[number, number, number]>([
    [0, 0, 0],
    [0, 70, 1],
    [0, 40, 0],
    [2, -160, 0],
    [2, -140, 1],
    [1, 500, 3],
  ])('from %i dragged by %i lands on %i', (from, dy, expected) => {
    expect(dropIndex(from, dy, 100, 4)).toBe(expected);
  });

  it('stays put without a row height or rows', () => {
    expect(dropIndex(1, 300, 0, 4)).toBe(1);
    expect(dropIndex(1, 300, 100, 0)).toBe(1);
  });
});

describe('shiftFor', () => {
  it('moves the rows in between to make room', () => {
    expect(shiftFor(1, 0, 2, 80)).toBe(-80);
    expect(shiftFor(2, 0, 2, 80)).toBe(-80);
    expect(shiftFor(3, 0, 2, 80)).toBe(0);
    expect(shiftFor(1, 3, 1, 80)).toBe(80);
    expect(shiftFor(0, 3, 1, 80)).toBe(0);
  });

  it('leaves the dragged row and an idle list alone', () => {
    expect(shiftFor(2, 2, 0, 80)).toBe(0);
    expect(shiftFor(2, -1, 0, 80)).toBe(0);
  });
});

describe('moveItem', () => {
  it('moves an item down or up', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('returns a copy when the index is unknown', () => {
    const list = ['a'];
    expect(moveItem(list, 5, 0)).toEqual(['a']);
    expect(moveItem(list, 5, 0)).not.toBe(list);
  });
});
