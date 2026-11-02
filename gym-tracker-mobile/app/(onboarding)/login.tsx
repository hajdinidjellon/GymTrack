import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { border, colors, fonts, hardShadow, radius } from '@/constants/theme';
import { contactEmailError, loginEmail, normalizeUsername, passwordError, usernameError } from '@/domain/account';
import { t } from '@/i18n';
import { useLocale } from '@/hooks/useLocale';
import { isSupabaseConfigured, signInWithEmail, signUp } from '@/services/supabase';
import { initialSync } from '@/services/sync';
import { useProfileStore } from '@/stores/profileStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
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
    if (signingUp) {
      const result = await signUp(loginEmail(identifier), password, {
        username: normalizeUsername(identifier),
        contactEmail: contactEmail.trim() || undefined,
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
    // À l'inscription, ça envoie les séances déjà faites sur ce téléphone
    await initialSync().catch(() => null);
    await Promise.all([useWorkoutStore.getState().loadWorkouts(), useProfileStore.getState().loadProfile()]);
    setBusy(false);
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
          <Field
            label={t('onboarding.login.username')}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="poseidon"
            kind="username"
          />
          <Field
            label={t('onboarding.login.password')}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            kind={signingUp ? 'newPassword' : 'password'}
          />
          {signingUp ? (
            <Field
              label={t('onboarding.login.email')}
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

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  kind: 'username' | 'password' | 'newPassword' | 'email';
}

const CONTENT_TYPE = {
  username: 'username',
  password: 'password',
  newPassword: 'newPassword',
  email: 'emailAddress',
} as const;

function Field({ label, value, onChangeText, placeholder, kind }: FieldProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text size={15} weight="bold">
        {label}
      </Text>
      {/* L'ombre dure est portée par le cadre : TextInput ne la prend pas */}
      <View style={{ borderRadius: radius.input, ...hardShadow(2) }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={kind === 'email' ? 'email-address' : 'default'}
          textContentType={CONTENT_TYPE[kind]}
          secureTextEntry={kind === 'password' || kind === 'newPassword'}
          style={{
            height: 60,
            borderRadius: radius.input,
            borderWidth: border.base,
            borderColor: colors.outline,
            backgroundColor: colors.card,
            color: colors.ink,
            fontFamily: fonts.regular,
            fontSize: 19,
            paddingHorizontal: 20,
          }}
        />
      </View>
    </View>
  );
}
