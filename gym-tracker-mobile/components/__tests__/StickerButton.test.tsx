import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PRESS_LOCK } from '@/components/ui/pressLock';
import { StickerButton } from '@/components/ui/StickerButton';

// Off for the other tests (jest.setup.ts): on here, at its real length
beforeEach(() => {
  PRESS_LOCK.ms = 400;
});
afterEach(() => {
  PRESS_LOCK.ms = 0;
  jest.restoreAllMocks();
});

describe('StickerButton', () => {
  it('takes a quick second tap for the same tap', async () => {
    let now = 10_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    const onPress = jest.fn();
    await render(<StickerButton label="Valider" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Valider' });

    await fireEvent.press(button);
    now += 120;
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);

    now += 400;
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('does nothing while disabled', async () => {
    const onPress = jest.fn();
    await render(<StickerButton label="Valider" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Valider' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
