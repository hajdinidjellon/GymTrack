import * as Haptics from 'expo-haptics';
import { useSessionStore } from '@/stores/sessionStore';
import {
  scheduleRestCompleteNotification,
  cancelRestCompleteNotification,
} from '@/lib/notifications';
import type { ActiveExercise, ActiveSession } from '@/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('@/lib/notifications', () => ({
  scheduleRestCompleteNotification: jest.fn().mockResolvedValue(undefined),
  cancelRestCompleteNotification: jest.fn().mockResolvedValue(undefined),
}));

// ── Fixtures ─────────────────────────────────────────────────────

const exercise = (id = 'ex-1'): ActiveExercise => ({
  id,
  name: 'Développé couché barre',
  category: 'compound',
  muscleGroups: ['chest', 'shoulders', 'arms'],
  isExpanded: true,
  sets: [
    { weight: 60, reps: 8, setType: 'normal', completed: false },
    { weight: 60, reps: 8, setType: 'normal', completed: false },
  ],
});

const getSession = () => useSessionStore.getState().activeSession;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-07-10T10:00:00.000Z'));
  jest.clearAllMocks();
});

afterEach(() => {
  // Nettoie séance + intervals pour ne rien laisser fuir entre les tests
  useSessionStore.getState().discardSession();
  jest.useRealTimers();
});

// ── Cycle de vie ─────────────────────────────────────────────────

describe('startSession', () => {
  it('initialise une séance vide avec nom, type et chrono à 0', () => {
    useSessionStore.getState().startSession('Push', 'hypertrophy');
    expect(getSession()).toMatchObject({
      name: 'Push',
      type: 'hypertrophy',
      exercises: [],
      elapsedSeconds: 0,
      isResting: false,
      restSecondsLeft: null,
    });
    expect(getSession()!.workoutId).toBeTruthy();
  });

  it('le chrono avance d’une seconde par seconde', () => {
    useSessionStore.getState().startSession('Push', 'strength');
    jest.advanceTimersByTime(3000);
    expect(getSession()!.elapsedSeconds).toBe(3);
  });

  it('redémarrer une séance remplace l’ancienne sans empiler les intervals (NR-2)', () => {
    const store = useSessionStore.getState();
    store.startSession('Push', 'strength');
    const firstInterval = useSessionStore.getState().sessionInterval;
    store.startSession('Pull', 'strength');
    expect(useSessionStore.getState().sessionInterval).not.toBe(firstInterval);
    jest.advanceTimersByTime(2000);
    // Un seul interval actif : le chrono ne compte pas double
    expect(getSession()!.elapsedSeconds).toBe(2);
  });
});

describe('finishSession', () => {
  it('retourne null sans séance active', () => {
    expect(useSessionStore.getState().finishSession()).toBeNull();
  });

  it('construit le Workout : durée en minutes, nom/type conservés (NR-3), isExpanded retiré', () => {
    const store = useSessionStore.getState();
    store.startSession('Legs — template', 'hypertrophy');
    store.addExercise(exercise());
    jest.advanceTimersByTime(30 * 60 * 1000);

    const result = useSessionStore.getState().finishSession(5);

    expect(result).toMatchObject({
      name: 'Legs — template',
      type: 'hypertrophy',
      duration: 30,
      feeling: 5,
      completed: true,
    });
    expect(result!.exercises[0]).not.toHaveProperty('isExpanded');
    expect(getSession()).toBeNull();
  });

  it('feeling par défaut = 3', () => {
    useSessionStore.getState().startSession('Push', 'strength');
    expect(useSessionStore.getState().finishSession()!.feeling).toBe(3);
  });

  it('arrête chrono et timer de repos (aucun interval survivant, NR-2)', () => {
    const store = useSessionStore.getState();
    store.startSession('Push', 'strength');
    store.startRestTimer(90);
    useSessionStore.getState().finishSession();

    const state = useSessionStore.getState();
    expect(state.sessionInterval).toBeNull();
    expect(state.restInterval).toBeNull();
  });
});

