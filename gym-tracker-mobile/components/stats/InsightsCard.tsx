import React from 'react';
import { View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { INSIGHTS_AFTER, type Insight } from '@/domain/insights';
import { Text } from '@/components/ui/Text';
import { StickerCard } from '@/components/ui/StickerCard';
import { BulbIcon } from '@/components/ui/icons';

/** What the app learned from the history, one line per thing. Before that, how many sessions are left. */
export function InsightsCard({ insights, sessions }: { insights: Insight[]; sessions: number }) {
  const left = Math.max(0, INSIGHTS_AFTER - sessions);
  return (
    <StickerCard tone="sun" style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BulbIcon />
        <Text size={18} weight="black" accessibilityRole="header" style={{ flex: 1 }}>
          Ce que l'app sait de toi
        </Text>
      </View>
      {insights.length === 0 ? (
        <Text size={15} style={{ lineHeight: 21 }}>
          {left > 0
            ? `Encore ${left} séance${left > 1 ? 's' : ''} et je te dirai ce que j'ai appris : ton moment, tes jours, tes repos, ton point fort.`
            : 'Continue comme ça : je te dirai bientôt ce que j’ai appris de tes séances.'}
        </Text>
      ) : (
        insights.map((insight, i) => (
          <View
            key={insight.id}
            style={{
              gap: 2,
              paddingTop: i === 0 ? 0 : space.sm,
              borderTopWidth: i === 0 ? 0 : 2,
              borderTopColor: colors.ink,
            }}
          >
            <Text size={13} weight="bold">
              {insight.title}
            </Text>
            <Text size={16} weight="semibold" style={{ lineHeight: 21 }}>
              {insight.text}
            </Text>
          </View>
        ))
      )}
    </StickerCard>
  );
}
