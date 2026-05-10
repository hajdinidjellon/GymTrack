import React from 'react';
import { View, Text } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getRankByXP, getProgressToNextRank } from '@/lib/gamification';

interface XPBarProps {
  totalXP: number;
  showLabel?: boolean;
}

export function XPBar({ totalXP, showLabel = true }: XPBarProps) {
  const rank = getRankByXP(totalXP);
  const progress = getProgressToNextRank(totalXP);

  return (
    <View className="gap-1.5">
      {showLabel && (
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-semibold" style={{ color: rank.color }}>
            {rank.name}
          </Text>
          <Text className="text-xs text-text-muted">
            {totalXP.toLocaleString('fr-FR')} XP
          </Text>
        </View>
      )}
      <ProgressBar
        progress={progress}
        color={rank.color}
        height={6}
        animated
      />
    </View>
  );
}
