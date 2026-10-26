/**
 * DESIGN SYSTEM — « Autocollant » : clarté + style illustré
 * Fond papier, cartes blanches, contours et ombres dures à l'encre, sans flou.
 * Corail = l'action principale et ce qui est en cours (un seul bouton corail par écran).
 * Soleil = les explications, le repos, les badges. Vert = les séries faites.
 * Les couleurs des disques ne servent qu'aux disques.
 */

import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  /** App background. */
  paper: '#FFF6EC',
  /** Cards, inputs, secondary buttons. */
  card: '#FFFFFF',
  /** Main text, every outline and every shadow. */
  ink: '#1F1A17',
  inkMuted: '#6B5F57',
  /** Third level of text: labels, units. Only on 13 px and up. */
  inkFaint: '#8C8078',
  /** Dashed outlines of empty or upcoming things, separators. */
  line: '#D9CCBF',
  /** Behind bottom sheets. */
  scrim: 'rgba(31, 26, 23, 0.45)',
  /** Main action, current state. */
  coral: '#FF6B4A',
  /** Hero card and current set. */
  coralSoft: '#FFE0D4',
  /** Explanations, rest, badges. */
  sun: '#FFD23F',
  sunSoft: '#FFF1BF',
  /** Sets done. */
  success: '#5FD39A',
  successSoft: '#DDF5E7',
  successText: '#1D7348',
  /** Destructive actions only. */
  danger: '#C8372D',
  /** The steel of the bar. */
  steel: '#D2C5B6',
} as const;

/** IWF competition colours. Small change plates are steel. */
export const plateColors: Record<string, string> = {
  '25': '#E5484D',
  '20': '#3D7BF4',
  '15': '#FFD23F',
  '10': '#4CC38A',
  '5': '#FFFFFF',
  '2.5': '#E5484D',
  '1.25': '#C9CFD4',
};

export function plateColor(kg: number): string {
  return plateColors[String(kg)] ?? colors.steel;
}

/** Light plates get ink text, dark ones white. */
export function plateInk(kg: number): string {
  return ['25', '20', '2.5'].includes(String(kg)) ? colors.card : colors.ink;
}

/** Nunito for reading, Fredoka for titles, numbers and buttons. */
export const fonts = {
  regular: 'Nunito-Regular',
  semibold: 'Nunito-SemiBold',
  bold: 'Nunito-ExtraBold',
  titleMedium: 'Fredoka-SemiBold',
  black: 'Fredoka-Bold',
} as const;

/** Outlines: `strong` for cards and big buttons, `base` for the rest. */
export const border = {
  base: 2.5,
  strong: 3,
} as const;

export const radius = {
  sm: 12,
  input: 14,
  row: 16,
  md: 18,
  lg: 22,
  card: 22,
  pill: 999,
} as const;

/** Side gutter and the vertical rhythm, on a 4 pt grid. */
export const space = {
  gutter: 20,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Offset ink shadow, no blur: 5 for cards, 4 for big buttons, 2 for small things. */
export function hardShadow(offset: 2 | 4 | 5): Pick<ViewStyle, 'boxShadow'> {
  return { boxShadow: `${offset}px ${offset}px 0px ${colors.ink}` };
}

/** Ready-made text styles, for components that do not go through `Text`. */
export const text = {
  bodyStrong: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  bigNumber: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, fontVariant: ['tabular-nums'] },
  button: { fontFamily: fonts.titleMedium, fontSize: 18, color: colors.ink },
} satisfies Record<string, TextStyle>;

/** Reanimated springs: "snappy" for touch feedback, "soft" for things entering the screen. */
export const springs = {
  snappy: { damping: 18, stiffness: 300 },
  soft: { damping: 16, stiffness: 160 },
} as const;
