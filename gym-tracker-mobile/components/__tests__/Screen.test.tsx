import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Screen } from '@/components/ui/Screen';

describe('Screen', () => {
  it('draws the background decoration over the paper, under the content', async () => {
    await render(
      <Screen background={<Text>disque</Text>}>
        <Text>contenu</Text>
      </Screen>,
    );
    expect(screen.getByText('disque')).toBeOnTheScreen();
    expect(screen.getByText('contenu')).toBeOnTheScreen();
  });
});
