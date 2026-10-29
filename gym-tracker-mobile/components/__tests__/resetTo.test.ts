import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { resetTo } from '@/components/navigation/resetTo';

jest.mock('expo-router', () => ({
  router: { canDismiss: jest.fn(), dismissAll: jest.fn(), replace: jest.fn() },
}));

type MockRouter = { canDismiss: jest.Mock<() => boolean>; dismissAll: jest.Mock; replace: jest.Mock };
const { router } = jest.requireMock<{ router: MockRouter }>('expo-router');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('resetTo', () => {
  it('closes the stacked screens, then replaces', () => {
    router.canDismiss.mockReturnValue(true);
    resetTo('/(tabs)');
    expect(router.dismissAll).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('only replaces when nothing is stacked', () => {
    router.canDismiss.mockReturnValue(false);
    resetTo('/(tabs)');
    expect(router.dismissAll).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });
});
