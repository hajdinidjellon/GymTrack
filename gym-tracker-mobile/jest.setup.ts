/* Mocks of the native modules used by stores and services. */

import { jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));

jest.mock('expo-sqlite/kv-store', () => {
  const memory = new Map<string, string>();
  return {
    Storage: {
      getItemSync: (key: string) => memory.get(key) ?? null,
      setItemSync: (key: string, value: string) => void memory.set(key, value),
      removeItemSync: (key: string) => void memory.delete(key),
    },
  };
});

jest.mock('@/services/notifications', () => ({
  requestPermissions: jest.fn(() => Promise.resolve(true)),
  scheduleRestCompleteNotification: jest.fn(() => Promise.resolve()),
  cancelRestCompleteNotification: jest.fn(() => Promise.resolve()),
}));

// Les avertissements attendus (réseau coupé simulé, etc.) ne polluent pas la sortie des tests
jest.mock('@/services/logger', () => ({ logger: { warn: jest.fn(), error: jest.fn() } }));

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
