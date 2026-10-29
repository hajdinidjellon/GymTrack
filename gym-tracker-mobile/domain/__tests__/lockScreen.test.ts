import { describe, expect, it } from '@jest/globals';
import { lockScreenProps } from '@/domain/lockScreen';
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
      restStart: null,
      restEnd: null,
      canValidate: true,
      done: false,
    });
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
    ['bodyweight', { equipment: 'bodyweight' as const }, 0, '10 reps', ''],
  ])('reads the load of %s', (_, patch, weight, target, plates) => {
    const s = session([active('a', [{ weight, reps: 10 }], patch)]);
    expect(lockScreenProps(s, gym, NOW)).toMatchObject({ target, plates });
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
    expect(lockScreenProps(s, gym, NOW)).toMatchObject({ exercise: 'Séance terminée', done: true, canValidate: false });
  });
});
