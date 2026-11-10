import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type * as AlarmKit from '@/services/alarmKit';

const mockNative = {
  isSupported: jest.fn(() => true),
  requestAuthorization: jest.fn(() => Promise.resolve('authorized')),
  schedule: jest.fn((..._args: unknown[]) => Promise.resolve(true)),
  cancel: jest.fn((_id: string) => Promise.resolve()),
};
let mockPresent = true;
jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn(() => (mockPresent ? mockNative : null)) }));
jest.unmock('@/services/alarmKit');

type Service = typeof AlarmKit;
/** A fresh copy: the native module is looked up when the file loads. */
function load(present = true): Service {
  mockPresent = present;
  let service!: Service;
  jest.isolateModules(() => {
    service = jest.requireActual<Service>('@/services/alarmKit');
  });
  return service;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNative.isSupported.mockReturnValue(true);
});

describe('alarmKit', () => {
  it('schedules the end of the rest with the alarm buttons in French', async () => {
    const { scheduleRestAlarm } = load();
    await expect(scheduleRestAlarm(1_000_000)).resolves.toBe(true);
    expect(mockNative.schedule).toHaveBeenCalledWith(
      expect.stringMatching(/^[0-9A-F-]{36}$/),
      1_000_000,
      'Repos terminé',
      'Arrêter',
      'Ouvrir Okilo',
    );
  });

  it('cancels always the same alarm', async () => {
    const { cancelRestAlarm, scheduleRestAlarm } = load();
    await scheduleRestAlarm(1);
    await cancelRestAlarm();
    expect(mockNative.cancel).toHaveBeenCalledWith(mockNative.schedule.mock.calls[0]![0] as string);
  });

  it('asks for the permission and says whether it was given', async () => {
    const { requestAlarmPermission } = load();
    await expect(requestAlarmPermission()).resolves.toBe(true);
    mockNative.requestAuthorization.mockResolvedValueOnce('denied');
    await expect(requestAlarmPermission()).resolves.toBe(false);
  });

  it('does nothing in Expo Go, where the module is missing', async () => {
    const service = load(false);
    expect(service.alarmKitAvailable()).toBe(false);
    await expect(service.scheduleRestAlarm(1)).resolves.toBe(false);
    await expect(service.requestAlarmPermission()).resolves.toBe(false);
    await service.cancelRestAlarm();
    expect(mockNative.cancel).not.toHaveBeenCalled();
  });

  it('does nothing before iOS 26', async () => {
    mockNative.isSupported.mockReturnValue(false);
    const { alarmKitAvailable, scheduleRestAlarm } = load();
    expect(alarmKitAvailable()).toBe(false);
    await expect(scheduleRestAlarm(1)).resolves.toBe(false);
    expect(mockNative.schedule).not.toHaveBeenCalled();
  });

  it('never crashes the session', async () => {
    const { alarmKitAvailable, cancelRestAlarm, requestAlarmPermission, scheduleRestAlarm } = load();
    mockNative.schedule.mockRejectedValueOnce(new Error('denied'));
    mockNative.requestAuthorization.mockRejectedValueOnce(new Error('no plist'));
    mockNative.cancel.mockRejectedValueOnce(new Error('gone'));
    await expect(scheduleRestAlarm(1)).resolves.toBe(false);
    await expect(requestAlarmPermission()).resolves.toBe(false);
    await expect(cancelRestAlarm()).resolves.toBeUndefined();
    mockNative.isSupported.mockImplementationOnce(() => {
      throw new Error('old module');
    });
    expect(alarmKitAvailable()).toBe(false);
  });
});
