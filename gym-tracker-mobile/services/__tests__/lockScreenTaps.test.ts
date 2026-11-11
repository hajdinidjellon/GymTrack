import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type * as Taps from '@/services/lockScreenTaps';

const mockNative = { takeLockScreenTaps: jest.fn((): unknown[] => []) };
let mockPresent = true;
jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn(() => (mockPresent ? mockNative : null)) }));

type Service = typeof Taps;
/** A fresh copy: the native module is looked up when the file loads. */
function load(present = true): Service {
  mockPresent = present;
  let service!: Service;
  jest.isolateModules(() => {
    service = jest.requireActual<Service>('@/services/lockScreenTaps');
  });
  return service;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('lockScreenTaps', () => {
  it('gives the queued taps oldest first, and drops what is not a tap', () => {
    mockNative.takeLockScreenTaps.mockReturnValue([
      { exerciseId: 'bench', setIndex: 1, at: 20 },
      { exerciseId: 'bench', setIndex: 0, at: 10 },
      { exerciseId: 'bench', setIndex: 0.5, at: 30 },
      { exerciseId: 3, setIndex: 0, at: 40 },
      null,
    ]);
    const { lockScreenTapsAvailable, takeLockScreenTaps } = load();
    expect(lockScreenTapsAvailable()).toBe(true);
    expect(takeLockScreenTaps()).toEqual([
      { exerciseId: 'bench', setIndex: 0, at: 10 },
      { exerciseId: 'bench', setIndex: 1, at: 20 },
    ]);
  });

  it('gives nothing when the native call fails', () => {
    mockNative.takeLockScreenTaps.mockImplementation(() => {
      throw new Error('native');
    });
    expect(load().takeLockScreenTaps()).toEqual([]);
  });

  it('is off without the native module (Expo Go, Android)', () => {
    const { lockScreenTapsAvailable, takeLockScreenTaps } = load(false);
    expect(lockScreenTapsAvailable()).toBe(false);
    expect(takeLockScreenTaps()).toEqual([]);
  });
});
