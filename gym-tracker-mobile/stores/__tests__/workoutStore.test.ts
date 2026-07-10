import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { saveWorkoutLocal, deleteWorkoutLocal, loadWorkoutsLocal } from '@/lib/db';
import { flushSyncQueue } from '@/lib/sync';
import { refreshAllNotifications } from '@/lib/notifications';
import type { Workout, UserProfile } from '@/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/lib/db', () => ({
  saveWorkoutLocal: jest.fn().mockResolvedValue(undefined),
  deleteWorkoutLocal: jest.fn().mockResolvedValue(undefined),
  loadWorkoutsLocal: jest.fn().mockResolvedValue([]),
  saveProfileLocal: jest.fn().mockResolvedValue(undefined),
  loadProfileLocal: jest.fn().mockResolvedValue(null),
  loadGoalsLocal: jest.fn().mockResolvedValue([]),
  saveGoalLocal: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/sync', () => ({
  flushSyncQueue: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/notifications', () => ({
  refreshAllNotifications: jest.fn().mockResolvedValue(undefined),
}));

// ── Fixtures ─────────────────────────────────────────────────────

function workout(daysAgo: number, over: Partial<Workout> = {}): Workout {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(12, 0, 0, 0);
  return {
    id: `w-${daysAgo}-${Math.random()}`,
    date: d.toISOString(),
    name: 'Push',
    type: 'strength',
    exercises: [],
    feeling: 3,
    completed: true,
    ...over,
  };
}

const profile: UserProfile = {
  name: 'Djell',
  height: 180,
  gender: 'male',
  experienceLevel: 'intermediate',
  prs: [],
  bodyStats: [],
  trainingFrequency: 4,
  goals: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  useWorkoutStore.setState({ workouts: [], isLoading: false });
  useProfileStore.setState({ profile: null });
});

// ── CRUD ─────────────────────────────────────────────────────────

describe('loadWorkouts', () => {
  it('charge depuis SQLite et lève le flag isLoading', async () => {
    const stored = [workout(0), workout(1)];
    jest.mocked(loadWorkoutsLocal).mockResolvedValue(stored);

    await useWorkoutStore.getState().loadWorkouts();

    expect(useWorkoutStore.getState().workouts).toEqual(stored);
    expect(useWorkoutStore.getState().isLoading).toBe(false);
  });
});

