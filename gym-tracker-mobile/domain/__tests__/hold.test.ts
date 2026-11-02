import { describe, expect, it } from '@jest/globals';
import { HOLD_PREP, holdPhase } from '@/domain/hold';

const START = 1_000_000;
const at = (seconds: number) => START + seconds * 1000;

describe('holdPhase', () => {
  it('counts down to get in position first', () => {
    expect(holdPhase(START, at(0), 45)).toEqual({ phase: 'prep', left: HOLD_PREP });
    expect(holdPhase(START, at(2.2), 45)).toEqual({ phase: 'prep', left: 1 });
    expect(holdPhase(START, at(-5), 45)).toEqual({ phase: 'prep', left: HOLD_PREP });
  });

  it('then counts the hold down to zero', () => {
    expect(holdPhase(START, at(HOLD_PREP), 45)).toEqual({ phase: 'hold', left: 45, held: 0 });
    expect(holdPhase(START, at(HOLD_PREP + 10.6), 45)).toEqual({ phase: 'hold', left: 35, held: 10 });
  });

  it('is done once the target is held, never more', () => {
    expect(holdPhase(START, at(HOLD_PREP + 45), 45)).toEqual({ phase: 'done', held: 45 });
    expect(holdPhase(START, at(HOLD_PREP + 300), 45)).toEqual({ phase: 'done', held: 45 });
  });
});
