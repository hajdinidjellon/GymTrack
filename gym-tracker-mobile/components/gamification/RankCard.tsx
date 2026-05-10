import React from 'react';
import { View, Text } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors } from '@/constants/theme';
import { RANKS, getProgressToNextRank, getNextRank } from '@/lib/gamification';
import type { Rank } from '@/types';

const RANK_ICONS: Record<string, string> = {
  shield: '🛡️',
  'shield-check': '✅',
  award: '🏆',
  star: '⭐',
  gem: '💎',
  crown: '👑',
};

interface RankCardProps {
  rank: Rank;
  totalXP: number;
  compact?: boolean;
}

export function RankCard({ rank, totalXP, compact = false }: RankCardProps) {
  const progress = getProgressToNextRank(totalXP);
  const nextRank = getNextRank(rank.tier, rank.level);

  if (compact) {
    return (
      <View className="flex-row items-center gap-3">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: `${rank.color}22` }}
        >
          <Text className="text-xl">{RANK_ICONS[rank.icon] ?? '🏅'}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold" style={{ color: rank.color }}>
            {rank.name}
          </Text>
          <ProgressBar
            progress={progress}
            color={rank.color}
            height={4}
            animated
          />
        </View>
        <Text className="text-sm font-semibold text-text-secondary">
          {totalXP.toLocaleString('fr-FR')} XP
        </Text>
      </View>
    );
  }

  return (
    <View
      className="rounded-2xl p-5 gap-4"
      style={{
        backgroundColor: `${rank.color}12`,
        borderWidth: 1,
        borderColor: `${rank.color}30`,
      }}
    >
      {/* En-tête rang */}
      <View className="flex-row items-center gap-4">
        <View
          className="w-16 h-16 rounded-2xl items-center justify-center"
          style={{ backgroundColor: `${rank.color}25` }}
        >
          <Text className="text-3xl">{RANK_ICONS[rank.icon] ?? '🏅'}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs font-medium text-text-muted uppercase tracking-widest">
            Rang actuel
          </Text>
          <Text
            className="text-2xl font-black"
            style={{ color: rank.color }}
          >
            {rank.name}
          </Text>
          <Text className="text-sm text-text-secondary italic">
            {rank.description}
          </Text>
        </View>
      </View>

      {/* XP total */}
      <View className="flex-row items-center justify-between">
        <Text className="text-text-muted text-sm">XP total</Text>
        <Text className="text-text-primary font-bold text-lg">
          {totalXP.toLocaleString('fr-FR')}
        </Text>
      </View>

      {/* Barre de progression vers le rang suivant */}
      <View className="gap-1.5">
        <View className="flex-row justify-between">
          <Text className="text-xs text-text-muted">
            Progression vers {nextRank?.name ?? 'max'}
          </Text>
          <Text className="text-xs font-semibold" style={{ color: rank.color }}>
            {progress}%
          </Text>
        </View>
        <ProgressBar
          progress={progress}
          color={rank.color}
          height={8}
          animated
        />
        {nextRank && (
          <Text className="text-xs text-text-muted text-right">
            {(nextRank.minXP - totalXP).toLocaleString('fr-FR')} XP restants
          </Text>
        )}
      </View>
    </View>
  );
}
