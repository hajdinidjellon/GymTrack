import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RuleEditor } from '@/components/program/RuleEditor';

const base = { sets: 3, repMin: 8, repMax: 12 };

describe('RuleEditor', () => {
  it('changes the sets and keeps the reps valid', async () => {
    const onChange = jest.fn();
    await render(<RuleEditor rule={base} base={base} custom={false} onChange={onChange} onReset={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Séries : plus un' }));
    expect(onChange).toHaveBeenLastCalledWith({ sets: 4, repMin: 8, repMax: 12 });
    expect(screen.queryByRole('button', { name: /Revenir/ })).toBeNull();
  });

  it('does nothing at a limit', async () => {
    const onChange = jest.fn();
    const rule = { sets: 1, repMin: 8, repMax: 8 };
    await render(<RuleEditor rule={rule} base={base} custom onChange={onChange} onReset={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Séries : moins un' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Reps maxi : moins un' }));
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Reps mini : plus un' }));
    expect(onChange).toHaveBeenLastCalledWith({ sets: 1, repMin: 9, repMax: 9 });
  });

  it('goes back to the goal rule', async () => {
    const onReset = jest.fn();
    await render(<RuleEditor rule={{ ...base, sets: 5 }} base={base} custom onChange={jest.fn()} onReset={onReset} />);
    await fireEvent.press(screen.getByRole('button', { name: /Revenir à 3 × 8–12/ }));
    expect(onReset).toHaveBeenCalled();
  });
});
