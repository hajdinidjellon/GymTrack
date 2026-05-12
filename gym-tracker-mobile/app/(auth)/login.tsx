import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, Pressable, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { signInWithEmail } from '@/lib/supabase';
import { initialSync } from '@/lib/sync';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { colors } from '@/constants/theme';

const LOGO = require('@/assets/logo.png') as number;

export default function LoginScreen() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const { setWorkouts, loadWorkouts } = useWorkoutStore();
  const { saveProfile, loadGoals, loadProfile } = useProfileStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('Veuillez remplir tous les champs'); return; }
    setLoading(true); setError(null);

    const { error: authError } = await signInWithEmail(email.trim(), password);
    if (authError) { setError(authError); setLoading(false); return; }

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

  const handleGuest = async () => {
    // Charge le profil local — si existe → tabs, sinon → onboarding
    await loadWorkouts();
    const profile = await loadProfile().then(() => useProfileStore.getState().profile);
    if (profile) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/onboarding/name');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#080810' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 48, gap: 12 }}>
          <Image source={LOGO} style={{ width: 80, height: 80 }} resizeMode="contain" />
          <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 }}>GymTrack</Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>Ton journal d'entraînement</Text>
        </View>

        {/* Formulaire */}
        <View style={{ gap: 14, marginBottom: 24 }}>
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
            rightIcon={<Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.40)" />}
            onRightIconPress={() => setShowPassword((v) => !v)}
          />

          {error && (
            <Text style={{ fontSize: 13, color: colors.status.danger, textAlign: 'center' }}>{error}</Text>
          )}

          {/* Connexion */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={{ borderRadius: 16, overflow: 'hidden', opacity: loading ? 0.7 : 1 }}
          >
            <LinearGradient colors={['#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              {loading
                ? <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>Connexion...</Text>
                : <>
                    <Ionicons name="log-in-outline" size={20} color="#fff" />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>Se connecter</Text>
                  </>
              }
            </LinearGradient>
          </Pressable>
        </View>

        {/* Séparateur */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', fontWeight: '600' }}>OU</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
        </View>

        {/* Continuer sans compte */}
        <Pressable
          onPress={handleGuest}
          style={{ padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 }}
        >
          <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.60)" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.60)' }}>
            Continuer sans compte
          </Text>
        </Pressable>

        {/* Lien inscription */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)' }}>Pas encore de compte ?</Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.brand.primary }}>S'inscrire</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
