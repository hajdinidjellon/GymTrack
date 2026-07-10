import { useProfileStore } from '@/stores/profileStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { saveProfileLocal, loadProfileLocal, saveGoalLocal, loadGoalsLocal } from '@/lib/db';
import { flushSyncQueue } from '@/lib/sync';
import type { UserProfile, TrainingGoal, PersonalRecord, Workout } from '@/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/lib/db', () => ({
  saveProfileLocal: jest.fn().mockResolvedValue(undefined),
  loadProfileLocal: jest.fn().mockResolvedValue(null),
  saveGoalLocal: jest.fn().mockResolvedValue(undefined),
  loadGoalsLocal: jest.fn().mockResolvedValue([]),
  saveWorkoutLocal: jest.fn().mockResolvedValue(undefined),
  deleteWorkoutLocal: jest.fn().mockResolvedValue(undefined),
  loadWorkoutsLocal: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/sync', () => ({
  flushSyncQueue: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/notifications', () => ({
  refreshAllNotifications: jest.fn().mockResolvedValue(undefined),
}));

// ── Fixtures ─────────────────────────────────────────────────────

const profile = (over: Partial<UserProfile> = {}): UserProfile => ({
  name: 'Djell',
  height: 180,
  gender: 'male',
  experienceLevel: 'intermediate',
  prs: [],
  bodyStats: [],
  trainingFrequency: 4,
  goals: [],
  ...over,
});

const pr = (exercise: string, weight: number): PersonalRecord => ({
  exercise,
  weight,
  reps: 1,
  oneRepMax: weight,
  date: new Date().toISOString(),
});

const goal = (over: Partial<TrainingGoal> = {}): TrainingGoal => ({
  id: 'g1',
  type: 'pr',
  currentValue: 80,
  targetValue: 100,
  status: 'active',
  createdAt: new Date().toISOString(),
  progress: 0,
  ...over,
});

function workoutToday(): Workout {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return {
    id: `w-${Math.random()}`,
    date: d.toISOString(),
    name: 'Push',
    type: 'strength',
    exercises: [],
    duration: 60,
    feeling: 3,
    completed: true,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useProfileStore.setState({ profile: null, goals: [], isLoading: false });
  useWorkoutStore.setState({ workouts: [] });
});

// ── Profil ───────────────────────────────────────────────────────

describe('profil', () => {
  it('loadProfile hydrate depuis SQLite', async () => {
    const p = profile();
    jest.mocked(loadProfileLocal).mockResolvedValue(p);
    await useProfileStore.getState().loadProfile();
    expect(useProfileStore.getState().profile).toBe(p);
    expect(useProfileStore.getState().isLoading).toBe(false);
  });

  it('saveProfile écrit en SQLite AVANT le store, puis sync', async () => {
    const p = profile();
    await useProfileStore.getState().saveProfile(p);
    expect(saveProfileLocal).toHaveBeenCalledWith(p);
    expect(useProfileStore.getState().profile).toBe(p);
    expect(flushSyncQueue).toHaveBeenCalled();
  });

  it('si SQLite échoue, le store reste intact', async () => {
    jest.mocked(saveProfileLocal).mockRejectedValueOnce(new Error('disk'));
    await expect(useProfileStore.getState().saveProfile(profile())).rejects.toThrow('disk');
    expect(useProfileStore.getState().profile).toBeNull();
  });

  it('updateProfile fusionne le patch ; no-op sans profil chargé', async () => {
    await useProfileStore.getState().updateProfile({ name: 'X' });
    expect(saveProfileLocal).not.toHaveBeenCalled();

    useProfileStore.setState({ profile: profile() });
    await useProfileStore.getState().updateProfile({ trainingFrequency: 5 });
    expect(useProfileStore.getState().profile).toMatchObject({
      name: 'Djell',
      trainingFrequency: 5,
    });
  });
});

// ── PRs & mensurations ───────────────────────────────────────────

