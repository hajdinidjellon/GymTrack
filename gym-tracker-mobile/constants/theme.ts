/**
 * DESIGN SYSTEM — « Disques », version noire
 * Fond noir, texte blanc cassé. La couleur vient des vrais disques de
 * compétition : un 20 kg est bleu partout dans l'app, un 25 rouge, etc.
 * En dehors des disques, trois couleurs seulement : le jaune pour ce qui
 * doit attirer l'œil (progrès, records, minuteur), le vert pour valider,
 * le rouge clair pour ce qui détruit.
 */

export const colors = {
  bg: '#0B0B0C',
  /** Behind bottom sheets. */
  scrim: '#050506',
  /** Cards. Lighter means closer: depth comes from the surface, not from shadows. */
  surface: '#161618',
  /** Raised or pressed elements inside a card. */
  surfaceHigh: '#232327',
  line: '#34343A',
  /** Card edges, barely there. */
  hairline: 'rgba(255, 255, 255, 0.07)',
  /** Main text and the primary button. */
  cream: '#F7F5F0',
  muted: '#B1B1B7',
  /** Third level of text: labels, units. Only on 12 px and up. */
  faint: '#8A8A92',
  /** The steel of the bar. */
  steel: '#A2A7AB',
  /** Progress, records, the rest timer, today. */
  accent: '#F2C230',
  accentSoft: 'rgba(242, 194, 48, 0.15)',
  /** "Valider" and what went well. */
  go: '#23C16B',
  goSoft: 'rgba(35, 193, 107, 0.15)',
  onGo: '#04130A',
  /** Days trained. */
  done: '#2E6BE6',
  /** Destructive actions only. */
  danger: '#FF8A7A',
} as const;

/** IWF competition colours. Small change plates are steel. */
export const plateColors: Record<string, string> = {
  '25': '#D93B3B',
  '20': '#2E6BE6',
  '15': '#F2C230',
  '10': '#23A65A',
  '5': '#F2F2F0',
  '2.5': '#D93B3B',
  '1.25': '#B9C0C4',
};

export function plateColor(kg: number): string {
  return plateColors[String(kg)] ?? colors.steel;
}

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
