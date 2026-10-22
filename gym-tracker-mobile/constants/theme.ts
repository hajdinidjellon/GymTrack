/**
 * DESIGN SYSTEM — « Disques »
 * Vert sapin et crème, comme la fonte et les disques. Une seule couleur
 * d'accent, le laiton des manchons de barre : elle ne sert qu'à ce qui
 * doit attirer l'œil (progrès, records, minuteur, série de semaines).
 */

export const colors = {
  bg: '#0E3B2E',
  /** Behind bottom sheets. */
  scrim: '#072219',
  /** Cards. Lighter means closer: depth comes from the surface, not from shadows. */
  surface: '#15493A',
  /** Raised or pressed elements inside a card. */
  surfaceHigh: '#1D5746',
  line: '#2E6B58',
  /** Card edges, barely there. */
  hairline: 'rgba(241, 234, 216, 0.08)',
  cream: '#F1EAD8',
  muted: '#B9C7B8',
  /** Third level of text: labels, units. Only on 13 px and up. */
  faint: '#8DA597',
  /** The steel of the bar. */
  steel: '#8FA89C',
  /** The accent: brass sleeves. Progress, records, the rest timer. */
  brass: '#E6B85C',
  brassSoft: 'rgba(230, 184, 92, 0.16)',
  /** Destructive actions only. */
  danger: '#F2937F',
} as const;

export const fonts = {
  regular: 'Bricolage-Regular',
  semibold: 'Bricolage-SemiBold',
  bold: 'Bricolage-Bold',
  black: 'Bricolage-ExtraBold',
} as const;

/** Type scale. Big numbers in the logger go above it on purpose. */
export const type = {
  display: 34,
  title: 26,
  headline: 20,
  body: 17,
  callout: 15,
  caption: 13,
} as const;

export const radius = {
  sm: 14,
  md: 20,
  lg: 24,
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

/** Reanimated springs: "snappy" for touch feedback, "soft" for things entering the screen. */
export const springs = {
  snappy: { damping: 18, stiffness: 300 },
  soft: { damping: 16, stiffness: 160 },
} as const;
