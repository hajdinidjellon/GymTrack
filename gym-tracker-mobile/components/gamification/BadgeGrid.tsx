import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RarityBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BADGES } from '@/lib/gamification';
import { colors } from '@/constants/theme';
import type { GamificationData, BadgeCategory } from '@/types';

// Mapping icon name → Ionicons
const BADGE_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  dumbbell:       'barbell-outline',
  flame:          'flame-outline',
  zap:            'flash-outline',
  trophy:         'trophy-outline',
  crown:          'ribbon-outline',
  calendar:       'calendar-outline',
  'trending-up':  'trending-up-outline',
  'shield-check': 'shield-checkmark-outline',
  star:           'star-outline',
  medal:          'medal-outline',
  'bar-chart-2':  'bar-chart-outline',
  activity:       'pulse-outline',
  'chevron-down': 'chevron-down-circle-outline',
  'arrow-up':     'arrow-up-circle-outline',
  award:          'ribbon-outline',
};

const RARITY_GRADIENT: Record<string, [string, string]> = {
  common:    ['#6B7280', '#9CA3AF'],
  rare:      ['#3b82f6', '#60A5FA'],
  epic:      ['#7c3aed', '#a78bfa'],
  legendary: ['#D97706', '#FCD34D'],
};

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  consistency: 'Régularité',
  strength:    'Force',
  volume:      'Volume',
  diversity:   'Diversité',
  milestone:   'Jalons',
  special:     'Spécial',
};

interface BadgeGridProps {
  gamificationData: GamificationData;
  showLocked?: boolean;
}

export function BadgeGrid({ gamificationData, showLocked = true }: BadgeGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [selectedBadge, setSelectedBadge]       = useState<string | null>(null);

  const categories: Array<BadgeCategory | 'all'> = [
    'all', 'milestone', 'consistency', 'strength', 'volume', 'diversity', 'special',
  ];

  const filteredBadges = BADGES.filter((b) =>
    selectedCategory === 'all' || b.category === selectedCategory,
  );

  const unlockedIds = new Set(
    BADGES.filter((b) => b.condition(gamificationData)).map((b) => b.id),
  );

  const selectedBadgeData = selectedBadge ? BADGES.find((b) => b.id === selectedBadge) : null;
  const isUnlocked        = selectedBadge ? unlockedIds.has(selectedBadge) : false;
  const badgeProgress     = selectedBadgeData?.progress ? selectedBadgeData.progress(gamificationData) : 0;

  return (
    <View style={{ gap: 20 }}>

      {/* Filtre catégorie */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <Pressable key={cat} onPress={() => setSelectedCategory(cat)} style={{ borderRadius: 999, overflow: 'hidden' }}>
              {isActive ? (
                <LinearGradient colors={['#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                    {cat === 'all' ? 'Tous' : CATEGORY_LABELS[cat]}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 999 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.muted }}>
                    {cat === 'all' ? 'Tous' : CATEGORY_LABELS[cat]}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Grille badges */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {filteredBadges.map((badge) => {
          const unlocked  = unlockedIds.has(badge.id);
          if (!showLocked && !unlocked) return null;
          const progress  = badge.progress ? badge.progress(gamificationData) : 0;
          const gradient  = RARITY_GRADIENT[badge.rarity] ?? RARITY_GRADIENT.common!;
          const iconName  = BADGE_ICON_MAP[badge.icon] ?? 'ribbon-outline';

          return (
            <Pressable
              key={badge.id}
              onPress={() => setSelectedBadge(badge.id)}
              style={{ width: '30%', alignItems: 'center', gap: 8 }}
            >
              {/* Icône badge */}
              {unlocked ? (
                <LinearGradient
                  colors={gradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{
                    width: 68, height: 68, borderRadius: 22,
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: gradient[0], shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
                  }}
                >
                  <Ionicons name={iconName} size={30} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={{
                  width: 68, height: 68, borderRadius: 22,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: 0.40,
                }}>
                  <Ionicons name={iconName} size={28} color="rgba(255,255,255,0.5)" />
                </View>
              )}

              {/* Mini barre si en cours */}
              {!unlocked && progress > 0 && (
                <View style={{ width: '100%' }}>
                  <ProgressBar progress={progress} gradient={['#7c3aed', '#06b6d4']} height={2} animated />
                </View>
              )}

              <Text
                numberOfLines={2}
                style={{
                  fontSize: 11, textAlign: 'center', lineHeight: 15,
                  fontWeight: unlocked ? '700' : '400',
                  color: unlocked ? colors.text.primary : colors.text.muted,
                }}
              >
                {badge.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Modal détail */}
      <Modal visible={!!selectedBadge} transparent animationType="fade" onRequestClose={() => setSelectedBadge(null)}>
        <Pressable
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)' }}
          onPress={() => setSelectedBadge(null)}
        >
          {selectedBadgeData && (
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                marginHorizontal: 32, borderRadius: 28,
                backgroundColor: '#0e0e1c',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                overflow: 'hidden', minWidth: 300,
              }}
            >
              {/* Header gradient */}
              <LinearGradient
                colors={isUnlocked ? (RARITY_GRADIENT[selectedBadgeData.rarity] ?? ['#7c3aed','#06b6d4']) : ['rgba(255,255,255,0.06)','rgba(255,255,255,0.02)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ padding: 28, alignItems: 'center', gap: 14 }}
              >
                <View style={{
                  width: 80, height: 80, borderRadius: 26,
                  backgroundColor: isUnlocked ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.08)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons
                    name={BADGE_ICON_MAP[selectedBadgeData.icon] ?? 'ribbon-outline'}
                    size={40}
                    color={isUnlocked ? '#fff' : 'rgba(255,255,255,0.4)'}
                  />
                </View>

                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center' }}>
                    {selectedBadgeData.name}
                  </Text>
                  <RarityBadge rarity={selectedBadgeData.rarity} size="md" />
                </View>
              </LinearGradient>

              {/* Body */}
              <View style={{ padding: 20, gap: 16 }}>
                <Text style={{ fontSize: 15, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 }}>
                  {selectedBadgeData.description}
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="flash-outline" size={16} color="#06b6d4" />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#06b6d4' }}>
                    +{selectedBadgeData.xpReward} XP
                  </Text>
                </View>

                {!isUnlocked && badgeProgress > 0 && (
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: colors.text.muted }}>Progression</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text.primary }}>{Math.round(badgeProgress)}%</Text>
                    </View>
                    <ProgressBar progress={badgeProgress} gradient={['#7c3aed', '#06b6d4']} height={6} animated />
                  </View>
                )}

                {isUnlocked && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.status.success} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.status.success }}>Débloqué</Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