describe('discardSession', () => {
  it('jette la séance et coupe tous les timers', () => {
    const store = useSessionStore.getState();
    store.startSession('Push', 'strength');
    store.startRestTimer(60);
    useSessionStore.getState().discardSession();

    const state = useSessionStore.getState();
    expect(state.activeSession).toBeNull();
    expect(state.sessionInterval).toBeNull();
    expect(state.restInterval).toBeNull();
  });
});

// ── Reprise après kill (NR-1 / NR-5) ─────────────────────────────

describe('resumeSession', () => {
  const sessionAgedOf = (ageMs: number, over: Partial<ActiveSession> = {}): ActiveSession => ({
    workoutId: 'w-resume',
    name: 'Push',
    type: 'strength',
    startedAt: new Date(Date.now() - ageMs).toISOString(),
    exercises: [],
    elapsedSeconds: 0,
    restSecondsLeft: null,
    restEndsAt: null,
    isResting: false,
    lastCompletedSetIndex: null,
    ...over,
  });

  it('recalcule le chrono depuis startedAt et relance le tick', () => {
    useSessionStore.setState({ activeSession: sessionAgedOf(10 * 60 * 1000) });
    useSessionStore.getState().resumeSession();

    expect(getSession()!.elapsedSeconds).toBe(600);
    jest.advanceTimersByTime(2000);
    expect(getSession()!.elapsedSeconds).toBe(602);
  });

  it('jette silencieusement une séance de plus de 12 h (NR-5)', () => {
    useSessionStore.setState({ activeSession: sessionAgedOf(13 * 60 * 60 * 1000) });
    useSessionStore.getState().resumeSession();
    expect(getSession()).toBeNull();
  });

  it('reprend un repos encore en cours', () => {
    useSessionStore.setState({
      activeSession: sessionAgedOf(5 * 60 * 1000, {
        isResting: true,
        restSecondsLeft: 30,
        restEndsAt: Date.now() + 30_000,
      }),
    });
    useSessionStore.getState().resumeSession();

    expect(getSession()!.isResting).toBe(true);
    jest.advanceTimersByTime(31_000);
    expect(getSession()!.isResting).toBe(false);
    expect(getSession()!.restSecondsLeft).toBe(0);
  });

  it('clôt un repos expiré pendant que l’app était tuée', () => {
    useSessionStore.setState({
      activeSession: sessionAgedOf(5 * 60 * 1000, {
        isResting: true,
        restSecondsLeft: 12,
        restEndsAt: Date.now() - 1000,
      }),
    });
    useSessionStore.getState().resumeSession();

    expect(getSession()).toMatchObject({ isResting: false, restSecondsLeft: 0, restEndsAt: null });
  });

  it('sans séance : no-op', () => {
    expect(() => useSessionStore.getState().resumeSession()).not.toThrow();
    expect(getSession()).toBeNull();
  });
});

// ── Exercices ────────────────────────────────────────────────────

describe('gestion des exercices', () => {
  beforeEach(() => {
    useSessionStore.getState().startSession('Push', 'strength');
  });

  it('addExercise / removeExercise', () => {
    const store = useSessionStore.getState();
    store.addExercise(exercise('a'));
    store.addExercise(exercise('b'));
    expect(getSession()!.exercises.map((e) => e.id)).toEqual(['a', 'b']);

    store.removeExercise('a');
    expect(getSession()!.exercises.map((e) => e.id)).toEqual(['b']);
  });

  it('reorderExercises réordonne et ignore les ids inconnus', () => {
    const store = useSessionStore.getState();
    store.addExercise(exercise('a'));
    store.addExercise(exercise('b'));
    store.addExercise(exercise('c'));

    store.reorderExercises(['c', 'fantome', 'a', 'b']);
    expect(getSession()!.exercises.map((e) => e.id)).toEqual(['c', 'a', 'b']);
  });

  it('toggleExerciseExpanded ne touche que l’exercice ciblé', () => {
    const store = useSessionStore.getState();
    store.addExercise(exercise('a'));
    store.addExercise(exercise('b'));

    store.toggleExerciseExpanded('a');
    const [a, b] = getSession()!.exercises;
    expect(a!.isExpanded).toBe(false);
    expect(b!.isExpanded).toBe(true);
  });
});