describe('addPR', () => {
  it('ajoute un nouveau PR', async () => {
    useProfileStore.setState({ profile: profile() });
    await useProfileStore.getState().addPR(pr('Squat barre', 140));
    expect(useProfileStore.getState().profile!.prs).toHaveLength(1);
  });

  it('remplace le PR existant du même exercice (insensible à la casse)', async () => {
    useProfileStore.setState({ profile: profile({ prs: [pr('Développé couché', 100)] }) });
    await useProfileStore.getState().addPR(pr('développé COUCHÉ', 105));

    const prs = useProfileStore.getState().profile!.prs;
    expect(prs).toHaveLength(1);
    expect(prs[0]!.weight).toBe(105);
  });
});

describe('addBodyStats', () => {
  it('ajoute en tête et déduplique par date', async () => {
    const d1 = '2026-07-01';
    useProfileStore.setState({
      profile: profile({ bodyStats: [{ date: d1, weight: 80 }] }),
    });

    await useProfileStore.getState().addBodyStats({ date: d1, weight: 79 });
    let stats = useProfileStore.getState().profile!.bodyStats;
    expect(stats).toHaveLength(1);
    expect(stats[0]!.weight).toBe(79);

    await useProfileStore.getState().addBodyStats({ date: '2026-07-08', weight: 78 });
    stats = useProfileStore.getState().profile!.bodyStats;
    expect(stats).toHaveLength(2);
    expect(stats[0]!.date).toBe('2026-07-08'); // plus récent en premier
  });
});

// ── Goals ────────────────────────────────────────────────────────

describe('goals', () => {
  it('loadGoals hydrate depuis SQLite', async () => {
    jest.mocked(loadGoalsLocal).mockResolvedValue([goal()]);
    await useProfileStore.getState().loadGoals();
    expect(useProfileStore.getState().goals).toHaveLength(1);
  });

  it('saveGoal ajoute ou remplace par id (SQLite d’abord)', async () => {
    await useProfileStore.getState().saveGoal(goal({ id: 'g1', progress: 10 }));
    await useProfileStore.getState().saveGoal(goal({ id: 'g2' }));
    await useProfileStore.getState().saveGoal(goal({ id: 'g1', progress: 40 }));

    const goals = useProfileStore.getState().goals;
    expect(goals).toHaveLength(2);
    expect(goals.find((g) => g.id === 'g1')!.progress).toBe(40);
    expect(saveGoalLocal).toHaveBeenCalledTimes(3);
  });

  it('updateGoalProgress passe le goal en completed à 100 %', async () => {
    useProfileStore.setState({ goals: [goal({ id: 'g1', progress: 50 })] });

    await useProfileStore.getState().updateGoalProgress('g1', 80);
    expect(useProfileStore.getState().goals[0]).toMatchObject({ progress: 80, status: 'active' });

    await useProfileStore.getState().updateGoalProgress('g1', 100);
    expect(useProfileStore.getState().goals[0]).toMatchObject({ progress: 100, status: 'completed' });
  });

  it('updateGoalProgress sur un goal inconnu : no-op', async () => {
    await useProfileStore.getState().updateGoalProgress('inconnu', 50);
    expect(saveGoalLocal).not.toHaveBeenCalled();
  });
});

// ── Sélecteurs gamification ──────────────────────────────────────

describe('sélecteurs gamification', () => {
  it('0 workout → 0 XP, rang Bronze I, progression 0 %', () => {
    const s = useProfileStore.getState();
    expect(s.getTotalXP()).toBe(0);
    expect(s.getStreak()).toBe(0);
    expect(s.getCurrentRank()).toMatchObject({ tier: 'bronze', level: 1 });
    expect(s.getXPProgress()).toBe(0);
  });

  it('reflète les workouts du workoutStore (XP, streak, progression)', () => {
    useWorkoutStore.setState({ workouts: [workoutToday()] });

    const s = useProfileStore.getState();
    // Séance du jour, 60 min : 50 base + 60 durée + 20 feeling + 20 récent + 15 streak = 165
    expect(s.getTotalXP()).toBe(165);
    expect(s.getStreak()).toBe(1);
    expect(s.getXPProgress()).toBe(33); // 165 / 500 dans Bronze I
  });

  it('la mémoïsation est invalidée quand le tableau workouts change', () => {
    const s = useProfileStore.getState();
    expect(s.getTotalXP()).toBe(0);

    useWorkoutStore.setState({ workouts: [workoutToday()] });
    expect(s.getTotalXP()).toBe(165);
  });
});
