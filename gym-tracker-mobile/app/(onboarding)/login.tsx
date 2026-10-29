import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { border, colors, fonts, hardShadow, radius } from '@/constants/theme';
import { isSupabaseConfigured, signInWithEmail } from '@/services/supabase';
import { initialSync } from '@/services/sync';
import { useProfileStore } from '@/stores/profileStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { BackButton } from '@/components/ui/BackButton';
import { resetTo } from '@/components/navigation/resetTo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const signIn = async () => {
    if (!isSupabaseConfigured()) {
      setError("La synchro cloud n'est pas configurée sur cette version.");
      return;
    }
    setBusy(true);
    setError(null);
    const { ok } = await signInWithEmail(email.trim(), password);
    if (!ok) {
      setBusy(false);
      setError('Email ou mot de passe incorrect.');
      return;
    }
    await initialSync().catch(() => null);
    await Promise.all([useWorkoutStore.getState().loadWorkouts(), useProfileStore.getState().loadProfile()]);
    setBusy(false);
    goOn();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        footer={
          <>
            <StickerButton
              label={busy ? 'Connexion…' : 'Se connecter'}
              onPress={signIn}
              disabled={busy || !email || !password}
            />
            <StickerButton label="Continuer sans compte" variant="ghost" size="small" onPress={goOn} />
          </>
        }
      >
        <BackButton />
        <Text size={52} weight="black" style={{ marginTop: 20, lineHeight: 58 }}>
          Re-bonjour.
        </Text>
        <Text size={19} color={colors.inkMuted} style={{ marginTop: 12 }}>
          Ta barre est restée chargée là où tu l'as laissée.
        </Text>

        <View style={{ gap: 18, marginTop: 34 }}>
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="toi@exemple.com" email />
          <Field label="Mot de passe" value={password} onChangeText={setPassword} placeholder="••••••••" secure />
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

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  email?: boolean;
  secure?: boolean;
}

function Field({ label, value, onChangeText, placeholder, email, secure }: FieldProps) {
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
          keyboardType={email ? 'email-address' : 'default'}
          textContentType={email ? 'emailAddress' : 'password'}
          secureTextEntry={secure}
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
