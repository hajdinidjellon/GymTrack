import { describe, expect, it } from '@jest/globals';
import { EXERCISES, similarExercises } from '@/domain/programs';
import { applyRule, effectiveRule, followers, followersLabel, type RuleContext } from '@/domain/ruleSync';

const ctx = (overrides: RuleContext['overrides'] = {}, goal: RuleContext['goal'] = 'muscle'): RuleContext => ({
  goal,
  own: [],
  overrides,
});
const twoBySix = { sets: 2, repMin: 6, repMax: 9 };
const names = (list: { name: string }[]) => list.map((e) => e.name);

describe('similarExercises', () => {
  it('keeps the same main muscle and kind of movement', () => {
    const similar = names(similarExercises(EXERCISES.chestpress));
    expect(similar).toEqual(expect.arrayContaining(['Développé couché', 'Développé couché Smith']));
    expect(similar).not.toContain('Chest press');
    expect(similar).not.toContain('Écarté poulie');
    expect(similar).not.toContain('Dips');
  });

  it('keeps bodyweight with bodyweight', () => {
    expect(names(similarExercises(EXERCISES.dips))).toEqual(['Pompes']);
  });
});

describe('effectiveRule', () => {
  it("is the user's own rule, else the goal's", () => {
    expect(effectiveRule(EXERCISES.bench, ctx())).toEqual({ sets: 3, repMin: 8, repMax: 12 });
    expect(effectiveRule(EXERCISES.bench, ctx({ 'Développé couché': twoBySix }))).toEqual(twoBySix);
  });
});

describe('applyRule', () => {
  it('gives the new sets and reps to the similar exercises', () => {
    const overrides = applyRule(EXERCISES.chestpress, twoBySix, ctx(), true);
    expect(overrides['Chest press']).toEqual(twoBySix);
    expect(overrides['Développé couché']).toEqual(twoBySix);
    expect(overrides['Développé couché Smith']).toEqual(twoBySix);
    expect(overrides['Écarté poulie']).toBeUndefined();
  });

  it('only changes this exercise when asked', () => {
    expect(applyRule(EXERCISES.chestpress, twoBySix, ctx(), false)).toEqual({ 'Chest press': twoBySix });
  });

  it('leaves alone a similar exercise set differently on purpose', () => {
    const mine = { sets: 5, repMin: 3, repMax: 5 };
    const overrides = applyRule(EXERCISES.chestpress, twoBySix, ctx({ 'Développé couché': mine }), true);
    expect(overrides['Développé couché']).toEqual(mine);
    expect(overrides['Développé couché Smith']).toEqual(twoBySix);
  });

  it('keeps the group in step, one tap after another', () => {
    const first = applyRule(EXERCISES.chestpress, twoBySix, ctx(), true);
    const next = { ...twoBySix, repMax: 10 };
    const second = applyRule(EXERCISES.chestpress, next, ctx(first), true);
    expect(second['Développé couché Smith']).toEqual(next);
  });

  it('goes back to the goal for the whole group, storing nothing', () => {
    const changed = applyRule(EXERCISES.chestpress, twoBySix, ctx(), true);
    expect(applyRule(EXERCISES.chestpress, null, ctx(changed), true)).toEqual({});
  });

  it("does not store a rule equal to the goal's", () => {
    expect(applyRule(EXERCISES.chestpress, { sets: 3, repMin: 8, repMax: 12 }, ctx(), false)).toEqual({});
  });

  it('lists who follows: only exercises on the same rule today', () => {
    const force = ctx({}, 'force');
    // Strength goal: the barbell runs on 5 × 3-5, so it does not follow the machine
    expect(names(followers(EXERCISES.chestpress, force))).not.toContain('Développé couché');
    expect(names(followers(EXERCISES.chestpress, force))).toContain('Développé couché Smith');
  });
});

describe('followersLabel', () => {
  it('names a few, then counts the rest', () => {
    expect(followersLabel(['A'])).toBe('A');
    expect(followersLabel(['A', 'B', 'C'])).toBe('A, B et C');
    expect(followersLabel(['A', 'B', 'C', 'D'])).toBe('A, B, C + 1 autre');
    expect(followersLabel(['A', 'B', 'C', 'D', 'E'])).toBe('A, B, C + 2 autres');
  });
});
