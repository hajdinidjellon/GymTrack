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
import { signInWithEmail } from '@/lib/supabase';
import { initialSync } from '@/lib/sync';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setWorkouts, loadWorkouts } = useWorkoutStore();
  const { saveProfile, loadGoals } = useProfileStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: authError } = await signInWithEmail(email.trim(), password);

    if (authError) {
      setError(authError);
      setLoading(false);
      return;
    }

    // Sync cloud → local au login
    const remote = await initialSync();
    if (remote) {
      setWorkouts(remote.workouts);
      if (remote.profile) await saveProfile(remote.profile);
    } else {
      await loadWorkouts();
    }
    await loadGoals();

    router.replace('/(tabs)');
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
        {/* Logo / titre */}
        <View className="items-center gap-2 mb-12">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-2"
            style={{ backgroundColor: 'rgba(124,58,237,0.2)' }}
          >
            <Text className="text-3xl">🏋️</Text>
          </View>
          <Text className="text-3xl font-black text-text-primary">GymTrack</Text>
          <Text className="text-sm text-text-secondary">
            Ton journal d'entraînement premium
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
            secureTextEntry={!showPassword}
            placeholder="••••••••"
            rightIcon={
              <Text className="text-text-muted text-sm">
                {showPassword ? 'Cacher' : 'Voir'}
              </Text>
            }
            onRightIconPress={() => setShowPassword((v) => !v)}
          />

          {error && (
            <Text className="text-sm text-status-danger text-center">{error}</Text>
          )}

          <Button
            label="Se connecter"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleLogin}
          />

          {/* Mode hors ligne */}
          <Button
            label="Continuer sans compte"
            variant="ghost"
            size="md"
            fullWidth
            onPress={() => {
              loadWorkouts();
              router.replace('/(tabs)');
            }}
          />
        </View>

        {/* Lien inscription */}
        <View className="flex-row items-center justify-center gap-1 mt-8">
          <Text className="text-text-muted text-sm">Pas encore de compte ?</Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text className="text-brand-primary text-sm font-semibold">
              S'inscrire
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
