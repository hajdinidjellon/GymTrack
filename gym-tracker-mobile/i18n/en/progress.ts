import type { Dictionary } from '@/i18n/fr';

export const progress: Dictionary['progress'] = {
  title: 'Progress',
  subtitle: 'What you’ve gained since day one, in plates.',
  empty: {
    cta: "See today's workout",
    title: 'Your bar is still empty',
    text: 'Do your first workout: your charts, volume and PRs will show up here.',
  },
  tiles: {
    sessions: { one: 'workout', other: 'workouts' },
    gainedValue: '+{kg} kg',
    gained: 'gained in total',
    records: { one: 'PR', other: 'PRs' },
  },
  volume: {
    title: 'Weekly volume',
    thisWeek: 'kg this week',
  },
  hero: {
    title: 'Your best progress',
    since: '{name} · since {date}',
    gained: 'You’ve added {plates} per side.',
    start: 'At first',
    now: 'Now',
  },
  records: {
    title: 'Your PRs',
    meta: '{date} · {reps} reps',
  },
  lifts: {
    title: 'All your exercises',
    stable: 'steady',
    a11y: '{name}, {kg} kilos',
    a11yGain: '{name}, {kg} kilos, up {diff} since the start',
  },
  stats: {
    insights: {
      title: 'What the app knows about you',
      left: {
        one: '{count} more workout and I’ll tell you what I’ve learned: your time of day, your days, your rests, your strong point.',
        other:
          '{count} more workouts and I’ll tell you what I’ve learned: your time of day, your days, your rests, your strong point.',
      },
      soon: 'Keep it up: I’ll soon tell you what I’ve learned from your workouts.',
    },
    chart: {
      a11y: 'Weekly volume. {weeks}',
      week: 'week of {month}/{day}: {kg} kg',
      tons: '{tons} t',
      weeksAgo: { one: '{count} wk ago', other: '{count} wks ago' },
      thisWeek: 'this week',
    },
    week: {
      trained: 'Trained {days}',
      none: 'No workout yet this week',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    },
  },
};
