/**
 * DESIGN SYSTEM — « Autocollant » : clarté + style illustré
 * Fond papier, cartes blanches, contours et ombres dures à l'encre, sans flou.
 * Corail = l'action principale et ce qui est en cours (un seul bouton corail par écran).
 * Soleil = les explications, le repos, les badges. Vert = les séries faites.
 * Les couleurs des disques ne servent qu'aux disques.
 */

import type { TextStyle, ViewStyle } from 'react-native';

export interface Palette {
  /** App background. */
  paper: string;
  /** Cards, inputs, secondary buttons. */
  card: string;
  /** Main text and every outline. */
  ink: string;
  inkMuted: string;
  /** Third level of text: labels, units. Only on 13 px and up. */
  inkFaint: string;
  /** Dashed outlines of empty or upcoming things, separators. */
  line: string;
  /** Behind bottom sheets. */
  scrim: string;
  /** The hard offset shadow of the stickers. */
  shadow: string;
  /** Main action, current state. */
  coral: string;
  /** Hero card and current set. */
  coralSoft: string;
  /** Explanations, rest, badges. */
  sun: string;
  sunSoft: string;
  /** Sets done. */
  success: string;
  successSoft: string;
  successText: string;
  /** Destructive actions only. */
  danger: string;
  /** The steel of the bar. */
  steel: string;
}

export const lightPalette: Palette = {
  paper: '#FFF6EC',
  card: '#FFFFFF',
  ink: '#1F1A17',
  inkMuted: '#6B5F57',
  inkFaint: '#8C8078',
  line: '#D9CCBF',
  scrim: 'rgba(31, 26, 23, 0.45)',
  shadow: '#1F1A17',
  coral: '#FF6B4A',
  coralSoft: '#FFE0D4',
  sun: '#FFD23F',
  sunSoft: '#FFF1BF',
  success: '#5FD39A',
  successSoft: '#DDF5E7',
  successText: '#1D7348',
  danger: '#C8372D',
  steel: '#D2C5B6',
};

/**
 * The same stickers at night: warm dark paper, cream ink, black shadows.
 * Coral, sun and green are deeper so the cream text on them stays readable.
 */
export const darkPalette: Palette = {
  paper: '#17130F',
  card: '#241E19',
  ink: '#F3EADF',
  inkMuted: '#B9AC9F',
  inkFaint: '#9A8D80',
  line: '#4A4038',
  scrim: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
  coral: '#D9472C',
  coralSoft: '#4A2620',
  sun: '#7A5F10',
  sunSoft: '#3A3010',
  success: '#2F8F62',
  successSoft: '#1E3A2C',
  successText: '#7FE0AE',
  danger: '#FF6B5E',
  steel: '#8F8579',
};

export type ColorScheme = 'light' | 'dark';

let scheme: ColorScheme = 'light';

/** Light or dark for every `colors.x` read from now on. The screens re-render through useLocale(). */
export function setColorScheme(next: ColorScheme): void {
  scheme = next;
}

export function getColorScheme(): ColorScheme {
  return scheme;
}

/** The colors of the current scheme. Read at render time, never stored in a constant. */
export const colors: Readonly<Palette> = Object.fromEntries(
  (Object.keys(lightPalette) as (keyof Palette)[]).map((key) => [key, undefined]),
) as unknown as Palette;
for (const key of Object.keys(lightPalette) as (keyof Palette)[]) {
  Object.defineProperty(colors, key, {
    get: () => (scheme === 'dark' ? darkPalette : lightPalette)[key],
    enumerable: true,
  });
}

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

/** Light plates get dark text, dark ones white: the plates keep their colours at night too. */
export function plateInk(kg: number): string {
  return ['25', '20', '2.5'].includes(String(kg)) ? '#FFFFFF' : lightPalette.ink;
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
  return { boxShadow: `${offset}px ${offset}px 0px ${colors.shadow}` };
}

/** Ready-made text styles, for components that do not go through `Text`. */
export const text = {
  get bodyStrong(): TextStyle {
    return { fontFamily: fonts.bold, fontSize: 15, color: colors.ink };
  },
  get bigNumber(): TextStyle {
    return { fontFamily: fonts.black, fontSize: 26, color: colors.ink, fontVariant: ['tabular-nums'] };
  },
  get button(): TextStyle {
    return { fontFamily: fonts.titleMedium, fontSize: 18, color: colors.ink };
  },
};

/** Reanimated springs: "snappy" for touch feedback, "soft" for things entering the screen. */
export const springs = {
  snappy: { damping: 18, stiffness: 300 },
  soft: { damping: 16, stiffness: 160 },
} as const;
