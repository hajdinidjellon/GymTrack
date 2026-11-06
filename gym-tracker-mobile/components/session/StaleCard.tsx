import React from 'react';
import { Alert, View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { formatMoment } from '@/domain/format';
import { lastSetAt } from '@/domain/sessionTime';
import { workingCount } from '@/domain/warmup';
import { dayName, t } from '@/i18n';
import type { ActiveSession } from '@/types';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';

interface Props {
  session: ActiveSession;
  now: number;
  onResume: () => void;
  onDelete: () => void;
}

/**
 * A session left open for hours (forgotten "Terminer"): said plainly instead
 * of reopened. Ending it at the last set is the screen's main button.
 */
export function StaleCard({ session, now, onResume, onDelete }: Props) {
  const last = lastSetAt(session.exercises);
  const sets = session.exercises.reduce((n, e) => n + workingCount(e.sets, 'done'), 0);
  const confirmDelete = () =>
    Alert.alert(t('session.stale.deleteTitle'), t('session.stale.deleteText', { count: sets }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('session.stale.deleteConfirm'), style: 'destructive', onPress: onDelete },
    ]);

  return (
    <>
      <SectionTitle title={t('session.running.title')} />
      <StickerCard tone="hero" style={{ gap: space.sm }}>
        <Text size={28} weight="black" style={{ lineHeight: 34 }}>
          {t('session.stale.title', { name: dayName(session.name) })}
        </Text>
        <Text size={16} weight="semibold" color={colors.inkMuted} style={{ lineHeight: 22 }}>
          {last != null
            ? t('session.stale.lastSet', { when: formatMoment(last, now), count: sets })
            : t('session.stale.noSet', { when: formatMoment(Date.parse(session.startedAt), now) })}
        </Text>
        <View style={{ gap: space.sm, marginTop: space.sm }}>
          <StickerButton variant="secondary" size="small" label={t('session.stale.resume')} onPress={onResume} />
          <StickerButton
            variant="ghost"
            size="small"
            label={t('session.stale.delete')}
            onPress={confirmDelete}
            testID="stale-delete"
          />
        </View>
      </StickerCard>
    </>
  );
}
