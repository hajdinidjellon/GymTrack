import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { signUpWithEmail } from '@/lib/supabase';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: authError } = await signUpWithEmail(email.trim(), password);

    if (authError) {
      setError(authError);
      setLoading(false);
      return;
    }

    // Après inscription → onboarding
    router.replace('/(auth)/onboarding/goal');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-primary"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="gap-1 mb-10">
          <Pressable
            onPress={() => router.back()}
            className="mb-4"
          >
            <Text className="text-text-secondary text-sm">← Retour</Text>
          </Pressable>
          <Text className="text-3xl font-black text-text-primary">
            Créer un compte
          </Text>
          <Text className="text-text-secondary">
            Commence à traquer tes progrès dès aujourd'hui
          </Text>
        </View>

        {/* Formulaire */}
        <View className="gap-4">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="ton@email.com"
          />

          <Input
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            hint="Au moins 6 caractères"
          />

          <Input
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="••••••••"
            error={
              confirmPassword && confirmPassword !== password
                ? 'Les mots de passe ne correspondent pas'
                : undefined
            }
          />

          {error && (
            <Text className="text-sm text-status-danger text-center">{error}</Text>
          )}

          <Button
            label="Créer mon compte"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleRegister}
          />
        </View>

        {/* Lien login */}
        <View className="flex-row items-center justify-center gap-1 mt-8">
          <Text className="text-text-muted text-sm">Déjà un compte ?</Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text className="text-brand-primary text-sm font-semibold">
              Se connecter
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