describe('addWorkout', () => {
  it('écrit en SQLite AVANT le store, puis déclenche la sync', async () => {
    const w = workout(0);
    await useWorkoutStore.getState().addWorkout(w);

    expect(saveWorkoutLocal).toHaveBeenCalledWith(w);
    expect(useWorkoutStore.getState().workouts[0]).toBe(w);
    expect(flushSyncQueue).toHaveBeenCalled();
  });

  it('si SQLite échoue, le store N’EST PAS modifié (offline-first)', async () => {
    jest.mocked(saveWorkoutLocal).mockRejectedValueOnce(new Error('disk full'));

    await expect(useWorkoutStore.getState().addWorkout(workout(0))).rejects.toThrow('disk full');
    expect(useWorkoutStore.getState().workouts).toHaveLength(0);
    expect(flushSyncQueue).not.toHaveBeenCalled();
  });

  it('ajoute en tête de liste (plus récent en premier)', async () => {
    const old = workout(5);
    useWorkoutStore.setState({ workouts: [old] });

    const fresh = workout(0);
    await useWorkoutStore.getState().addWorkout(fresh);
    expect(useWorkoutStore.getState().workouts.map((w) => w.id)).toEqual([fresh.id, old.id]);
  });

  it('replanifie les notifications si profil présent + notifs actives', async () => {
    useProfileStore.setState({ profile });
    const w = workout(0);
    await useWorkoutStore.getState().addWorkout(w);
    expect(refreshAllNotifications).toHaveBeenCalledWith(profile.onboarding, expect.any(Number), w.date);
  });

  it('sans profil : pas de replanification, l’ajout réussit quand même', async () => {
    await useWorkoutStore.getState().addWorkout(workout(0));
    expect(refreshAllNotifications).not.toHaveBeenCalled();
    expect(useWorkoutStore.getState().workouts).toHaveLength(1);
  });

  it('un échec de replanification ne fait pas échouer l’ajout (best-effort)', async () => {
    useProfileStore.setState({ profile });
    jest.mocked(refreshAllNotifications).mockRejectedValueOnce(new Error('notif down'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(useWorkoutStore.getState().addWorkout(workout(0))).resolves.toBeUndefined();
    expect(useWorkoutStore.getState().workouts).toHaveLength(1);
    warn.mockRestore();
  });
});

describe('updateWorkout / deleteWorkout', () => {
  it('updateWorkout remplace la séance par id', async () => {
    const w = workout(0, { name: 'Push' });
    useWorkoutStore.setState({ workouts: [w, workout(1)] });

    const updated = { ...w, name: 'Push modifié' };
    await useWorkoutStore.getState().updateWorkout(updated);

    expect(saveWorkoutLocal).toHaveBeenCalledWith(updated);
    expect(useWorkoutStore.getState().getWorkoutById(w.id)?.name).toBe('Push modifié');
    expect(useWorkoutStore.getState().workouts).toHaveLength(2);
  });

  it('deleteWorkout supprime en SQLite puis dans le store', async () => {
    const w = workout(0);
    useWorkoutStore.setState({ workouts: [w] });

    await useWorkoutStore.getState().deleteWorkout(w.id);

    expect(deleteWorkoutLocal).toHaveBeenCalledWith(w.id);
    expect(useWorkoutStore.getState().workouts).toHaveLength(0);
    expect(flushSyncQueue).toHaveBeenCalled();
  });

  it('si la suppression SQLite échoue, la séance reste dans le store', async () => {
    const w = workout(0);
    useWorkoutStore.setState({ workouts: [w] });
    jest.mocked(deleteWorkoutLocal).mockRejectedValueOnce(new Error('locked'));

    await expect(useWorkoutStore.getState().deleteWorkout(w.id)).rejects.toThrow('locked');
    expect(useWorkoutStore.getState().workouts).toHaveLength(1);
  });
});

// ── Sélecteurs ───────────────────────────────────────────────────

describe('sélecteurs', () => {
  it('getWorkoutById retrouve la bonne séance, undefined sinon', () => {
    const w = workout(0);
    useWorkoutStore.setState({ workouts: [w] });
    expect(useWorkoutStore.getState().getWorkoutById(w.id)).toBe(w);
    expect(useWorkoutStore.getState().getWorkoutById('inconnu')).toBeUndefined();
  });

  it('getLastWorkoutForExercise : insensible à la casse, retourne la plus récente', () => {
    const exo = {
      id: 'e1',
      name: 'Squat Barre',
      category: 'compound' as const,
      muscleGroups: ['legs' as const],
      sets: [],
    };
    const recent = workout(1, { exercises: [exo] });
    const older = workout(10, { exercises: [exo] });
    const other = workout(0); // pas de squat
    useWorkoutStore.setState({ workouts: [other, older, recent] });

    expect(useWorkoutStore.getState().getLastWorkoutForExercise('squat barre')).toBe(recent);
    expect(useWorkoutStore.getState().getLastWorkoutForExercise('curl inconnu')).toBeUndefined();
  });

  it('getWorkoutsThisWeek exclut les séances de plus d’une semaine', () => {
    const today = workout(0);
    const lastMonth = workout(30);
    useWorkoutStore.setState({ workouts: [today, lastMonth] });

    const thisWeek = useWorkoutStore.getState().getWorkoutsThisWeek();
    expect(thisWeek).toContain(today);
    expect(thisWeek).not.toContain(lastMonth);
  });
});
