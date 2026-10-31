import { afterEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setLocale } from '@/i18n';
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

  it('promises no added weight on a bodyweight exercise', async () => {
    await render(
      <RuleEditor rule={base} base={base} custom={false} bodyweight onChange={jest.fn()} onReset={jest.fn()} />,
    );
    expect(screen.getByText(/sans plafond/)).toBeOnTheScreen();
    expect(screen.queryByText(/ajoute du poids/)).toBeNull();
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

  describe('in English', () => {
    afterEach(() => setLocale('fr'));

    it('labels the buttons and explains the climb', async () => {
      setLocale('en');
      const onReset = jest.fn();
      await render(
        <RuleEditor rule={{ ...base, sets: 5 }} base={base} custom onChange={jest.fn()} onReset={onReset} />,
      );
      expect(screen.getByRole('button', { name: 'Sets: plus one' })).toBeOnTheScreen();
      expect(screen.getByLabelText('Min reps: 8')).toBeOnTheScreen();
      expect(screen.getByText(/up to 12, then we add weight and you go back to 8/)).toBeOnTheScreen();
      await fireEvent.press(screen.getByRole('button', { name: 'Back to 3 × 8–12 (your goal)' }));
      expect(onReset).toHaveBeenCalled();
    });
  });
});
