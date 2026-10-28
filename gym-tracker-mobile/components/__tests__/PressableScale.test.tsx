import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PressableScale } from '@/components/ui/PressableScale';

describe('PressableScale', () => {
  it('lays out with containerStyle and presses through', async () => {
    const onPress = jest.fn();
    await render(
      <PressableScale accessibilityRole="button" containerStyle={{ flex: 1 }} onPress={onPress}>
        <Text>+2 kg</Text>
      </PressableScale>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ flex: 1 });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
