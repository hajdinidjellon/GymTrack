import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CheckRow } from '@/components/ui/CheckRow';

describe('CheckRow', () => {
  it('flips the choice when the row is tapped, and shows its detail', async () => {
    const onChange = jest.fn<(checked: boolean) => void>();
    await render(<CheckRow label="Pareil ailleurs" detail="Squat, Presse" checked onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: 'Pareil ailleurs' });
    expect(box).toBeChecked();
    expect(screen.getByText('Squat, Presse')).toBeOnTheScreen();
    await fireEvent.press(box);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
