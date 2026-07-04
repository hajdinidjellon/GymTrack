/**
 * RANK LADDER — l'échelle des 18 paliers (DESIGN-GYMTRACK.md §B.8).
 * Rail horizontal scrollable : paliers passés pleins, palier courant en
 * G2 + « TU ES ICI », paliers futurs en silhouette teintée à 15 % —
 * on devine la suite, donc on la veut.
 * Auto-scroll jusqu'au palier courant à l'ouverture.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { hud, hudType, rankPalette } from '@/constants/theme';
import { RANKS } from '@/lib/gamification';
import { BadgeImage } from '@/components/ui/BadgeImage';
import { useT } from '@/lib/i18n';
import type { Rank, RankTier } from '@/types';

const ITEM_W = 72;

function CurrentGlow({ color }: { color: string }) {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(opacity);
  }, []);
  const style = useAnimatedStyle(() => ({
    shadowOpacity: opacity.value,
    opacity: 1,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 2,
          left: 6,
          right: 6,
          bottom: 22,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: color,
          shadowColor: color,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    />
  );
}

function LevelChevrons({ level, color, dim }: { level: number; color: string; dim: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, justifyContent: 'center' }}>
      {Array.from({ length: level }, (_, i) => (
        <Text
          key={i}
          style={{
            fontFamily: 'Rajdhani-Bold',
            fontSize: 9,
            lineHeight: 10,
            color,
            opacity: dim ? 0.35 : 1,
          }}
        >
          ▲
        </Text>
      ))}
    </View>
  );
}

export function RankLadder({ currentRank }: { currentRank: Rank }) {
  const t = useT();
  const scrollRef = useRef<ScrollView>(null);
  const currentIdx = RANKS.findIndex(
    (r) => r.tier === currentRank.tier && r.level === currentRank.level,
  );

  useEffect(() => {
    // Centre le palier courant après le premier rendu.
    const id = setTimeout(() => {
      scrollRef.current?.scrollTo({
        x: Math.max(0, currentIdx * ITEM_W - ITEM_W * 1.5),
        animated: true,
      });
    }, 350);
    return () => clearTimeout(id);
  }, [currentIdx]);

  return (
    <View style={{ gap: 10 }}>
      <Text style={hudType.labelHud}>{t('rank.ladder')}</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 6, paddingHorizontal: 2 }}
      >
        {/* Rail lumineux continu derrière les emblèmes */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 34,
            left: 0,
            width: RANKS.length * ITEM_W,
            height: 1,
            backgroundColor: hud.border.subtle,
          }}
        />

        {RANKS.map((rank, i) => {
          const palette = rankPalette[rank.tier as RankTier];
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;

          return (
            <View key={rank.name} style={{ width: ITEM_W, alignItems: 'center', gap: 4 }}>
              {isCurrent && <CurrentGlow color={palette.core} />}

              <View style={{ opacity: isCurrent ? 1 : isPast ? 0.85 : 0.22 }}>
                <BadgeImage tier={rank.tier} size={isCurrent ? 52 : 44} />
              </View>

              <LevelChevrons
                level={rank.level}
                color={palette.core}
                dim={!isCurrent && !isPast}
              />

              <Text
                numberOfLines={1}
                style={{
                  fontFamily: isCurrent ? 'Rajdhani-Bold' : 'Rajdhani-Medium',
                  fontSize: 10,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  color: isCurrent
                    ? palette.core
                    : isPast
                      ? hud.text.secondary
                      : hud.text.faint,
                }}
              >
                {rank.name}
              </Text>

              {isCurrent && (
                <Text
                  style={{
                    fontFamily: 'Rajdhani-Bold',
                    fontSize: 8,
                    letterSpacing: 1.5,
                    color: hud.cyan.bright,
                  }}
                >
                  {t('rank.youAreHere')}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
