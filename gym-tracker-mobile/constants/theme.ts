// ============================================================
// DESIGN SYSTEM — GymTrack Mobile
// Style : Strong App + Whoop + Linear.app — premium dark
// ============================================================

import type { RankTier } from '@/types';

export const colors = {
  bg: {
    primary: '#080810',
    secondary: '#0f0f1a',
    card: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(255,255,255,0.10)',
    overlay: 'rgba(0,0,0,0.75)',
  },
  brand: {
    primary: '#7c3aed',
    secondary: '#06b6d4',
    gradient: ['#7c3aed', '#06b6d4'] as [string, string],
    primaryDim: 'rgba(124,58,237,0.15)',
    secondaryDim: 'rgba(6,182,212,0.15)',
  },
  status: {
    success: '#10b981',
    successDim: 'rgba(16,185,129,0.15)',
    danger: '#ef4444',
    dangerDim: 'rgba(239,68,68,0.15)',
    warning: '#f59e0b',
    warningDim: 'rgba(245,158,11,0.15)',
    info: '#3b82f6',
    infoDim: 'rgba(59,130,246,0.15)',
  },
  text: {
    primary: '#f8fafc',
    secondary: 'rgba(248,250,252,0.55)',
    muted: 'rgba(248,250,252,0.3)',
    inverse: '#080810',
  },
  muscle: {
    none: 'rgba(255,255,255,0.06)',
    low: 'rgba(147,197,253,0.6)',
    medium: 'rgba(251,191,36,0.75)',
    high: 'rgba(249,115,22,0.85)',
    max: 'rgba(239,68,68,0.95)',
  },
  rank: {
    bronze: '#B45309',
    silver: '#9CA3AF',
    gold: '#D97706',
    platinum: '#0891B2',
    diamond: '#7C3AED',
    legend: '#DC2626',
  } satisfies Record<RankTier, string>,
  setType: {
    warmup: '#3b82f6',
    normal: '#f8fafc',
    top: '#f59e0b',
    backoff: '#06b6d4',
    amrap: '#10b981',
    drop: '#ec4899',
    failure: '#ef4444',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
} as const;

export const typography = {
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
    '4xl': 42,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  brand: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  }),
} as const;

export const gradients = {
  brand: ['#7c3aed', '#06b6d4'] as [string, string],
  brandReverse: ['#06b6d4', '#7c3aed'] as [string, string],
  brandSubtle: ['rgba(124,58,237,0.8)', 'rgba(6,182,212,0.8)'] as [string, string],
  bronze: ['#B45309', '#D97706'] as [string, string],
  silver: ['#6B7280', '#9CA3AF'] as [string, string],
  gold: ['#D97706', '#F59E0B'] as [string, string],
  platinum: ['#0891B2', '#06B6D4'] as [string, string],
  diamond: ['#7C3AED', '#A78BFA'] as [string, string],
  legend: ['#DC2626', '#F87171'] as [string, string],
  success: ['#059669', '#10b981'] as [string, string],
  dark: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] as [string, string],
} as const;

export function getRankGradient(tier: string): [string, string] {
  return (gradients as Record<string, [string, string]>)[tier] ?? gradients.brand;
}

// ============================================================
// HUD TOKENS — palette sci-fi alignée sur Home + Home Séance.
// Utilisée par SessionDashboard, ExerciseCard, PremiumFrame, etc.
// Ne JAMAIS hardcoder de hex sur ces écrans — toujours passer par hud.*.
// ============================================================
export const hud = {
  bg: {
    app:         '#050B16', // fond global (HUD_BG pre-séance)
    surface:     '#0A1424', // carte neutre (BG Home)
    surfaceElev: '#0A1E3A', // carte active / élévation
    surfaceDeep: '#020810', // zone interne la plus sombre
    scrim:       'rgba(0,0,0,0.85)',
  },
  border: {
    subtle:   'rgba(93,222,255,0.20)',
    active:   '#1DC4FF',
    hairline: 'rgba(93,222,255,0.10)',
    neutral:  'rgba(255,255,255,0.09)',
  },
  cyan: {
    primary: '#1DC4FF', // HUD_CYAN
    bright:  '#5DD8FF', // HUD_CYAN_HI
    soft:    '#17B8FF', // CYAN Home (fallback)
    deep:    '#061840', // bas de gradient bouton bevel
  },
  glow: {
    cyan:      'rgba(29,196,255,0.30)',
    cyanSoft:  'rgba(0,200,255,0.10)',
    cyanFaint: 'rgba(0,200,255,0.035)',
  },
  text: {
    primary:   '#FFFFFF',
    secondary: 'rgba(255,255,255,0.55)',
    muted:     'rgba(255,255,255,0.40)',
    faint:     'rgba(255,255,255,0.30)',
    onLight:   '#0A0A0A',
  },
  gradient: {
    bevelBtn: ['#2196F3', '#1050C0', '#061840'] as [string, string, string],
  },
  // ── Accents sémantiques ────────────────────────────────────────
  // volt est RÉSERVÉ aux PR/records — jamais pour autre chose.
  accent: {
    volt:      '#C8FF1D', // PR / record battu
    voltDim:   'rgba(200,255,29,0.15)',
    ember:     '#FF7A1A', // streak / feu
    emberDim:  'rgba(255,122,26,0.15)',
    pulse:     '#FF3D6E', // effort max : AMRAP, failure, RPE >= 9
    pulseDim:  'rgba(255,61,110,0.15)',
    regen:     '#2BE8A0', // récupération, validation, succès
    regenDim:  'rgba(43,232,160,0.15)',
    warn:      '#FFB020', // avertissements doux
    warnDim:   'rgba(255,176,32,0.15)',
  },
  // ── Échelle de biseau (chamfer) ────────────────────────────────
  cut: {
    sm: 6,   // pills, mini-cartes, inputs
    md: 12,  // cartes standard, boutons
    lg: 20,  // cartes héros (+ encoches + ticks de coin)
  },
  // ── Niveaux d'élévation par glow (G0 → G3) ─────────────────────
  // L'élévation est lumineuse, jamais une ombre noire.
  glowLevel: {
    g0: { border: 'rgba(93,222,255,0.10)', borderWidth: 1,   blur: 0,  glowColor: 'transparent',            glowOpacity: 0 },
    g1: { border: 'rgba(93,222,255,0.20)', borderWidth: 1,   blur: 8,  glowColor: 'rgba(0,200,255,0.035)',  glowOpacity: 1 },
    g2: { border: '#1DC4FF',               borderWidth: 1.5, blur: 16, glowColor: 'rgba(29,196,255,0.30)',  glowOpacity: 1 },
    g3: { border: '#1DC4FF',               borderWidth: 1.5, blur: 32, glowColor: 'rgba(29,196,255,0.30)',  glowOpacity: 1 }, // + pulse 0.15→0.35 (2.8s) côté composant
  },
} as const;

