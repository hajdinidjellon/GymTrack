import React from 'react';
import { Alert, Share, View } from 'react-native';
import { colors, space } from '@/constants/theme';
import { displayRecoveryCode } from '@/domain/recovery';
import { t } from '@/i18n';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';

interface Props {
  code: string;
  username?: string;
  onKept: () => void;
}

/**
 * The recovery code, shown once. Saved through the share sheet (Copy, Notes, a message…):
 * nothing is written on the phone. Leaving asks first, the code cannot be seen again.
 */
export function RecoveryCodeView({ code, username, onKept }: Props) {
  const save = () => {
    Share.share({ message: t('account.code.shareMessage', { code, username: username ?? '' }) }).catch(() => null);
  };

  const kept = () => {
    Alert.alert(t('account.code.confirmTitle'), t('account.code.confirmText'), [
      { text: t('account.code.confirmBack'), style: 'cancel' },
      { text: t('account.code.confirmYes'), onPress: onKept },
    ]);
  };

  return (
    <View style={{ gap: space.lg }}>
      <Text size={40} weight="black" style={{ lineHeight: 46 }}>
        {t('account.code.title')}
      </Text>
      <Text size={17} color={colors.inkMuted}>
        {t('account.code.subtitle')}
      </Text>
      <StickerCard tone="hero" style={{ alignItems: 'center', gap: space.sm }}>
        <Text
          selectable
          size={30}
          weight="black"
          accessibilityLabel={code.split('').join(' ')}
          testID="recovery-code"
          style={{ letterSpacing: 2 }}
        >
          {displayRecoveryCode(code).join(' - ')}
        </Text>
      </StickerCard>
      <StickerCard tone="sun" small>
        <Text size={16} weight="bold" color={colors.onSunPanel}>
          {t('account.code.warning')}
        </Text>
      </StickerCard>
      <StickerButton label={t('account.code.save')} variant="secondary" onPress={save} />
      <StickerButton label={t('account.code.kept')} onPress={kept} />
    </View>
  );
}
