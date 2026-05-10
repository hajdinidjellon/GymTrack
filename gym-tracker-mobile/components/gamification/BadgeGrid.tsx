import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { RarityBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BADGES } from '@/lib/gamification';
import type { GamificationData, UnlockedBadge, BadgeCategory } from '@/types';

const BADGE_ICONS: Record<string, string> = {
  dumbbell: '🏋️', flame: '🔥', zap: '⚡', trophy: '🏆', crown: '👑',
  calendar: '📅', 'trending-up': '📈', 'shield-check': '✅', star: '⭐',
  medal: '🥇', 'bar-chart-2': '📊', activity: '💪', 'chevron-down': '🦵',
  'arrow-up': '⬆️', award: '🎖️',
};

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  consistency: 'Régularité',
  strength: 'Force',
  volume: 'Volume',
  diversity: 'Diversité',
  milestone: 'Jalons',
  special: 'Spécial',
};

interface BadgeGridProps {
  gamificationData: GamificationData;
  showLocked?: boolean;
}

export function BadgeGrid({ gamificationData, showLocked = true }: BadgeGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  const categories: Array<BadgeCategory | 'all'> = [
    'all', 'milestone', 'consistency', 'strength', 'volume', 'diversity', 'special',
  ];

  const filteredBadges = BADGES.filter((b) =>
    selectedCategory === 'all' ? true : b.category === selectedCategory,
  );

  const unlockedIds = new Set(
    BADGES.filter((b) => b.condition(gamificationData)).map((b) => b.id),
  );

  const selectedBadgeData = selectedBadge
    ? BADGES.find((b) => b.id === selectedBadge)
    : null;

  const isUnlocked = selectedBadge ? unlockedIds.has(selectedBadge) : false;
  const badgeProgress = selectedBadgeData?.progress
    ? selectedBadgeData.progress(gamificationData)
    : 0;

  return (
    <View className="gap-4">
      {/* Filtre par catégorie */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        {categories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full ${selectedCategory === cat ? 'bg-brand-primary' : 'bg-white/[0.08]'}`}
          >
            <Text
              className={`text-sm font-medium ${selectedCategory === cat ? 'text-white' : 'text-text-secondary'}`}
            >
              {cat === 'all' ? 'Tous' : CATEGORY_LABELS[cat]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Grille */}
      <View className="flex-row flex-wrap gap-3">
        {filteredBadges.map((badge) => {
          const unlocked = unlockedIds.has(badge.id);
          if (!showLocked && !unlocked) return null;
          const progress = badge.progress ? badge.progress(gamificationData) : 0;

          return (
            <Pressable
              key={badge.id}
              onPress={() => setSelectedBadge(badge.id)}
              className="items-center gap-2"
              style={{ width: '28%' }}
            >
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center"
                style={{
                  backgroundColor: unlocked
                    ? 'rgba(124,58,237,0.2)'
                    : 'rgba(255,255,255,0.05)',
                  borderWidth: 1,
                  borderColor: unlocked
                    ? 'rgba(124,58,237,0.4)'
                    : 'rgba(255,255,255,0.08)',
                  opacity: unlocked ? 1 : 0.5,
                }}
              >
                <Text className="text-2xl">
                  {BADGE_ICONS[badge.icon] ?? '🏅'}
                </Text>
              </View>

              {/* Mini progress bar */}
              {!unlocked && progress > 0 && (
                <View className="w-full">
                  <ProgressBar progress={progress} height={2} animated />
                </View>
              )}

              <Text
                className="text-xs text-center text-text-secondary"
                numberOfLines={2}
              >
                {badge.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Modal détail badge */}
      <Modal
        visible={!!selectedBadge}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onPress={() => setSelectedBadge(null)}
        >
          {selectedBadgeData && (
            <Pressable
              className="mx-8 p-6 rounded-3xl gap-4"
              style={{
                backgroundColor: '#0f0f1a',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
                minWidth: 280,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              <View className="items-center gap-3">
                <View
                  className="w-20 h-20 rounded-2xl items-center justify-center"
                  style={{
                    backgroundColor: isUnlocked
                      ? 'rgba(124,58,237,0.25)'
                      : 'rgba(255,255,255,0.06)',
                    opacity: isUnlocked ? 1 : 0.6,
                  }}
                >
                  <Text className="text-4xl">
                    {BADGE_ICONS[selectedBadgeData.icon] ?? '🏅'}
                  </Text>
                </View>

                <View className="items-center gap-1">
                  <Text className="text-xl font-bold text-text-primary text-center">
                    {selectedBadgeData.name}
                  </Text>
                  <RarityBadge rarity={selectedBadgeData.rarity} size="md" />
                </View>

                <Text className="text-sm text-text-secondary text-center">
                  {selectedBadgeData.description}
                </Text>

                <View className="flex-row items-center gap-1">
                  <Text className="text-sm text-text-muted">Récompense :</Text>
                  <Text className="text-sm font-bold text-brand-secondary">
                    +{selectedBadgeData.xpReward} XP
                  </Text>
                </View>

                {!isUnlocked && badgeProgress > 0 && (
                  <View className="w-full gap-1">
                    <ProgressBar
                      progress={badgeProgress}
                      label={`${Math.round(badgeProgress)}% complété`}
                      showLabel
                      animated
                    />
                  </View>
                )}

                {isUnlocked && (
                  <Text className="text-sm font-semibold text-status-success">
                    ✓ Débloqué
                  </Text>
                )}
              </View>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
