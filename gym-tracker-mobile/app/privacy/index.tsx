import React from 'react';
import { View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { useLocale } from '@/hooks/useLocale';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';
import { t } from '@/i18n';

const SECTIONS = [
  'who',
  'local',
  'collected',
  'why',
  'health',
  'device',
  'processors',
  'keep',
  'rights',
  'age',
] as const;

/** Profil → Confidentialité: the privacy policy, the same text as the page given to the stores. */
export default function PrivacyScreen() {
  useLocale();
  return (
    <Screen scroll>
      <ScreenHeader back title={t('privacy.title')} subtitle={t('privacy.subtitle')} />
      <View style={{ gap: space.md }}>
        {SECTIONS.map((key) => (
          <StickerCard key={key} small style={{ gap: space.sm }}>
            <Text size={17} weight="black" accessibilityRole="header">
              {t(`privacy.sections.${key}.title`)}
            </Text>
            <Text size={15} style={{ lineHeight: 22 }}>
              {t(`privacy.sections.${key}.body`)}
            </Text>
          </StickerCard>
        ))}
        <Text size={13} color={colors.inkMuted} style={{ marginBottom: space.xl }}>
          {t('privacy.updated')}
        </Text>
      </View>
    </Screen>
  );
}
