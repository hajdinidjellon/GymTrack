import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Keyboard } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Stepper } from '@/components/ui/Stepper';

describe('Stepper', () => {
  it('shows an OK button while typing, which closes the keyboard', async () => {
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
    expect(screen.queryByRole('button', { name: 'OK' })).toBeNull();
    await fireEvent(screen.getByLabelText('Charge'), 'focus');
    await fireEvent.press(screen.getByRole('button', { name: 'OK' }));
    expect(dismiss).toHaveBeenCalled();
  });
});
