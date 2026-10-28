import { beforeEach, describe, expect, it } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EXERCISES } from '@/domain/programs';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settingsStore';
import { SharedRuleEditor } from '@/components/program/SharedRuleEditor';

const base = { sets: 3, repMin: 8, repMax: 12 };
const overrides = () => useSettingsStore.getState().settings.ruleOverrides;
const renderEditor = () => render(<SharedRuleEditor def={EXERCISES.chestpress} goal="muscle" base={base} />);

beforeEach(() => {
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
});

describe('SharedRuleEditor', () => {
  it('changes the similar exercises along with this one', async () => {
    await renderEditor();
    expect(screen.getByRole('checkbox', { name: 'Pareil pour les exercices similaires' })).toBeChecked();
    await fireEvent.press(screen.getByRole('button', { name: 'Séries : moins un' }));
    expect(overrides()['Chest press']).toEqual({ sets: 2, repMin: 8, repMax: 12 });
    expect(overrides()['Développé couché']).toEqual({ sets: 2, repMin: 8, repMax: 12 });
  });

  it('changes only this exercise once unticked', async () => {
    await renderEditor();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Pareil pour les exercices similaires' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Séries : moins un' }));
    expect(overrides()).toEqual({ 'Chest press': { sets: 2, repMin: 8, repMax: 12 } });
  });

  it('hides the choice when no similar exercise is on the same rule', async () => {
    const mine = { sets: 5, repMin: 3, repMax: 5 };
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, ruleOverrides: { Pompes: mine } } });
    await render(<SharedRuleEditor def={EXERCISES.dips} goal="muscle" base={base} />);
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
});
