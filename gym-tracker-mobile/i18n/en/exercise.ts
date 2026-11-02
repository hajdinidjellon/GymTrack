import type { Dictionary } from '@/i18n/fr';

export const exercise: Dictionary['exercise'] = {
  notFound: 'Exercise not found.',
  ownEyebrow: '{equipment} · your exercise',
  nextTarget: 'Next target',
  toCalibrate: 'To set',
  lastTime: 'Last time: {last}',
  note: 'Your note',
  load: 'Your weight',
  loadRange: '{from} → {to} kg',
  strength: {
    title: 'Your records',
    e1rm: 'Estimated 1RM',
    kg: '{kg} kg',
    from: 'From {kg} kg × {reps} · {date}',
    perReps: 'Your best weight per number of reps',
    reps: { one: '{count} rep', other: '{count} reps' },
    recordA11y: '{reps}: {kg} kilos, {date}',
  },
  rule: 'Your sets and reps',
  plateLoaded: {
    label: 'Plate-loaded machine',
    on: 'The weight counts on each side.',
    off: 'The weight is read on the machine stack.',
  },
  warmups: {
    label: 'Warm-up sets',
    on: 'Computed before your sets, plates included. Not in your stats.',
    off: 'You go straight to your sets.',
  },
  increment: {
    title: 'Add at each step',
    a11y: '{kg} kilos per step',
    option: '+{kg} kg',
  },
  rest: {
    title: 'Your rest between sets',
    minus: 'Rest: minus {seconds} seconds',
    plus: 'Rest: plus {seconds} seconds',
    value: 'Rest: {rest}',
    defaultNote: 'Your default rest. If you usually rest longer or shorter, the timer will adapt.',
    auto: 'Let the app choose',
  },
  history: {
    title: 'Recent sessions',
    weight: '{kg} kg × ',
  },
};
