import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TabBar } from '@/components/navigation/TabBar';

async function setup(index: number) {
  const navigation = { emitter: { emit: jest.fn(() => ({ defaultPrevented: false })) }, navigateToTab: jest.fn() };
  const state = {
    index,
    routes: ['index', 'progress', 'profile'].map((name) => ({ key: `${name}-key`, name })),
  };
  const props = { state, ...navigation } as unknown as React.ComponentProps<typeof TabBar>;
  await render(<TabBar {...props} />);
  return navigation;
}

describe('TabBar', () => {
  it('always shows every label and marks the active tab', async () => {
    await setup(1);
    expect(screen.getByText("Aujourd'hui")).toBeOnTheScreen();
    expect(screen.getByText('Profil')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Progrès' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Profil' })).not.toBeSelected();
  });

  it('navigates to another tab', async () => {
    const navigation = await setup(0);
    await fireEvent.press(screen.getByRole('tab', { name: 'Profil' }));
    expect(navigation.navigateToTab).toHaveBeenCalledWith('profile-key');
  });

  it('does nothing when the active tab is pressed again', async () => {
    const navigation = await setup(0);
    await fireEvent.press(screen.getByRole('tab', { name: "Aujourd'hui" }));
    expect(navigation.navigateToTab).not.toHaveBeenCalled();
  });
});
