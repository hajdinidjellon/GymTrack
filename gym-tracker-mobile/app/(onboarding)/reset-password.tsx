import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/theme';
import { passwordError } from '@/domain/account';
import { t } from '@/i18n';
import { useLocale } from '@/hooks/useLocale';
import { resetWithEmailLink } from '@/services/recovery';
import { loadAccountData } from '@/stores/accountData';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { resetTo } from '@/components/navigation/resetTo';
import { Screen } from '@/components/ui/Screen';
import { StickerButton } from '@/components/ui/StickerButton';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

/** Opened by the link of the reset email: okilo://reset-password?token_hash=… */
export default function ResetPassword() {
  useLocale();
  const { token_hash: tokenHash } = useLocalSearchParams<{ token_hash?: string }>();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const invalid = passwordError(password);
    if (invalid) return setError(invalid);
    setBusy(true);
    const ok = !!tokenHash && (await resetWithEmailLink(tokenHash, password));
    if (!ok) {
      setBusy(false);
      return setError(t('account.reset.failed'));
    }
    await loadAccountData();
    setBusy(false);
    if (!useProfileStore.getState().profile) return router.replace('/setup');
    useSettingsStore.getState().updateSettings({ signedOut: false });
    resetTo('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        scroll
        footer={
          <StickerButton
            label={busy ? t('account.forgot.resetting') : t('account.reset.save')}
            onPress={save}
            disabled={busy || !password}
          />
        }
      >
        <Text size={44} weight="black" style={{ marginTop: 40, lineHeight: 50 }}>
          {t('account.reset.title')}
        </Text>
        <Text size={18} color={colors.inkMuted} style={{ marginTop: 12 }}>
          {t('account.reset.subtitle')}
        </Text>
        <View style={{ gap: 18, marginTop: 30 }}>
          <TextField
            label={t('account.forgot.newPassword')}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            kind="newPassword"
          />
          {error ? (
            <Text size={16} weight="bold" color={colors.danger} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
