/**
 * DESIGN SYSTEM — « Disques »
 * Un seul vert sapin, une seule crème. La couleur vient de la matière
 * (fonte, disques), pas d'une palette d'accents.
 */

export const colors = {
  bg: '#0E3B2E',
  /** Behind bottom sheets. */
  scrim: '#082A20',
  surface: '#15493A',
  line: '#2E6B58',
  cream: '#F1EAD8',
  muted: '#B9C7B8',
  /** The steel of the bar. */
  steel: '#8FA89C',
} as const;

export const fonts = {
  regular: 'Bricolage-Regular',
  semibold: 'Bricolage-SemiBold',
  bold: 'Bricolage-Bold',
  black: 'Bricolage-ExtraBold',
} as const;

export const radius = {
  sm: 18,
  md: 24,
  lg: 30,
  pill: 999,
} as const;

/** Side gutter and the vertical rhythm, on a 4 pt grid. */
export const space = {
  gutter: 24,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
