import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '@/constants/theme';
import { RECOVERY_PROMPT_AFTER, shouldSuggestRecoveryEmail } from '@/domain/recovery';
import { t } from '@/i18n';
import { getContactEmail } from '@/services/recovery';
import { hasSession } from '@/services/supabase';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';

/**
 * An account without email, after a few sessions: asked once to add one, the only way back in
 * besides the recovery code. Either answer puts it away for good.
 */
export function RecoveryEmailPrompt() {
  const sessions = useWorkoutStore((s) => s.workouts.length);
  const dismissed = useSettingsStore((s) => s.settings.recoveryPromptSeen);
  const [account, setAccount] = useState<{ signedIn: boolean; hasEmail: boolean } | null>(null);
  const due = !dismissed && sessions >= RECOVERY_PROMPT_AFTER;

  useEffect(() => {
    if (!due || account) return;
    Promise.all([hasSession(), getContactEmail()])
      .then(([signedIn, email]) => setAccount({ signedIn, hasEmail: !!email }))
      .catch(() => null);
  }, [due, account]);

  if (!account || !shouldSuggestRecoveryEmail({ ...account, sessions, dismissed })) return null;

  const close = () => useSettingsStore.getState().updateSettings({ recoveryPromptSeen: true });

  return (
    <StickerCard tone="sun" style={{ gap: space.md }}>
      <Text size={19} weight="titleMedium" color={colors.onSunPanel}>
        {t('account.prompt.title')}
      </Text>
      <Text size={16} color={colors.onSunPanel} style={{ lineHeight: 22 }}>
        {t('account.prompt.text')}
      </Text>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <StickerButton
          label={t('account.prompt.add')}
          variant="secondary"
          size="small"
          style={{ flex: 1 }}
          onPress={() => {
            close();
            router.push('/account');
          }}
        />
        <StickerButton label={t('account.prompt.dismiss')} variant="ghost" size="small" onPress={close} />
      </View>
    </StickerCard>
  );
}
