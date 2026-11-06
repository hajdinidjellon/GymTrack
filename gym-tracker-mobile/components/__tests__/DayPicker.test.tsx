import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DayPicker } from '@/components/program/DayPicker';
import { choosableDays, isOffered } from '@/domain/programs';

const OWN = 'Ma séance, que tu composes toi-même, hors programme';
const days = choosableDays('ppl', {}, []).filter(isOffered);

describe('DayPicker', () => {
  it('shows the program, and keeps the other sessions behind one link', async () => {
    await render(<DayPicker days={days} current="Push" today="Push" onChoose={() => undefined} />);
    expect(screen.getByRole('radio', { name: 'Séance Push, prévue aujourd’hui' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Séance Pull' })).toBeOnTheScreen();
    expect(screen.queryByText('Full body')).toBeNull();
    expect(screen.getByRole('button', { name: 'Autre chose, pour une fois ?' })).toBeOnTheScreen();
  });

  it('offers Haut, Bas, one Full body and the own session off program', async () => {
    await render(<DayPicker days={days} current="Push" today="Push" onChoose={() => undefined} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Autre chose, pour une fois ?' }));
    expect(screen.getByText('Ou, pour une fois, hors programme')).toBeOnTheScreen();
    for (const name of ['Haut', 'Bas', 'Full body']) {
      expect(screen.getByRole('radio', { name: `Séance ${name}, hors programme` })).toBeOnTheScreen();
    }
    expect(screen.getByRole('radio', { name: OWN })).toBeOnTheScreen();
    expect(screen.queryByText('Full body A')).toBeNull();
    expect(screen.queryByText('Full body B')).toBeNull();
  });

  it('picks the own session, even before it has exercises', async () => {
    const onChoose = jest.fn();
    await render(<DayPicker days={days} current="Push" today="Push" onChoose={onChoose} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Autre chose, pour une fois ?' }));
    await fireEvent.press(screen.getByRole('radio', { name: OWN }));
    expect(onChoose).toHaveBeenCalledWith('Ma séance');
  });

  it('opens the other sessions when one of them is the current one', async () => {
    await render(<DayPicker days={days} current="Ma séance" today="Push" onChoose={() => undefined} />);
    expect(screen.getByRole('radio', { name: OWN })).toBeSelected();
    expect(screen.queryByRole('button', { name: 'Autre chose, pour une fois ?' })).toBeNull();
  });
});
