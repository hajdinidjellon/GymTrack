import React from 'react';
import { View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { workingCount } from '@/domain/warmup';
import type { ActiveSession } from '@/types';
import { Chip, IndexBadge } from '@/components/ui/Chip';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';
import { dayName, exerciseName, t } from '@/i18n';

/** A session is running: its own name and exercises, swaps and reorders included. */
export function RunningCard({ session }: { session: ActiveSession }) {
  // Working sets only: warm-ups are not "séries" to the user
  const total = session.exercises.reduce((n, e) => n + workingCount(e.sets), 0);
  const validated = session.exercises.reduce((n, e) => n + workingCount(e.sets, 'done'), 0);
  return (
    <>
      <SectionTitle title={t('session.running.title')} />
      <StickerCard tone="hero" style={{ paddingTop: 18, paddingBottom: 8 }}>
        <Text size={38} weight="black" numberOfLines={1} adjustsFontSizeToFit style={{ lineHeight: 44 }}>
          {dayName(session.name)}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: space.sm }}>
          <Chip label={t('session.running.progress', { done: validated, count: total })} />
        </View>
        <View style={{ marginTop: space.sm }}>
          {session.exercises.map((e, i) => (
            <View
              key={e.id}
              style={{
                minHeight: 52,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                borderBottomWidth: i === session.exercises.length - 1 ? 0 : 2,
                borderBottomColor: colors.line,
              }}
            >
              <IndexBadge value={i + 1} />
              <Text size={16} weight="bold" numberOfLines={2} style={{ flex: 1 }}>
                {exerciseName(e.name)}
              </Text>
              <Text
                size={14}
                weight="bold"
                color={workingCount(e.sets, 'left') === 0 ? colors.successText : colors.inkMuted}
              >
                {workingCount(e.sets, 'done')} / {workingCount(e.sets)}
              </Text>
            </View>
          ))}
        </View>
      </StickerCard>
    </>
  );
}
