import type { Dictionary } from '@/i18n/fr';

export const history: Dictionary['history'] = {
  title: 'History',
  subtitle: 'Everything you did, workout by workout.',
  empty: 'No workout yet. Your first one will show up here.',
  rowA11y: '{name}, {date}, {sets}, {kg} kilos lifted',
  timeline: {
    start: 'Start',
    end: 'End',
    total: 'Duration',
    a11y: 'From {start} to {end}, {total}',
  },
  detail: {
    lifted: '{kg} kg lifted',
    record: 'Record · {name} {kg} kg',
    warmup: 'warm-up',
    drop: 'drop',
    failure: 'failure',
    exerciseA11y: 'See {name}',
    all: 'Full history',
    notFound: 'This workout no longer exists.',
  },
  homeLink: 'History',
  homeA11y: 'See the {name} workout of {date}',
};
