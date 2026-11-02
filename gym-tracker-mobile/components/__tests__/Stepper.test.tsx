import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Keyboard } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Stepper } from '@/components/ui/Stepper';

describe('Stepper', () => {
  it('puts an OK button above the number pad, which closes it', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    await render(
      <Stepper
        value="60"
        unit="kg"
        onMinus={jest.fn()}
        onPlus={jest.fn()}
        minusLabel="Moins"
        plusLabel="Plus"
        onChange={jest.fn()}
        inputLabel="Charge"
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'OK' }));
    expect(dismiss).toHaveBeenCalled();
  });
});
