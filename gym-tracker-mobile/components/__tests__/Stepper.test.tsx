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

  it('is as wide as the number really typed, so "37,5" keeps its 5', async () => {
    const onChange = jest.fn();
    await render(
      <Stepper
        value="37"
        unit="kg"
        onMinus={jest.fn()}
        onPlus={jest.fn()}
        minusLabel="Moins"
        plusLabel="Plus"
        onChange={onChange}
        inputLabel="Charge"
      />,
    );
    const input = screen.getByLabelText('Charge');
    const measure = screen.getByTestId('stepper-measure', { includeHiddenElements: true });
    expect(measure).toHaveTextContent('37');
    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, '37,5');
    expect(onChange).toHaveBeenLastCalledWith(37.5);
    // The hidden copy follows the typed text, in the same font
    expect(measure).toHaveTextContent('37,5');
    await fireEvent(measure, 'layout', { nativeEvent: { layout: { width: 131.4, height: 70 } } });
    expect(input).toHaveStyle({ width: 140 });
  });
});
