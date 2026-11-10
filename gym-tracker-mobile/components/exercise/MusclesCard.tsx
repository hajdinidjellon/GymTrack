import React from 'react';
import { View } from 'react-native';
import type { Muscle, Worked } from '@/domain/catalog/muscles';
import { colors, space } from '@/constants/theme';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';
import { t } from '@/i18n';
import { MuscleMap } from './MuscleMap';

const names = (list: Muscle[]) => list.map((m) => t(`exercise.video.muscles.${m}`)).join(', ');

/** "Muscles travaillés" on the exercise page: the muscle map, the main muscles, the ones that help. */
export function MusclesCard({ worked }: { worked: Worked }) {
  const main = names(worked.primary);
  return (
    <StickerCard style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <MuscleMap primary={worked.primary} secondary={worked.secondary} label={main} width={128} />
      <View style={{ flex: 1, gap: space.xs }}>
        <Text size={17} weight="black">
          {t('exercise.video.title')}
        </Text>
        <Text size={15} weight="bold">
          {main}
        </Text>
        {worked.secondary.length > 0 ? (
          <Text size={14} color={colors.inkMuted} style={{ lineHeight: 19 }}>
            {t('exercise.video.helpers', { muscles: names(worked.secondary) })}
          </Text>
        ) : null}
      </View>
    </StickerCard>
  );
}