// ── Séries ───────────────────────────────────────────────────────

describe('gestion des séries', () => {
  beforeEach(() => {
    const store = useSessionStore.getState();
    store.startSession('Push', 'strength');
    store.addExercise(exercise('ex-1'));
  });

  it('updateSet patch une série sans toucher aux autres', () => {
    useSessionStore.getState().updateSet('ex-1', 0, { weight: 80, reps: 5 });
    const sets = getSession()!.exercises[0]!.sets;
    expect(sets[0]).toMatchObject({ weight: 80, reps: 5 });
    expect(sets[1]).toMatchObject({ weight: 60, reps: 8 });
  });

  it('addSet ajoute en fin de liste', () => {
    useSessionStore.getState().addSet('ex-1', {
      weight: 70, reps: 6, setType: 'top', completed: false,
    });
    const sets = getSession()!.exercises[0]!.sets;
    expect(sets).toHaveLength(3);
    expect(sets[2]).toMatchObject({ weight: 70, setType: 'top' });
  });

  it('removeSet retire la série à l’index donné', () => {
    useSessionStore.getState().removeSet('ex-1', 0);
    expect(getSession()!.exercises[0]!.sets).toHaveLength(1);
  });

  it('completeSet marque la série, retient l’index et déclenche l’haptique', () => {
    useSessionStore.getState().completeSet('ex-1', 1);
    expect(getSession()!.exercises[0]!.sets[1]!.completed).toBe(true);
    expect(getSession()!.lastCompletedSetIndex).toBe(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });
});

// ── Timer de repos ───────────────────────────────────────────────

describe('timer de repos', () => {
  beforeEach(() => {
    useSessionStore.getState().startSession('Push', 'strength');
  });

  it('startRestTimer arme le repos + la notification OS', () => {
    useSessionStore.getState().startRestTimer(90);
    expect(getSession()).toMatchObject({ isResting: true, restSecondsLeft: 90 });
    expect(scheduleRestCompleteNotification).toHaveBeenCalledWith(90);
  });

  it('décompte seconde par seconde depuis restEndsAt (pas de dérive)', () => {
    useSessionStore.getState().startRestTimer(10);
    jest.advanceTimersByTime(3000);
    expect(getSession()!.restSecondsLeft).toBe(7);
  });

  it('à zéro : repos terminé, interval coupé, haptique warning', () => {
    useSessionStore.getState().startRestTimer(5);
    jest.advanceTimersByTime(5000);

    expect(getSession()).toMatchObject({ isResting: false, restSecondsLeft: 0, restEndsAt: null });
    expect(useSessionStore.getState().restInterval).toBeNull();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('warning');
  });

  it('stopRestTimer coupe le repos et annule la notification OS', () => {
    const store = useSessionStore.getState();
    store.startRestTimer(60);
    useSessionStore.getState().stopRestTimer();

    expect(getSession()).toMatchObject({ isResting: false, restSecondsLeft: null });
    expect(useSessionStore.getState().restInterval).toBeNull();
    expect(cancelRestCompleteNotification).toHaveBeenCalled();
  });

  it('relancer un repos remplace le précédent sans empiler d’interval', () => {
    const store = useSessionStore.getState();
    store.startRestTimer(60);
    useSessionStore.getState().startRestTimer(10);

    jest.advanceTimersByTime(2000);
    expect(getSession()!.restSecondsLeft).toBe(8);
  });
});
