import { describe, expect, it } from '@jest/globals';
import { movementHint } from '@/domain/movementHint';
import { catalogKeyOf, workedBy, WORKED } from '@/domain/catalog/muscles';
import { EXERCISES } from '@/domain/catalog';

describe('movementHint', () => {
  it.each([
    [0, undefined, 'new'],
    [0, 'new', 'new'],
    [0, 'months', 'new'],
    [1, 'new', 'reminder'],
    [2, 'months', 'reminder'],
    [3, 'new', 'none'],
    [12, undefined, 'none'],
    [0, 'years', 'none'],
    [1, 'years', 'none'],
  ] as const)('%i times done, experience %s → %s', (times, experience, hint) => {
    expect(movementHint(times, experience)).toBe(hint);
  });
});

describe('worked muscles', () => {
  it('every catalog exercise has at least one main muscle, none twice', () => {
    for (const key of Object.keys(EXERCISES) as (keyof typeof WORKED)[]) {
      const { primary, secondary } = WORKED[key];
      expect(primary.length).toBeGreaterThan(0);
      expect(new Set([...primary, ...secondary]).size).toBe(primary.length + secondary.length);
    }
  });

  it('finds an exercise by its stored name, not one the user created', () => {
    expect(catalogKeyOf('Développé couché')).toBe('bench');
    expect(workedBy('Curl haltères')?.primary).toEqual(['biceps']);
    expect(workedBy('Mon exercice à moi')).toBeUndefined();
  });
});