export type HudGlowLevel = keyof typeof hud.glowLevel;

// ── Rangs : duo bord/cœur pour dégradés Skia + glow du tier ──────
export const rankPalette = {
  bronze:   { edge: '#8C5A2B', core: '#E0A45C', glow: 'rgba(224,164,92,0.35)' },
  silver:   { edge: '#7E8CA0', core: '#D9E4F2', glow: 'rgba(217,228,242,0.40)' },
  gold:     { edge: '#B8860B', core: '#FFD75E', glow: 'rgba(255,215,94,0.45)' },
  platinum: { edge: '#0E7490', core: '#67E8F9', glow: 'rgba(103,232,249,0.50)' },
  diamond:  { edge: '#6D28D9', core: '#C4B5FD', glow: 'rgba(196,181,253,0.55)' },
  legend:   { edge: '#B91C1C', core: '#FF6B6B', glow: 'rgba(255,107,107,0.60)' }, // seul tier à glow animé en continu
} satisfies Record<RankTier, { edge: string; core: string; glow: string }>;

// ── Raretés de badge ──────────────────────────────────────────────
export const rarityPalette = {
  common:    { color: '#9CA3AF', glow: 'transparent',             animated: false },
  rare:      { color: '#1DC4FF', glow: 'rgba(29,196,255,0.30)',   animated: false },
  epic:      { color: '#A855F7', glow: 'rgba(168,85,247,0.35)',   animated: false },
  legendary: { color: '#FFD75E', glow: 'rgba(255,215,94,0.45)',   animated: true }, // pulse 2.4s
} as const;

// ── Échelle de durées motion (voir DESIGN-GYMTRACK.md §A.7) ──────
export const motion = {
  instant: 90,    // feedback tap
  quick: 180,     // états, toggles
  move: 320,      // entrées de cartes, navigation
  dramatic: 600,  // célébrations uniquement
  stagger: 50,    // cascade power-on
  easing: [0.2, 0.8, 0.2, 1] as const, // standard cubic-bezier
  spring: { damping: 18, stiffness: 220, mass: 0.8 },
  springCelebration: { damping: 12, stiffness: 180, mass: 0.9 }, // overshoot autorisé
} as const;

// ── Presets typographiques HUD (voir DESIGN-GYMTRACK.md §A.3) ────
// Toute valeur qui change (timer, compteur) DOIT utiliser tabular-nums.
export const hudType = {
  displayHero: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 64,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    color: hud.text.primary,
  },
  displayTitle: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 34,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    color: hud.text.primary,
  },
  displayStat: {
    fontFamily: 'Rajdhani-SemiBold',
    fontSize: 28,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    color: hud.text.primary,
  },
  labelHud: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
    color: hud.text.secondary,
  },
  labelValue: {
    fontFamily: 'Rajdhani-SemiBold',
    fontSize: 17,
    letterSpacing: 0.5,
    color: hud.text.primary,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: hud.text.secondary,
  },
  bodyDim: {
    fontSize: 13,
    lineHeight: 18,
    color: hud.text.muted,
  },
  button: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: hud.text.primary,
  },
} as const;

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 18,
    stiffness: 220,
    mass: 0.8,
  },
} as const;

// Muscle → couleur de badge sur la heatmap (0-100%)
export function getMuscleHeatColor(intensity: number): string {
  if (intensity === 0) return colors.muscle.none;
  if (intensity < 25) return colors.muscle.low;
  if (intensity < 60) return colors.muscle.medium;
  if (intensity < 85) return colors.muscle.high;
  return colors.muscle.max;
}

// Rank → couleur du rang
export function getRankColor(tier: RankTier): string {
  return colors.rank[tier];
}
