import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { contactEmailError, loginEmail, normalizeUsername, passwordError, usernameError } from '@/domain/account';
import { t } from '@/i18n';
import { useLocale } from '@/hooks/useLocale';
import { createRecoveryCode } from '@/services/recovery';
import { isSupabaseConfigured, signInWithEmail, signUp } from '@/services/supabase';
import { loadAccountData } from '@/stores/accountData';
import { useProfileStore } from '@/stores/profileStore';
import { useRecoveryStore } from '@/stores/recoveryStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { StickerButton } from '@/components/ui/StickerButton';
import { BackButton } from '@/components/ui/BackButton';
import { resetTo } from '@/components/navigation/resetTo';

type Mode = 'signin' | 'signup';

const signupError = (reason: 'taken' | 'confirm' | 'other') => t(`onboarding.login.errors.${reason}`);

export default function Login() {
  useLocale();
  const [mode, setMode] = useState<Mode>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Après la connexion, on récupère le cloud puis on reprend là où on en était
  const goOn = () => {
    const hasProfile = !!useProfileStore.getState().profile;
    if (!hasProfile) {
      router.replace('/goal');
      return;
    }
    useSettingsStore.getState().updateSettings({ signedOut: false });
    resetTo('/(tabs)');
  };

  const signingUp = mode === 'signup';

  const switchMode = () => {
    setMode(signingUp ? 'signin' : 'signup');
    setError(null);
  };

  const submit = async () => {
    if (!isSupabaseConfigured()) {
      setError(t('onboarding.login.notConfigured'));
      return;
    }
    if (signingUp) {
      const invalid = usernameError(identifier) ?? passwordError(password) ?? contactEmailError(contactEmail);
      if (invalid) {
        setError(invalid);
        return;
      }
    }
    setBusy(true);
    setError(null);
    const email = contactEmail.trim() || undefined;
    if (signingUp) {
      const result = await signUp(loginEmail(identifier), password, {
        username: normalizeUsername(identifier),
        contactEmail: email,
      });
      if (!result.ok) {
        setBusy(false);
        setError(signupError(result.reason));
        return;
      }
    } else {
      const { ok } = await signInWithEmail(loginEmail(identifier), password);
      if (!ok) {
        setBusy(false);
        setError(t('onboarding.login.wrongCredentials'));
        return;
      }
    }
    await loadAccountData();
    // Sans email, le code de récupération est la seule façon de revenir : montré une fois
    const code = signingUp && !email ? await createRecoveryCode(password) : null;
    setBusy(false);
    if (code?.ok) {
      const hasProfile = !!useProfileStore.getState().profile;
      if (hasProfile) useSettingsStore.getState().updateSettings({ signedOut: false });
      useRecoveryStore.getState().show(code.code, normalizeUsername(identifier), hasProfile ? 'app' : 'goal');
      router.replace('/recovery-code');
      return;
    }
    goOn();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        scroll
        footer={
          <>
            <StickerButton
              label={
                busy
                  ? t(signingUp ? 'onboarding.login.creating' : 'onboarding.login.signingIn')
                  : t(signingUp ? 'onboarding.login.createAccount' : 'onboarding.login.signIn')
              }
              onPress={submit}
              disabled={busy || !identifier.trim() || !password}
            />
            <StickerButton label={t('onboarding.login.noAccount')} variant="ghost" size="small" onPress={goOn} />
          </>
        }
      >
        <BackButton />
        <Text size={52} weight="black" style={{ marginTop: 20, lineHeight: 58 }}>
          {t(signingUp ? 'onboarding.login.signupTitle' : 'onboarding.login.signinTitle')}
        </Text>
        <Text size={19} color={colors.inkMuted} style={{ marginTop: 12 }}>
          {t(signingUp ? 'onboarding.login.signupSubtitle' : 'onboarding.login.signinSubtitle')}
        </Text>

        <View style={{ gap: 18, marginTop: 34 }}>
          <TextField
            label={t('onboarding.login.username')}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="poseidon"
            kind="username"
          />
          <TextField
            label={t('onboarding.login.password')}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            kind={signingUp ? 'newPassword' : 'password'}
          />
          {signingUp ? (
            <TextField
              label={t('account.emailLabel')}
              hint={t('account.emailWhy')}
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder={t('onboarding.login.emailPlaceholder')}
              kind="email"
            />
          ) : null}
          {error ? (
            <Text size={16} weight="bold" color={colors.danger} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          {signingUp ? null : (
            <StickerButton
              label={t('account.forgot.link')}
              variant="ghost"
              size="small"
              onPress={() => router.push('/forgot')}
            />
          )}
          <StickerButton
            label={t(signingUp ? 'onboarding.login.haveAccount' : 'onboarding.login.toSignup')}
            variant="ghost"
            size="small"
            onPress={switchMode}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
