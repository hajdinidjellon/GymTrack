import { afterEach, describe, expect, it } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { InsightsCard } from '@/components/stats/InsightsCard';
import { WeekStrip } from '@/components/stats/WeekStrip';
import type { WeekDay } from '@/domain/stats';
import { setLocale } from '@/i18n';

afterEach(() => setLocale('fr'));

const week: WeekDay[] = Array.from({ length: 7 }, (_, i) => ({
  letter: 'LMMJVSD'[i]!,
  date: new Date(2026, 9, 26 + i),
  done: i === 0 || i === 2,
  today: i === 3,
  future: i > 3,
}));

describe('InsightsCard', () => {
  it('counts the sessions left, singular and plural', async () => {
    await render(<InsightsCard insights={[]} sessions={2} />);
    expect(screen.getByText(/^Encore 1 séance et je te dirai/)).toBeOnTheScreen();
    await render(<InsightsCard insights={[]} sessions={0} />);
    expect(screen.getByText(/^Encore 3 séances et je te dirai/)).toBeOnTheScreen();
  });

  it('speaks English', async () => {
    setLocale('en');
    await render(<InsightsCard insights={[]} sessions={2} />);
    expect(screen.getByText('What the app knows about you')).toBeOnTheScreen();
    expect(screen.getByText(/^1 more workout and I’ll tell you/)).toBeOnTheScreen();
  });
});

describe('WeekStrip', () => {
  it('names the days trained', async () => {
    await render(<WeekStrip days={week} />);
    expect(screen.getByLabelText('Entraîné lundi, mercredi')).toBeOnTheScreen();
  });

  it('names them in English', async () => {
    setLocale('en');
    await render(<WeekStrip days={week} />);
    expect(screen.getByLabelText('Trained Monday, Wednesday')).toBeOnTheScreen();
    await render(<WeekStrip days={week.map((d) => ({ ...d, done: false }))} />);
    expect(screen.getByLabelText('No workout yet this week')).toBeOnTheScreen();
  });
});
