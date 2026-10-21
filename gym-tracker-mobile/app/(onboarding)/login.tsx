import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, radius } from '@/constants/theme';
import { isSupabaseConfigured, signInWithEmail } from '@/lib/supabase';
import { initialSync } from '@/lib/sync';
import { useProfileStore } from '@/stores/profileStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';

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
    router.dismissAll();
    router.replace('/(tabs)');
  };

  const signIn = async () => {
    if (!isSupabaseConfigured()) {
      setError("La synchro cloud n'est pas configurée sur cette version.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await signInWithEmail(email.trim(), password);
    if (err) {
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
            <Button label={busy ? 'Connexion…' : 'Se connecter'} onPress={signIn} disabled={busy || !email || !password} />
            <Button label="Continuer sans compte" variant="ghost" height={52} onPress={goOn} />
          </>
        }
      >
        <BackButton />
        <Text size={56} weight="black" style={{ marginTop: 20, lineHeight: 56 }}>Re-bonjour.</Text>
        <Text size={19} color={colors.muted} style={{ marginTop: 12 }}>
          Ta barre est restée chargée là où tu l'as laissée.
        </Text>

        <View style={{ gap: 18, marginTop: 34 }}>
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="toi@exemple.com" email />
          <Field label="Mot de passe" value={password} onChangeText={setPassword} placeholder="••••••••" secure />
          {error ? <Text size={16} weight="bold" accessibilityLiveRegion="polite">{error}</Text> : null}
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
      <Text size={15} weight="bold" color={colors.muted}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={email ? 'email-address' : 'default'}
        textContentType={email ? 'emailAddress' : 'password'}
        secureTextEntry={secure}
        style={{
          height: 64,
          borderRadius: radius.sm + 2,
          borderWidth: 2,
          borderColor: colors.line,
          backgroundColor: colors.surface,
          color: colors.cream,
          fontFamily: fonts.regular,
          fontSize: 19,
          paddingHorizontal: 20,
        }}
      />
    </View>
  );
}
