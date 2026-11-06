import { describe, expect, it } from '@jest/globals';
import { formatDuration, formatMoment, formatTime } from '@/domain/format';
import { keepOpen, toWorkout } from '@/domain/session';
import { isStale, lastActivity, lastSetAt, sessionEnd, timeline, withEnd, workoutEnd } from '@/domain/sessionTime';
import type { ActiveSession, Workout } from '@/types';
import { active, lift, session, workout } from './fixtures';

/** A local time on Tuesday 20 Oct 2026 (hours in the phone's time zone). */
const at = (hour: number, minute = 0, day = 20) => new Date(2026, 9, day, hour, minute).getTime();

/** A session started at 18:00, with sets validated at the given times (null: not done). */
function running(...times: (number | null)[]): ActiveSession {
  const s = session([
    active(
      'bench',
      times.map(() => ({ weight: 60, reps: 10 })),
    ),
  ]);
  return {
    ...s,
    startedAt: new Date(at(18)).toISOString(),
    exercises: s.exercises.map((e) => ({
      ...e,
      sets: e.sets.map((set, i) => {
        const time = times[i];
        return time == null ? set : { ...set, completed: true, doneAt: time };
      }),
    })),
  };
}

describe('lastActivity', () => {
  it.each([
    ['the last set validated', running(at(18, 10), at(18, 40), null), at(18, 40)],
    ['the start, nothing done yet', running(null, null), at(18)],
  ])('is %s', (_, s, expected) => {
    expect(lastActivity(s)).toBe(expected);
  });

  it('reads every exercise, in any order', () => {
    expect(lastSetAt([{ sets: [] }])).toBeNull();
    const s = running(at(18, 50));
    const other = active('row', [{ weight: 50, reps: 10, completed: true }]);
    other.sets[0]!.doneAt = at(18, 20);
    expect(lastSetAt([...s.exercises, other])).toBe(at(18, 50));
    // A set done without a time (old version) does not count
    expect(lastSetAt([active('x', [{ weight: 1, reps: 1, completed: true }])])).toBeNull();
  });
});

describe('sessionEnd', () => {
  const s = running(at(18, 10), at(19, 5));
  it.each([
    ['now, just after the last set', at(19, 12), at(19, 12)],
    ['now, 30 min after the last set', at(19, 35), at(19, 35)],
    ['the last set, once left idle', at(19, 36), at(19, 5)],
    ['the last set, the next morning', at(8, 0, 21), at(19, 5)],
  ])('is %s', (_, now, expected) => {
    expect(sessionEnd(s, now)).toBe(expected);
  });

  it('caps the saved duration: no 5-hour session for a forgotten "Terminer"', () => {
    const w = toWorkout(s, new Date(sessionEnd(s, at(23, 30))));
    expect(w.duration).toBe(65);
  });
});

describe('isStale', () => {
  const s = running(at(18, 10), at(19));
  it.each([
    ['in the middle of the session', at(19, 20), false],
    ['an hour after the last set', at(20), false],
    ['more than two hours after', at(21, 1), true],
  ])('%s: %s', (_, now, expected) => {
    expect(isStale(s, now)).toBe(expected);
  });

  it('is the next day after a long idle, even under two hours', () => {
    expect(isStale(running(at(23, 10)), at(0, 5, 21))).toBe(true);
  });

  it('is not when training goes on past midnight', () => {
    const late = running(at(23, 50));
    expect(isStale(late, at(0, 10, 21))).toBe(false);
  });

  it('waits again after "Reprendre"', () => {
    const kept = keepOpen(s, at(22));
    expect(kept.keptOpenAt).toBe(at(22));
    expect(isStale(kept, at(23))).toBe(false);
    expect(isStale(kept, at(0, 30, 21))).toBe(true);
  });
});

describe('withEnd', () => {
  const w: Workout = { ...workout(new Date(at(18)).toISOString(), 'Push', []), duration: 60 };
  it.each([
    ['moves the end', at(18, 45), 45],
    ['never later than now', at(21), 120],
    ['never before the start', at(17), 1],
  ])('%s', (_, end, minutes) => {
    expect(withEnd(w, end, at(20)).duration).toBe(minutes);
  });

  it('gives the end of a saved session', () => {
    expect(workoutEnd(w)).toBe(at(19));
    expect(workoutEnd({ ...w, duration: undefined })).toBeNull();
  });
});

describe('timeline', () => {
  const timed = (name: string, ...times: number[]) => {
    const e = lift(
      name,
      60,
      times.map(() => 10),
    );
    return { ...e, sets: e.sets.map((s, i) => ({ ...s, doneAt: times[i] })) };
  };
  const start = new Date(at(18)).toISOString();

  it('gives the start, the end and the time of each exercise', () => {
    const w = {
      ...workout(start, 'Push', [timed('Squat', at(18, 10), at(18, 20)), timed('Curl', at(18, 25), at(18, 32))]),
      duration: 35,
    };
    expect(timeline(w)).toEqual({
      start: at(18),
      end: at(18, 35),
      minutes: 35,
      blocks: [
        { names: ['Squat'], minutes: 20 },
        { names: ['Curl'], minutes: 12 },
      ],
    });
  });

  it('puts exercises done in turn in one block, in the order done', () => {
    const w = {
      ...workout(start, 'Push', [
        timed('Curl', at(18, 40)),
        timed('Bench', at(18, 5), at(18, 15)),
        timed('Row', at(18, 8), at(18, 18)),
      ]),
      duration: 45,
    };
    expect(timeline(w)?.blocks).toEqual([
      { names: ['Bench', 'Row'], minutes: 18 },
      { names: ['Curl'], minutes: 22 },
    ]);
  });

  it('shows only start and end when sets have no time (older sessions)', () => {
    const w = { ...workout(start, 'Push', [lift('Squat', 60, [10]), timed('Curl', at(18, 25))]), duration: 40 };
    expect(timeline(w)?.blocks).toEqual([]);
    expect(timeline({ ...w, exercises: [] })?.blocks).toEqual([]);
  });

  it('has nothing to show without a duration', () => {
    expect(timeline(workout(start, 'Push', []))).toBeNull();
  });
});

describe('time formats', () => {
  it('writes hours, moments and durations', () => {
    expect(formatTime(at(19, 42))).toBe('19:42');
    expect(formatMoment(at(19, 42), at(21))).toBe('19:42');
    expect(formatMoment(at(19, 42), at(9, 0, 21))).toBe('hier à 19:42');
    expect(formatMoment(at(19, 42), at(9, 0, 23))).toBe('Mar. 20 oct. à 19:42');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(68)).toBe('1 h 08');
    expect(formatDuration(-3)).toBe('0 min');
  });
});
