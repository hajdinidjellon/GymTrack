// ============================================================
// DESIGN SYSTEM — GymTrack Mobile
// Style : Strong App + Whoop + Linear.app — premium dark
// ============================================================

import type { RankTier } from '@/types';

export const colors = {
  bg: {
    primary: '#080810',
    secondary: '#0f0f1a',
    card: 'rgba(255,255,255,0.04)',
    cardBorder: 'rgba(255,255,255,0.08)',
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  brand: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  }),
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
