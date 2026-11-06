import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { WeekPicker } from '@/components/program/WeekPicker';

const names = ['Push', 'Pull', 'Legs'];
const week = [null, 'Push', null, 'Legs', null, null, null];

describe('WeekPicker', () => {
  it('opens the first session day and shows its choices', async () => {
    await render(<WeekPicker week={week} names={names} onChange={() => undefined} />);
    expect(screen.getByRole('button', { name: 'mardi : Push' })).toBeSelected();
    expect(screen.getByText('Le mardi, tu fais :')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Push' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Repos' })).not.toBeSelected();
  });

  it('puts the session chosen on the day picked', async () => {
    const onChange = jest.fn();
    await render(<WeekPicker week={week} names={names} onChange={onChange} />);
    await fireEvent.press(screen.getByRole('button', { name: 'samedi : repos' }));
    expect(screen.getByText('Le samedi, tu fais :')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('radio', { name: 'Pull' }));
    expect(onChange).toHaveBeenCalledWith([null, 'Push', null, 'Legs', null, 'Pull', null]);
  });

  it('opens Monday when the week is empty', async () => {
    const onChange = jest.fn();
    await render(<WeekPicker week={Array(7).fill(null)} names={names} onChange={onChange} />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Legs' }));
    expect(onChange).toHaveBeenCalledWith(['Legs', null, null, null, null, null, null]);
  });

  it('offers the days added to the program after its own', async () => {
    const onChange = jest.fn();
    await render(<WeekPicker week={week} names={[...names, 'Push B']} onChange={onChange} />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Push B' }));
    expect(onChange).toHaveBeenCalledWith([null, 'Push B', null, 'Legs', null, null, null]);
  });
});
