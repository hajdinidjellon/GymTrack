import type { Dictionary } from '@/i18n/fr';

export const data: Dictionary['data'] = {
  title: 'Your data',
  subtitle: 'Everything stays on your phone. Here you keep a copy, or bring your sessions over from another app.',
  failTitle: 'That didn’t work',
  failText: 'The file could not be opened. Try again.',

  backup: {
    title: 'Backup',
    text: 'One file with everything: sessions, program, settings. Keep it in Files or email it to yourself.',
    create: 'Create a backup',
    restore: 'Restore a backup',
    shareTitle: 'GymTrack · backup',
    confirmTitle: 'Restore this backup?',
    confirmText: {
      one: '{count} session inside. Your program and settings will be replaced by the file’s. Your current sessions stay.',
      other:
        '{count} sessions inside. Your program and settings will be replaced by the file’s. Your current sessions stay.',
    },
    confirm: 'Restore',
    doneTitle: 'Backup restored',
    added: { one: '{count} session added to your history.', other: '{count} sessions added to your history.' },
    rejected: { one: '{count} unreadable session was left out.', other: '{count} unreadable sessions were left out.' },
    notBackup: 'This file is not a GymTrack backup.',
    newerVersion: 'This backup comes from a newer version of GymTrack. Update the app, then try again.',
  },

  import: {
    title: 'Coming from Strong or Hevy',
    text: 'In Strong or Hevy, export your data as CSV (in the settings), then pick the file here. Progression picks up from your last weights.',
    button: 'Import a CSV file',
    doneTitle: 'Import done',
    added: { one: '{count} session added from {source}.', other: '{count} sessions added from {source}.' },
    nothingNew: 'These sessions are already in your history.',
    recognized: {
      one: '{count} exercise recognized: progression picks it up.',
      other: '{count} exercises recognized: progression picks them up.',
    },
    unknown: {
      one: '{count} exercise kept under its own name, in your history.',
      other: '{count} exercises kept under their own name, in your history.',
    },
    skipped: {
      one: '{count} line without reps skipped (cardio, holds…).',
      other: '{count} lines without reps skipped (cardio, holds…).',
    },
    strongKilos: 'Strong doesn’t say the unit: weights are read as kilos.',
    errorTitle: 'Import failed',
    empty: 'This file is empty.',
    unknownFormat: 'This file doesn’t look like a Strong or Hevy export.',
    noSets: 'No set with reps in this file.',
  },

  csv: {
    title: 'Spreadsheet',
    text: 'Every set in a CSV file, for Excel or Numbers.',
    button: 'Export as CSV',
    shareTitle: 'GymTrack · my sessions',
    emptyTitle: 'Nothing to export',
    emptyText: 'Do your first session: it will show up in the file.',
  },
};
