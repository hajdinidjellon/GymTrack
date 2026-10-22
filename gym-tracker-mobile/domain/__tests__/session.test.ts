import { describe, expect, it } from '@jest/globals';
import * as Session from '@/domain/session';
import { formatKg } from '@/domain/plates';
import { active, session } from './fixtures';

const bench = () =>
  active('bench', [
    { weight: 60, reps: 10 },
    { weight: 60, reps: 10 },
  ]);

describe('createSession', () => {
  it('starts with no rest and nothing done', () => {
    const s = Session.createSession('id', 'Push', [bench()], new Date('2026-10-20T18:00:00Z'));
    expect(s).toMatchObject({ workoutId: 'id', name: 'Push', restEndsAt: null, lastCompleted: null });
    expect(s.startedAt).toBe('2026-10-20T18:00:00.000Z');
  });
});

describe('sets', () => {
  it('completes a set and remembers it as the last one', () => {
    const s = Session.completeSet(session([bench()]), 'bench', 0);
    expect(s.exercises[0]!.sets[0]!.completed).toBe(true);
    expect(s.exercises[0]!.sets[1]!.completed).toBe(false);
    expect(s.lastCompleted).toEqual({ exerciseId: 'bench', setIndex: 0 });
  });

  it('ignores an unknown set or exercise', () => {
    const s = session([bench()]);
    expect(Session.updateSet(s, 'bench', 9, { reps: 1 }).exercises).toEqual(s.exercises);
    expect(Session.updateSet(s, 'nope', 0, { reps: 1 }).exercises).toEqual(s.exercises);
    expect(Session.findSet(s, 'nope', 0)).toBeUndefined();
  });

  it('completes every remaining set at once', () => {
    const s = Session.completeRemaining(Session.completeSet(session([bench()]), 'bench', 0), 'bench');
    expect(s.exercises[0]!.sets.every((set) => set.completed)).toBe(true);
    expect(s.lastCompleted).toEqual({ exerciseId: 'bench', setIndex: 1 });
  });

  it('leaves the session alone when nothing remains', () => {
    const done = Session.completeRemaining(session([bench()]), 'bench');
    expect(Session.completeRemaining(done, 'bench')).toBe(done);
    expect(Session.completeRemaining(done, 'nope')).toBe(done);
  });

  it('lists the sets still to do', () => {
    expect(Session.remainingSets(Session.completeSet(session([bench()]), 'bench', 0).exercises[0]!)).toEqual([1]);
  });

  it('knows when the session is done', () => {
    expect(Session.isDone(session([bench()]))).toBe(false);
    expect(Session.isDone(Session.completeRemaining(session([bench()]), 'bench'))).toBe(true);
  });
});

describe('nudge', () => {
  it('steps by the increment without float drift', () => {
    let w = 50;
    for (let i = 0; i < 3; i++) w = Session.nudge(w, 2.5);
    expect(w).toBe(57.5);
    expect(Session.nudge(0.1, 0.2)).toBe(0.3);
  });

  it('never goes below zero', () => {
    expect(Session.nudge(1, -2.5)).toBe(0);
  });
});

describe('setStartWeight', () => {
  it('sets weight and target on the sets still to do only', () => {
    const ex = active(
      'row',
      [
        { weight: 0, reps: 8, completed: true },
        { weight: 0, reps: 8 },
      ],
      { needsWeight: true },
    );
    const s = Session.setStartWeight(session([ex]), 'row', 40);
    const sets = s.exercises[0]!.sets;
    expect(s.exercises[0]!.needsWeight).toBe(false);
    expect(sets[0]!.weight).toBe(0);
    expect(sets[1]).toMatchObject({ weight: 40, target: { weight: 40, reps: 8 } });
  });
});

describe('rest', () => {
  it('stores an absolute end time and rounds the duration', () => {
    const s = Session.startRest(session([bench()]), 89.6, 1_000);
    expect(s.restDuration).toBe(90);
    expect(s.restEndsAt).toBe(91_000);
  });

  it('rests at least one second', () => {
    expect(Session.startRest(session([bench()]), 0, 0).restDuration).toBe(1);
  });

  it('counts the seconds left, rounded up, never negative', () => {
    const s = Session.startRest(session([bench()]), 90, 0);
    expect(Session.restLeft(s, 500)).toBe(90);
    expect(Session.restLeft(s, 89_001)).toBe(1);
    expect(Session.restLeft(s, 200_000)).toBe(0);
    expect(Session.restLeft(Session.endRest(s), 0)).toBe(0);
  });
});

describe('toWorkout', () => {
  it('keeps only exercises with a validated set and drops session-only fields', () => {
    const ex = bench();
    const s = Session.completeSet(session([ex, active('ohp', [{ weight: 40, reps: 8 }])]), 'bench', 0);
    const w = Session.toWorkout(s, new Date('2026-10-20T18:52:00Z'));
    expect(w.exercises.map((e) => e.name)).toEqual(['bench']);
    expect(w.exercises[0]).not.toHaveProperty('equipment');
    expect(w).toMatchObject({ id: 'w1', name: 'Push', duration: 52, completed: true });
  });
});

describe('nextSetSummary', () => {
  it('describes the next set for the rest notification', () => {
    expect(Session.nextSetSummary(session([bench()]), formatKg)).toBe('bench · 60 kg × 10');
    const pullups = active('pullup', [{ weight: 0, reps: 8 }]);
    expect(Session.nextSetSummary(session([pullups]), formatKg)).toBe('pullup · 8 reps');
    expect(Session.nextSetSummary(Session.completeRemaining(session([bench()]), 'bench'), formatKg)).toBe(
      'Lance ta prochaine série.',
    );
  });
});
