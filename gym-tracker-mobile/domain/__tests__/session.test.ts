import { describe, expect, it } from '@jest/globals';
import * as Session from '@/domain/session';
import { formatKg } from '@/domain/plates';
import { findCurrent } from '@/domain/sessionCursor';
import { active, session } from './fixtures';

const bench = () =>
  active('bench', [
    { weight: 60, reps: 10 },
    { weight: 60, reps: 10 },
  ]);

describe('adding and removing sets', () => {
  it('adds a set copying the last target', () => {
    const s = Session.addSet(Session.completeSet(session([bench()]), 'bench', 1), 'bench');
    expect(s.exercises[0]!.sets).toHaveLength(3);
    expect(s.exercises[0]!.sets[2]).toMatchObject({ weight: 60, reps: 10, completed: false });
  });

  it('ignores an exercise with no sets or unknown', () => {
    const empty = session([active('x', [])]);
    expect(Session.addSet(empty, 'x')).toEqual(empty);
    expect(Session.removeSet(empty, 'nope', 0)).toBe(empty);
  });

  it('removes a set still to do and shifts the last validated one', () => {
    const three = session([
      active('bench', [
        { weight: 50, reps: 5 },
        { weight: 60, reps: 5 },
        { weight: 70, reps: 5 },
      ]),
    ]);
    const s = Session.removeSet(Session.completeSet(three, 'bench', 2), 'bench', 0);
    expect(s.exercises[0]!.sets.map((set) => set.weight)).toEqual([60, 70]);
    expect(s.lastCompleted).toEqual({ exerciseId: 'bench', setIndex: 1 });
  });

  it('keeps validated sets and the last set', () => {
    const done = Session.completeSet(session([bench()]), 'bench', 0);
    expect(Session.removeSet(done, 'bench', 0)).toBe(done);
    const one = session([active('bench', [{ weight: 60, reps: 10 }])]);
    expect(Session.removeSet(one, 'bench', 0)).toBe(one);
  });
});

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

  it('carries the weight and reps really done over to the next sets', () => {
    const changed = Session.updateSet(session([bench()]), 'bench', 0, { weight: 100, reps: 8 });
    const s = Session.completeSet(changed, 'bench', 0);
    expect(s.exercises[0]!.sets[1]).toMatchObject({ weight: 100, reps: 8, completed: false });
    expect(Session.completeSet(changed, 'bench', 9).exercises).toEqual(changed.exercises);
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

describe('timing the sets', () => {
  it('dates each validation, and only the sets left when all are done at once', () => {
    const one = Session.completeSet(session([bench()]), 'bench', 0, 1000);
    expect(one.exercises[0]!.sets[0]!.doneAt).toBe(1000);
    const all = Session.completeRemaining(one, 'bench', 5000);
    expect(all.exercises[0]!.sets.map((s) => s.doneAt)).toEqual([1000, 5000]);
  });

  it('saves the rest really taken, without the timestamps', () => {
    const s = Session.completeSet(Session.completeSet(session([bench()]), 'bench', 0, 0), 'bench', 1, 150_000);
    const sets = Session.toWorkout(s, new Date('2026-10-20T19:00:00Z')).exercises[0]!.sets;
    expect(sets.map((x) => x.restTaken)).toEqual([undefined, 110]);
    expect(sets[1]).not.toHaveProperty('doneAt');
  });
});

describe('replaceExercise', () => {
  const rows = active('row', [{ weight: 50, reps: 10 }]);

  it('takes the place of an exercise not started yet', () => {
    const s = Session.replaceExercise(session([bench(), active('ohp', [{ weight: 40, reps: 8 }])]), 'bench', rows);
    expect(s.exercises.map((e) => e.id)).toEqual(['row', 'ohp']);
  });

  it('keeps the sets already done and comes right after', () => {
    const started = Session.completeSet(session([bench(), active('ohp', [{ weight: 40, reps: 8 }])]), 'bench', 0);
    const s = Session.replaceExercise(started, 'bench', rows);
    expect(s.exercises.map((e) => e.id)).toEqual(['bench', 'row', 'ohp']);
    expect(s.exercises[0]!.sets).toHaveLength(1);
    expect(s.lastCompleted).toEqual({ exerciseId: 'bench', setIndex: 0 });
  });

  it('ignores an unknown exercise', () => {
    const s = session([bench()]);
    expect(Session.replaceExercise(s, 'nope', rows)).toBe(s);
  });
});

describe('changing the order', () => {
  const ohp = () => active('ohp', [{ weight: 40, reps: 8 }]);
  const dips = () => active('dips', [{ weight: 0, reps: 12 }]);
  const three = () => session([bench(), ohp(), dips()]);
  const ids = (s: ReturnType<typeof session>) => s.exercises.map((e) => e.id);

  describe('doNow', () => {
    it('brings a later exercise in front of the current one', () => {
      expect(ids(Session.doNow(three(), 'dips'))).toEqual(['dips', 'bench', 'ohp']);
    });

    it('puts a started exercise on hold, keeping its validated sets', () => {
      const started = Session.completeSet(three(), 'bench', 0);
      const s = Session.doNow(started, 'dips');
      expect(ids(s)).toEqual(['dips', 'bench', 'ohp']);
      expect(s.exercises[1]!.sets[0]!.completed).toBe(true);
      expect(s.lastCompleted).toEqual({ exerciseId: 'bench', setIndex: 0 });
    });

    it('lands after the exercises already finished', () => {
      const finished = Session.completeRemaining(three(), 'bench');
      expect(ids(Session.doNow(finished, 'dips'))).toEqual(['bench', 'dips', 'ohp']);
    });

    it.each([
      ['the current exercise', three(), 'bench'],
      ['a finished exercise', Session.completeRemaining(three(), 'ohp'), 'ohp'],
      ['an unknown exercise', three(), 'nope'],
      ['a finished session', Session.completeRemaining(session([bench()]), 'bench'), 'bench'],
    ])('leaves the session untouched for %s', (_, s, id) => {
      expect(Session.doNow(s, id)).toBe(s);
    });
  });

  describe('doLater', () => {
    it('sends the exercise to the end of the session', () => {
      expect(ids(Session.doLater(three(), 'bench'))).toEqual(['ohp', 'dips', 'bench']);
    });

    it('keeps the sets already validated on a started exercise', () => {
      const s = Session.doLater(Session.completeSet(three(), 'bench', 0), 'bench');
      expect(ids(s)).toEqual(['ohp', 'dips', 'bench']);
      expect(s.exercises[2]!.sets.map((x) => x.completed)).toEqual([true, false]);
    });

    it('makes the next exercise the current one', () => {
      const s = Session.doLater(three(), 'bench');
      expect(findCurrent(s.exercises)?.exercise.id).toBe('ohp');
    });

    it.each([
      ['the last exercise left', Session.completeRemaining(Session.completeRemaining(three(), 'ohp'), 'dips'), 'bench'],
      ['the last exercise of the list', three(), 'dips'],
      ['a finished exercise', Session.completeRemaining(three(), 'bench'), 'bench'],
      ['an unknown exercise', three(), 'nope'],
    ])('leaves the session untouched for %s', (_, s, id) => {
      expect(Session.doLater(s, id)).toBe(s);
    });
  });
});

describe('toWorkout', () => {
  it('keeps only exercises with a validated set and drops session-only fields', () => {
    const ex = { ...bench(), lastTime: '60 kg × 10', reason: 'x' };
    const s = Session.completeSet(session([ex, active('ohp', [{ weight: 40, reps: 8 }])]), 'bench', 0);
    const w = Session.toWorkout(s, new Date('2026-10-20T18:52:00Z'));
    expect(w.exercises.map((e) => e.name)).toEqual(['bench']);
    expect(w.exercises[0]).not.toHaveProperty('equipment');
    expect(w.exercises[0]).not.toHaveProperty('lastTime');
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

describe('undoLastSet', () => {
  it('takes back the last set and its rest', () => {
    const done = Session.startRest(Session.completeSet(session([bench()]), 'bench', 0), 90, 0);
    const undone = Session.undoLastSet(done);
    expect(undone.exercises[0]!.sets[0]!.completed).toBe(false);
    expect(undone).toMatchObject({ lastCompleted: null, restEndsAt: null });
  });

  it('does nothing when there is nothing to undo', () => {
    const fresh = session([bench()]);
    expect(Session.undoLastSet(fresh)).toBe(fresh);
  });
});
