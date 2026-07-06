/**
 * LOGIN — reconnexion au compte (DA HUD ATLAS).
 * NEXUS en listening pendant la saisie, champs HudInput, CTA BevelButton.
 * Logique auth/sync inchangée.
 */
import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, Pressable, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { JarvisMascot } from '@/components/mascot/JarvisMascot';
import { HudInput } from '@/components/ui/hud/HudInput';
import { BevelButton } from '@/components/ui/hud/BevelButton';
import { signInWithEmail } from '@/lib/supabase';
import { initialSync } from '@/lib/sync';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { hud, hudType } from '@/constants/theme';

const SESSION_BG = require('@/assets/images/background-session.png') as number;

export default function LoginScreen() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const { setWorkouts, loadWorkouts }           = useWorkoutStore();
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
    await loadWorkouts();
    const profile = await loadProfile().then(() => useProfileStore.getState().profile);
    if (profile) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/onboarding/name');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: hud.bg.app }}>
      <StatusBar style="light" />

      <ImageBackground
        source={SESSION_BG}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="cover"
        imageStyle={{ opacity: 0.55 }}
      />
      <LinearGradient
        colors={['rgba(5,11,22,0.30)', 'rgba(5,11,22,0.60)', 'rgba(5,11,22,0.95)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Retour vers welcome */}
            <Pressable
              onPress={() => router.replace('/(auth)/welcome')}
              hitSlop={8}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 6,
                marginTop: 16, marginBottom: 8, alignSelf: 'flex-start',
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Ionicons name="chevron-back" size={16} color={hud.cyan.bright} />
              <Text style={[hudType.labelHud, { color: hud.text.secondary }]}>Retour</Text>
            </Pressable>

            {/* NEXUS + titre */}
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={{ alignItems: 'center', marginTop: 12, marginBottom: 32 }}
            >
              <JarvisMascot size={88} mood={loading ? 'processing' : 'listening'} />
              <Text style={[hudType.displayTitle, { fontSize: 30, marginTop: 18 }]}>
                Bon retour
              </Text>
              <Text style={[hudType.body, { marginTop: 6, textAlign: 'center' }]}>
                Reconnexion au système
              </Text>
            </Animated.View>

            {/* Formulaire */}
            <View style={{ gap: 16, marginBottom: 24 }}>
              <HudInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="ton@email.com"
              />
              <HudInput
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                right={
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={hud.text.muted}
                    />
                  </Pressable>
                }
              />

              {error && (
                <Text style={{
                  fontFamily: 'Rajdhani-SemiBold', fontSize: 14,
                  color: hud.accent.pulse, textAlign: 'center',
                }}>
                  {error}
                </Text>
              )}
            </View>

            <BevelButton
              label="Se connecter"
              onPress={handleLogin}
              loading={loading}
              heroChevrons
            />

            {/* Séparateur */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: hud.border.hairline }} />
              <Text style={[hudType.labelHud, { color: hud.text.faint }]}>OU</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: hud.border.hairline }} />
            </View>

            <BevelButton
              label="Continuer sans compte"
              variant="ghost"
              height={48}
              onPress={handleGuest}
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
