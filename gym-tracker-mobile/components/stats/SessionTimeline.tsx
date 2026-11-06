import React from 'react';
import { View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { formatDuration, formatTime } from '@/domain/format';
import type { Timeline } from '@/domain/sessionTime';
import { exerciseName, listOf, t } from '@/i18n';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';

/** Start, end, total, then a thin bar per exercise: where the time went. */
export function SessionTimeline({ timeline }: { timeline: Timeline }) {
  const longest = Math.max(1, ...timeline.blocks.map((b) => b.minutes));
  return (
    <StickerCard small style={{ gap: space.sm }}>
      <View
        accessible
        accessibilityLabel={t('history.timeline.a11y', {
          start: formatTime(timeline.start),
          end: formatTime(timeline.end),
          total: formatDuration(timeline.minutes),
        })}
        style={{ flexDirection: 'row', justifyContent: 'space-between' }}
      >
        <Moment label={t('history.timeline.start')} value={formatTime(timeline.start)} />
        <Moment label={t('history.timeline.end')} value={formatTime(timeline.end)} />
        <Moment label={t('history.timeline.total')} value={formatDuration(timeline.minutes)} />
      </View>
      {timeline.blocks.length > 0 ? (
        <View style={{ gap: 8, paddingTop: space.sm, borderTopWidth: 2, borderTopColor: colors.line }}>
          {timeline.blocks.map((b, i) => (
            <View key={i} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Text size={14} weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                  {listOf(b.names.map(exerciseName))}
                </Text>
                <Text size={14} weight="black" color={colors.inkMuted}>
                  {formatDuration(b.minutes)}
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  width: `${Math.max(4, (b.minutes / longest) * 100)}%`,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: colors.frame,
                  backgroundColor: colors.coralSoft,
                }}
              />
            </View>
          ))}
        </View>
      ) : null}
    </StickerCard>
  );
}

function Moment({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text size={13} weight="bold" color={colors.inkMuted}>
        {label}
      </Text>
      <Text size={18} weight="black">
        {value}
      </Text>
    </View>
  );
}
