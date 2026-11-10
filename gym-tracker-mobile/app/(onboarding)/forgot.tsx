import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '@/constants/theme';
import { normalizeUsername, passwordError, usernameError } from '@/domain/account';
import { normalizeRecoveryCode } from '@/domain/recovery';
import { getLocale, t } from '@/i18n';
import { useLocale } from '@/hooks/useLocale';
import { requestResetEmail, resetWithCode } from '@/services/recovery';
import { isSupabaseConfigured } from '@/services/supabase';
import { useRecoveryStore } from '@/stores/recoveryStore';
import { BackButton } from '@/components/ui/BackButton';
import { Screen } from '@/components/ui/Screen';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

type Mode = 'email' | 'code';

export default function Forgot() {
  useLocale();
  const [mode, setMode] = useState<Mode>('email');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const fail = (text: string) => setMessage({ text, error: true });

  const sendEmail = async () => {
    const invalid = isSupabaseConfigured() ? usernameError(username) : t('onboarding.login.notConfigured');
    if (invalid) return fail(invalid);
    setBusy(true);
    const reached = await requestResetEmail(normalizeUsername(username), getLocale());
    setBusy(false);
    // Always the same answer: it never says whether the account exists
    setMessage(
      reached
        ? { text: t('account.forgot.emailSent'), error: false }
        : { text: t('account.forgot.offline'), error: true },
    );
  };

  const reset = async () => {
    const invalid = isSupabaseConfigured()
      ? (usernameError(username) ??
        (normalizeRecoveryCode(code) ? null : t('account.forgot.codeInvalid')) ??
        passwordError(password))
      : t('onboarding.login.notConfigured');
    if (invalid) return fail(invalid);
    setBusy(true);
    const result = await resetWithCode(normalizeUsername(username), code, password);
    setBusy(false);
    if (!result.ok) return fail(t(result.reason === 'limit' ? 'account.forgot.limit' : 'account.forgot.failed'));
    // The used code is gone: the new one is shown once, then back to the login
    useRecoveryStore.getState().show(result.code, normalizeUsername(username), 'login');
    router.replace('/recovery-code');
  };

  const switchMode = () => {
    setMode(mode === 'email' ? 'code' : 'email');
    setMessage(null);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        scroll
        footer={
          <StickerButton
            label={
              busy
                ? t('account.forgot.resetting')
                : t(mode === 'email' ? 'account.forgot.byEmail' : 'account.forgot.reset')
            }
            onPress={mode === 'email' ? sendEmail : reset}
            disabled={busy || !username.trim() || (mode === 'code' && (!code.trim() || !password))}
          />
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm }}>
          <BackButton />
          <Text size={36} weight="black" accessibilityRole="header" style={{ flex: 1, lineHeight: 42 }}>
            {t('account.forgot.title')}
          </Text>
        </View>
        <Text size={18} color={colors.inkMuted} style={{ marginTop: 12 }}>
          {t('account.forgot.subtitle')}
        </Text>

        <View style={{ gap: 18, marginTop: 30 }}>
          <TextField
            label={t('onboarding.login.username')}
            value={username}
            onChangeText={setUsername}
            placeholder="poseidon"
            kind="username"
          />
          {mode === 'code' ? (
            <>
              <TextField
                label={t('account.forgot.code')}
                value={code}
                onChangeText={setCode}
                placeholder="OKL-XXXX-XXXX-XXXX"
                kind="code"
              />
              <TextField
                label={t('account.forgot.newPassword')}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                kind="newPassword"
              />
            </>
          ) : null}
          {message ? (
            message.error ? (
              <Text size={16} weight="bold" color={colors.danger} accessibilityLiveRegion="polite">
                {message.text}
              </Text>
            ) : (
              <StickerCard tone="sun" small>
                <Text size={16} color={colors.onSunPanel} accessibilityLiveRegion="polite">
                  {message.text}
                </Text>
              </StickerCard>
            )
          ) : null}
          <StickerButton
            label={t(mode === 'email' ? 'account.forgot.byCode' : 'account.forgot.byEmail')}
            variant="ghost"
            size="small"
            onPress={switchMode}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
