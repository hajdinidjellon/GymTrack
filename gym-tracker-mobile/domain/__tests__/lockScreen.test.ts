import { describe, expect, it } from '@jest/globals';
import { lockScreenProps, lockScreenState } from '@/domain/lockScreen';
import { DEFAULT_PLATES } from '@/domain/plates';
import { active, session } from './fixtures';

const gym = { barWeight: 20, plates: DEFAULT_PLATES };
const NOW = 1_000_000;

describe('lockScreenProps', () => {
  it('shows the set to do, its target and the plates per side', () => {
    const s = session([
      active('Développé couché', [
        { weight: 80, reps: 8, completed: true },
        { weight: 80, reps: 8 },
      ]),
    ]);
    expect(lockScreenProps(s, gym, NOW)).toEqual({
      session: 'Push',
      exercise: 'Développé couché',
      setLabel: 'Série 2/2',
      target: '80 kg × 8',
      plates: '20 + 10 par côté',
      plateList: [
        { kg: 20, label: '20' },
        { kg: 10, label: '10' },
      ],
      setShort: '2/2',
      setsDone: 1,
      setsTotal: 2,
      labels: { validate: 'Valider', rest: 'Repos', upNext: 'Ensuite', perSide: 'par côté' },
      restStart: null,
      restEnd: null,
      canValidate: true,
      done: false,
    });
  });

  it('numbers a warm-up apart from the working sets', () => {
    const squat = active('Squat', [{ weight: 100, reps: 5 }]);
    squat.sets.unshift({ weight: 20, reps: 10, setType: 'warmup' }, { weight: 40, reps: 5, setType: 'warmup' });
    expect(lockScreenProps(session([squat]), gym, NOW)).toMatchObject({ setLabel: 'Échauf. 1/2', setShort: '1/2' });
  });

  it('gives the rest window while resting', () => {
    const s = { ...session([active('a', [{ weight: 80, reps: 8 }])]), restEndsAt: NOW + 60_000, restDuration: 90 };
    expect(lockScreenProps(s, gym, NOW)).toMatchObject({ restStart: NOW - 30_000, restEnd: NOW + 60_000 });
  });

  it('drops a rest already over', () => {
    const s = { ...session([active('a', [{ weight: 80, reps: 8 }])]), restEndsAt: NOW - 1, restDuration: 90 };
    expect(lockScreenProps(s, gym, NOW)).toMatchObject({ restStart: null, restEnd: null });
  });

  it.each([
    ['dumbbells', { equipment: 'dumbbell' as const }, 12, '12 kg par haltère × 10', ''],
    ['a stack machine', { equipment: 'machine' as const }, 45, '45 kg × 10', ''],
    [
      'a plate-loaded machine',
      { equipment: 'machine' as const, plateLoaded: true },
      25,
      '25 kg de chaque côté × 10',
      '20 + 5 par côté',
    ],
    ['bodyweight', { equipment: 'bodyweight' as const }, 0, 'Poids du corps × 10', ''],
  ])('reads the load of %s', (_, patch, weight, target, plates) => {
    const s = session([active('a', [{ weight, reps: 10 }], patch)]);
    expect(lockScreenProps(s, gym, NOW)).toMatchObject({ target, plates });
  });

  it('writes small plates the French way', () => {
    const s = session([active('Développé couché', [{ weight: 22.5, reps: 8 }])]);
    expect(lockScreenProps(s, gym, NOW).plateList).toEqual([{ kg: 1.25, label: '1,25' }]);
  });

  it('sends to the app when the start weight is still to pick', () => {
    const s = session([active('a', [{ weight: 0, reps: 10 }], { needsWeight: true })]);
    expect(lockScreenProps(s, gym, NOW)).toMatchObject({
      target: "Choisis ta charge dans l'app",
      plates: '',
      canValidate: false,
    });
  });

  it('says the session is over once every set is done', () => {
    const s = session([active('a', [{ weight: 80, reps: 8, completed: true }])]);
    expect(lockScreenProps(s, gym, NOW)).toMatchObject({
      exercise: 'Séance terminée',
      done: true,
      canValidate: false,
      plateList: [],
      setsDone: 1,
      setsTotal: 1,
    });
  });
});

describe('lockScreenProps on a hold', () => {
  it('shows the seconds to hold', () => {
    const plank = active('Gainage', [{ weight: 0, reps: 45 }], { equipment: 'bodyweight', timed: true });
    expect(lockScreenProps(session([plank]), gym, NOW).target).toBe('45 s');
  });
});

describe('lockScreenProps on a drop set', () => {
  it('names it', () => {
    const press = active('Squat', [{ weight: 100, reps: 5, completed: true }]);
    press.sets.push({ weight: 80, reps: 5, setType: 'drop' });
    expect(lockScreenProps(session([press]), gym, NOW).setLabel).toBe('Dégressive');
  });
});

describe('lockScreenState', () => {
  const settings = { ...gym, restTimerEnabled: true, defaultRestTime: 90, restBell: true, notifications: true };
  const twoSets = () => {
    const bench = active('Développé couché', [
      { weight: 80, reps: 8 },
      { weight: 80, reps: 8 },
    ]);
    bench.sets[0]!.restTime = 120;
    return session([bench, active('Squat', [{ weight: 100, reps: 5 }])]);
  };

  it('names the set the button validates, and the screens after each tap', () => {
    const state = lockScreenState(twoSets(), settings, NOW);
    const bench = state.set!.exerciseId;
    expect(state.set).toEqual({ exerciseId: bench, setIndex: 0 });
    // First tap: set 2, after the set's own rest
    expect(state.next).toMatchObject({
      setLabel: 'Série 2/2',
      setsDone: 1,
      restSeconds: 120,
      restStart: null,
      canValidate: true,
      set: { exerciseId: bench, setIndex: 1 },
    });
    expect(state.next).not.toHaveProperty('labels');
    // Second tap: the squat, after set 2's rest; the last screen known ahead has no button
    expect(state.next!.next).toMatchObject({ exercise: 'Squat', restSeconds: 90, canValidate: false, next: null });
  });

  it('carries the alarm words only with the bell on', () => {
    expect(lockScreenState(twoSets(), settings, NOW).alarm).toEqual({
      title: 'Repos terminé',
      stop: 'Arrêter',
      open: 'Ouvrir Okilo',
    });
    expect(lockScreenState(twoSets(), { ...settings, restBell: false }, NOW).alarm).toBeNull();
  });

  it('rests nothing when the rest timer is off, nor after the last set', () => {
    const off = lockScreenState(twoSets(), { ...settings, restTimerEnabled: false }, NOW);
    expect(off.next!.restSeconds).toBe(0);
    const last = session([active('a', [{ weight: 80, reps: 8 }])]);
    expect(lockScreenState(last, settings, NOW).next).toMatchObject({ done: true, restSeconds: 0, next: null });
  });

  it('knows nothing ahead while the start weight is still to pick', () => {
    const s = session([active('a', [{ weight: 0, reps: 10 }], { needsWeight: true })]);
    expect(lockScreenState(s, settings, NOW)).toMatchObject({ set: null, next: null });
  });
});
