import type { Dictionary } from '@/i18n/fr';

export const privacy: Dictionary['privacy'] = {
  title: 'Privacy',
  subtitle: 'What the app keeps about you, where, and how to erase it all.',
  updated: 'Updated: November 10, 2026',
  sections: {
    who: {
      title: 'Who looks after it',
      body: 'Okilo is published by Djellon Hajdini, in France, who is responsible for your data. For any question or request: hajdinidjellon@gmail.com.',
    },
    local: {
      title: 'No account, nothing leaves',
      body: 'Without an account, your sessions, your program and your settings stay on your phone. Nothing is sent to a server.',
    },
    collected: {
      title: 'With an account',
      body: 'To find your data again on another phone, the app sends it to your account:\n• your username and password (never stored in clear);\n• your recovery email, if you give one;\n• your recovery code, kept in a form that cannot be read back;\n• your profile: goal, experience, rhythm, program, session time, gym, and if you give them, your sex, age group and body weight;\n• your sessions (exercises, weights, reps, how it felt, dates, durations) and your settings.\nWhen you ask for a recovery, a code or a deletion, the server also notes your IP address and the time, to block abuse. These traces are erased after 24 hours.',
    },
    why: {
      title: 'Why',
      body: 'Only to make the app work: compute your weights, keep your history, sync your phones and help you get your account back. No ads, no usage analytics, no trackers, never sold. Legal basis: providing the service you ask for by creating an account.',
    },
    health: {
      title: 'Body weight and sessions',
      body: 'Your body weight and your sessions can say a little about your health. You enter them yourself, they are optional (except sessions, the heart of the app) and only used to compute your weights. By creating an account, you agree to them being kept there. You withdraw this consent at any time by deleting your account.',
    },
    device: {
      title: 'On your phone only',
      body: 'Microphone: if you turn on voice commands, your voice is recognised by your phone itself. Nothing is recorded or sent. Notifications: rest reminders are scheduled on your phone.',
    },
    processors: {
      title: 'Who hosts it',
      body: '• Supabase (hosting of the account and the data), servers in the European Union.\n• Resend (sending recovery emails), in the United States: it only receives your recovery email and the message. This transfer is covered by the Data Privacy Framework and the European Commission’s standard contractual clauses.\nNo one else receives your data.',
    },
    keep: {
      title: 'How long',
      body: 'As long as your account exists. A session you delete is erased from the account. When you delete your account, everything is erased from the server right away.',
    },
    rights: {
      title: 'Your rights',
      body: 'You can access your data, correct it, export it, object to its use or erase it.\n• Export: Profile → Backup, import.\n• Erase everything: Profile → Email and recovery code → Delete my account.\n• For anything else, write to hajdinidjellon@gmail.com: answer within a month.\nYou can also complain to your data protection authority (in France, the CNIL: cnil.fr).',
    },
    age: {
      title: 'Age',
      body: 'Okilo is meant for people aged 15 and over.',
    },
  },
  link: 'Privacy',
  linkValue: 'Your data, your rights',
  linkHint: 'What the app keeps about you, where, and how to erase it all.',
};
