import React from 'react';
import { View, Text } from 'react-native';
import type { BadgeRarity, SetType } from '@/types';
import { colors } from '@/constants/theme';

// ── Chip générique (labels, tags) ──────────────────────────

type ChipVariant = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'brand';

const CHIP_CLASSES: Record<ChipVariant, { bg: string; text: string }> = {
  default: { bg: 'bg-white/10', text: 'text-text-secondary' },
  success: { bg: 'bg-status-success/20', text: 'text-status-success' },
  danger: { bg: 'bg-status-danger/20', text: 'text-status-danger' },
  warning: { bg: 'bg-status-warning/20', text: 'text-status-warning' },
  info: { bg: 'bg-status-info/20', text: 'text-status-info' },
  brand: { bg: 'bg-brand-primary/20', text: 'text-brand-primary' },
};

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  size?: 'sm' | 'md';
}

export function Chip({ label, variant = 'default', size = 'md' }: ChipProps) {
  const cls = CHIP_CLASSES[variant];
  return (
    <View
      className={`${cls.bg} rounded-full ${size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'}`}
    >
      <Text
        className={`${cls.text} font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Badge de rareté (gamification) ─────────────────────────

const RARITY_CONFIG: Record<
  BadgeRarity,
  { bg: string; border: string; text: string; label: string }
> = {
  common: {
    bg: 'rgba(107,114,128,0.2)',
    border: 'rgba(107,114,128,0.4)',
    text: '#9CA3AF',
    label: 'Commun',
  },
  rare: {
    bg: 'rgba(59,130,246,0.2)',
    border: 'rgba(59,130,246,0.4)',
    text: '#60A5FA',
    label: 'Rare',
  },
  epic: {
    bg: 'rgba(124,58,237,0.2)',
    border: 'rgba(124,58,237,0.4)',
    text: '#A78BFA',
    label: 'Épique',
  },
  legendary: {
    bg: 'rgba(245,158,11,0.2)',
    border: 'rgba(245,158,11,0.4)',
    text: '#FCD34D',
    label: 'Légendaire',
  },
};

interface RarityBadgeProps {
  rarity: BadgeRarity;
  size?: 'sm' | 'md';
}

export function RarityBadge({ rarity, size = 'sm' }: RarityBadgeProps) {
  const cfg = RARITY_CONFIG[rarity];
  return (
    <View
      style={{
        backgroundColor: cfg.bg,
        borderWidth: 1,
        borderColor: cfg.border,
        paddingHorizontal: size === 'sm' ? 6 : 10,
        paddingVertical: size === 'sm' ? 2 : 4,
        borderRadius: 6,
      }}
    >
      <Text
        style={{
          color: cfg.text,
          fontSize: size === 'sm' ? 10 : 12,
          fontWeight: '600',
        }}
      >
        {cfg.label}
      </Text>
    </View>
  );
}

// ── Badge type de série (warmup/normal/top/…) ───────────────

const SET_TYPE_LABELS: Record<SetType, string> = {
  warmup: 'Échauffement',
  normal: 'Normale',
  top: 'Top Set',
  backoff: 'Backoff',
  amrap: 'AMRAP',
  drop: 'Drop Set',
  failure: 'Échec',
};

interface SetTypeBadgeProps {
  setType: SetType;
}

export function SetTypeBadge({ setType }: SetTypeBadgeProps) {
  const color = colors.setType[setType];
  return (
    <View
      style={{
        backgroundColor: `${color}22`,
        borderWidth: 1,
        borderColor: `${color}55`,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
      }}
    >
      <Text style={{ color, fontSize: 10, fontWeight: '600' }}>
        {SET_TYPE_LABELS[setType]}
      </Text>
    </View>
  );
}
