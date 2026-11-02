import type { Dictionary } from '@/i18n/fr';

export const history: Dictionary['history'] = {
  title: 'History',
  subtitle: 'Everything you did, workout by workout.',
  empty: 'No workout yet. Your first one will show up here.',
  rowA11y: '{name}, {date}, {sets}, {kg} kilos lifted',
  detail: {
    minutes: '{n} min',
    lifted: '{kg} kg lifted',
    record: 'Record · {name} {kg} kg',
    warmup: 'warm-up',
    exerciseA11y: 'See {name}',
    all: 'Full history',
    notFound: 'This workout no longer exists.',
  },
  homeLink: 'History',
  homeA11y: 'See the {name} workout of {date}',
};
