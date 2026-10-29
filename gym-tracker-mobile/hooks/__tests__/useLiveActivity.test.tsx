import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react-native';
import { useLiveActivity } from '@/hooks/useLiveActivity';
import { useSessionStore } from '@/stores/sessionStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import type { LockScreenProps } from '@/domain/lockScreen';
import type { ActiveExercise } from '@/types';

type Listener = (event: { source: string; target: string }) => void;

const mockNative = {
  listener: null as Listener | null,
  instances: [] as { update: jest.Mock; end: jest.Mock }[],
  start: jest.fn(),
};

jest.mock('expo-widgets', () => ({
  addUserInteractionListener: (listener: Listener) => {
    mockNative.listener = listener;
    return { remove: () => (mockNative.listener = null) };
  },
}));

jest.mock('@/components/liveActivity/WorkoutActivity', () => ({
  VALIDATE_TARGET: 'validate',
  default: {
    start: (props: LockScreenProps) => {
      mockNative.start(props);
      const instance = {
        update: jest.fn(() => Promise.resolve()),
        end: jest.fn(() => {
          mockNative.instances = mockNative.instances.filter((i) => i !== instance);
          return Promise.resolve();
        }),
      };
      mockNative.instances.push(instance);
      return instance;
    },
    getInstances: () => mockNative.instances,
  },
}));

function exercise(id: string, sets: number, patch: Partial<ActiveExercise> = {}): ActiveExercise {
  return {
    id,
    name: id,
    category: 'compound',
    muscleGroups: ['chest'],
    equipment: 'barbell',
    needsWeight: false,
    sets: Array.from({ length: sets }, () => ({
      weight: 60,
      reps: 10,
      setType: 'normal' as const,
      restTime: 120,
      completed: false,
    })),
    ...patch,
  };
}

const store = () => useSessionStore.getState();
const tap = (target = 'validate') => mockNative.listener?.({ source: 'WorkoutActivity', target });

beforeEach(() => {
  jest.useFakeTimers();
  mockNative.instances = [];
  mockNative.start.mockClear();
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
});

afterEach(() => {
  store().discardSession();
  jest.useRealTimers();
});

describe('useLiveActivity', () => {
  it('shows the session on the lock screen as soon as it starts', async () => {
    await renderHook(() => useLiveActivity());
    store().startSession('Push', [exercise('bench', 2)]);
    expect(mockNative.start).toHaveBeenCalledWith(
      expect.objectContaining({ exercise: 'bench', setLabel: 'Série 1/2', target: '60 kg × 10' }),
    );
  });

  it('validates the current set from the lock screen button', async () => {
    await renderHook(() => useLiveActivity());
    store().startSession('Push', [exercise('bench', 2)]);
    tap();
    expect(store().activeSession!.exercises[0]!.sets[0]!.completed).toBe(true);
    expect(mockNative.instances[0]!.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ setLabel: 'Série 2/2', restEnd: expect.any(Number) }),
    );
  });

  it('ignores other buttons, and a set whose weight is still to pick', async () => {
    await renderHook(() => useLiveActivity());
    store().startSession('Push', [exercise('bench', 1, { needsWeight: true })]);
    tap('other');
    tap();
    expect(store().activeSession!.exercises[0]!.sets[0]!.completed).toBe(false);
  });

  it('takes back the activity already shown after a restart', async () => {
    store().startSession('Push', [exercise('bench', 2)]);
    const shown = { update: jest.fn(() => Promise.resolve()), end: jest.fn(() => Promise.resolve()) };
    mockNative.instances = [shown];
    await renderHook(() => useLiveActivity());
    expect(mockNative.start).not.toHaveBeenCalled();
    expect(shown.update).toHaveBeenCalledTimes(1);
  });

  it('ends the activity with the session, and stops listening on unmount', async () => {
    const { unmount } = await renderHook(() => useLiveActivity());
    store().startSession('Push', [exercise('bench', 1)]);
    store().discardSession();
    expect(mockNative.instances).toHaveLength(0);
    await unmount();
    expect(mockNative.listener).toBeNull();
  });
});
