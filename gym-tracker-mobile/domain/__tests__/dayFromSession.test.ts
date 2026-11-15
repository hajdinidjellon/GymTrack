import { describe, expect, it } from '@jest/globals';
import { dayOfSession, dayUpdateFrom } from '@/domain/dayFromSession';
import { getSplit } from '@/domain/programs';

const settings = { customDays: {}, customExercises: [], ownDays: {} };
const push = getSplit('ppl').days[0]!.exercises.map((e) => e.name);
const [a, b, c, d, e] = push as [string, string, string, string, string];
const known = (name: string) => name !== 'Gone';
const pushDay = dayOfSession('Push', 'ppl', settings);

describe('dayOfSession', () => {
  it('finds the day of the program or of another one, never a name it does not know', () => {
    expect(pushDay?.name).toBe('Push');
    expect(dayOfSession('Haut', 'ppl', settings)).toMatchObject({ split: 'ul', extra: true });
    expect(dayOfSession('Strong workout', 'ppl', settings)).toBeUndefined();
  });
});

describe('dayUpdateFrom', () => {
  it('offers nothing when the session followed the day', () => {
    expect(dayUpdateFrom(pushDay, push, push, known)).toBeNull();
    expect(dayUpdateFrom(undefined, [b, a], push, known)).toBeNull();
  });

  it('keeps the order of the session', () => {
    expect(dayUpdateFrom(pushDay, [b, a, c, d, e], push, known)).toEqual({
      key: 'ppl/Push',
      day: pushDay,
      before: push,
      names: [b, a, c, d, e],
    });
  });

  it('keeps the exercises left out to fit the time, drops the one swapped out', () => {
    // Started without e (time), c swapped for Curl, a done last
    const planned = [a, b, c, d];
    expect(dayUpdateFrom(pushDay, [b, 'Curl', d, a], planned, known)?.names).toEqual([b, 'Curl', d, a, e]);
  });

  it('from a past workout: what was done, without unknown names or doubles', () => {
    expect(dayUpdateFrom(pushDay, [b, a, 'Gone', b], undefined, known)?.names).toEqual([b, a]);
    expect(dayUpdateFrom(pushDay, ['Gone'], undefined, known)).toBeNull();
  });

  it('saves the own session under the user program', () => {
    const own = dayOfSession('Ma séance', 'ppl', settings);
    expect(dayUpdateFrom(own, [a, b], [], known)).toMatchObject({ key: 'ppl/Ma séance', names: [a, b] });
  });
});
