import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { border, colors, fonts, hardShadow, radius } from '@/constants/theme';
import { contactEmailError, loginEmail, normalizeUsername, passwordError, usernameError } from '@/domain/account';
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

const SIGNUP_ERRORS = {
  taken: 'Ce pseudo est déjà pris.',
  confirm: 'Le compte attend une confirmation par mail : désactive « Confirm email » dans Supabase.',
  other: 'Impossible de créer le compte. Vérifie ta connexion et réessaie.',
} as const;

export default function Login() {
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
      setError("La synchro cloud n'est pas configurée sur cette version.");
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
        setError(SIGNUP_ERRORS[result.reason]);
        return;
      }
    } else {
      const { ok } = await signInWithEmail(loginEmail(identifier), password);
      if (!ok) {
        setBusy(false);
        setError('Pseudo ou mot de passe incorrect.');
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
              label={busy ? (signingUp ? 'Création…' : 'Connexion…') : signingUp ? 'Créer mon compte' : 'Se connecter'}
              onPress={submit}
              disabled={busy || !identifier.trim() || !password}
            />
            <StickerButton label="Continuer sans compte" variant="ghost" size="small" onPress={goOn} />
          </>
        }
      >
        <BackButton />
        <Text size={52} weight="black" style={{ marginTop: 20, lineHeight: 58 }}>
          {signingUp ? 'Ton compte.' : 'Re-bonjour.'}
        </Text>
        <Text size={19} color={colors.inkMuted} style={{ marginTop: 12 }}>
          {signingUp
            ? 'Tes séances sauvegardées, et retrouvées sur un autre téléphone.'
            : "Ta barre est restée chargée là où tu l'as laissée."}
        </Text>

        <View style={{ gap: 18, marginTop: 34 }}>
          <Field
            label="Pseudo"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="poseidon"
            kind="username"
          />
          <Field
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            kind={signingUp ? 'newPassword' : 'password'}
          />
          {signingUp ? (
            <Field
              label="Email (facultatif)"
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder="toi@exemple.com"
              kind="email"
            />
          ) : null}
          {error ? (
            <Text size={16} weight="bold" color={colors.danger} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <StickerButton
            label={signingUp ? "J'ai déjà un compte" : 'Pas de compte ? Créer un compte'}
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
            borderColor: colors.ink,
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
