import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { OnboardingHeader } from '@/components/onboarding/OnboardingParts';
import { StatTile } from '@/components/stats/StatTile';

describe('screen reader labels', () => {
  it('reads a stat tile as one sentence', async () => {
    await render(<StatTile value="12" label="séries faites" />);
    expect(screen.getByLabelText('12, séries faites')).toBeOnTheScreen();
  });

  it('announces the onboarding steps as a progress bar', async () => {
    await render(<OnboardingHeader step={1} total={4} onBack={() => undefined} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAccessibleName('Question 2 sur 4');
    expect(bar.props.accessibilityValue).toEqual({ min: 1, max: 4, now: 2 });
  });
});
