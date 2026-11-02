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
  /** Main text. */
  ink: string;
  inkMuted: string;
  /** Third level of text: labels, units. Only on 13 px and up. */
  inkFaint: string;
  /** Sticker outlines: the ink in light mode, a slate line at night. */
  outline: string;
  /** Outline of what is selected, pressed or current: it must stand out from `line`. */
  outlineStrong: string;
  /** Dashed outlines of empty or upcoming things, separators. */
  line: string;
  /** Behind bottom sheets. */
  scrim: string;
  /** The hard shadow of the stickers. */
  shadow: string;
  /** Main action, current state. */
  coral: string;
  /** Text and icons on `coral`. */
  onCoral: string;
  /** The shadow under the main button. */
  coralShadow: string;
  /** Hero card and current set. */
  coralSoft: string;
  /** Badges and small marks. */
  sun: string;
  /** Text on `sun`. */
  onSun: string;
  /** Explanation and rest panels: big areas. */
  sunPanel: string;
  /** Text on `sunPanel`. */
  onSunPanel: string;
  sunSoft: string;
  /** Sets done. */
  success: string;
  /** Icons on `success`. */
  onSuccess: string;
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
  outline: '#1F1A17',
  outlineStrong: '#1F1A17',
  line: '#D9CCBF',
  scrim: 'rgba(31, 26, 23, 0.45)',
  shadow: '#1F1A17',
  coral: '#FF6B4A',
  onCoral: '#1F1A17',
  coralShadow: '#1F1A17',
  coralSoft: '#FFE0D4',
  sun: '#FFD23F',
  onSun: '#1F1A17',
  sunPanel: '#FFD23F',
  onSunPanel: '#1F1A17',
  sunSoft: '#FFF1BF',
  success: '#5FD39A',
  onSuccess: '#1F1A17',
  successSoft: '#DDF5E7',
  successText: '#1D7348',
  danger: '#C8372D',
  steel: '#D2C5B6',
};

/**
 * « Ardoise menthe », the night version: a cold slate background (warm
 * colours go muddy on brown or warm black), no big coloured areas, colour
 * only on the button, the pills and the text. The main action turns mint and
 * sets done turn sky blue: no orange at night. Stickers keep their relief as a
 * ledge under each card, like Duolingo's dark mode.
 */
export const darkPalette: Palette = {
  paper: '#131F24',
  card: '#202F36',
  ink: '#F1F7FB',
  inkMuted: '#A3B3BB',
  inkFaint: '#8C9EA7',
  outline: '#37464F',
  outlineStrong: '#8FA3AD',
  line: '#37464F',
  scrim: 'rgba(0, 0, 0, 0.6)',
  shadow: '#37464F',
  coral: '#6FDCA6',
  onCoral: '#10241B',
  coralShadow: '#3E9E6E',
  coralSoft: '#2A3A42',
  sun: '#FFD23F',
  onSun: '#1F1A17',
  sunPanel: '#26363E',
  onSunPanel: '#FFD23F',
  sunSoft: '#2A3A42',
  success: '#5BC8F5',
  onSuccess: '#0B2230',
  successSoft: '#183447',
  successText: '#8FD8F8',
  danger: '#FF7B70',
  steel: '#52656D',
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
export function hardShadow(offset: 2 | 4 | 5, color: string = colors.shadow): Pick<ViewStyle, 'boxShadow'> {
  // At night the sticker sits on a ledge right under it, like a pressed key
  if (scheme === 'dark') return { boxShadow: `0px ${Math.min(offset, 4)}px 0px ${color}` };
  return { boxShadow: `${offset}px ${offset}px 0px ${color}` };
}

/** How far a pressed sticker sinks onto its shadow: diagonally by day, straight down at night. */
export function pressOffset(offset: number): { translateX: number; translateY: number } {
  return scheme === 'dark'
    ? { translateX: 0, translateY: Math.min(offset, 4) }
    : { translateX: offset, translateY: offset };
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
