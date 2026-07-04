import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, Pressable, Image, Animated, Easing, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Input } from '@/components/ui/Input';
import { signInWithEmail } from '@/lib/supabase';
import { initialSync } from '@/lib/sync';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { colors } from '@/constants/theme';

const LOGO = require('@/assets/logo.png') as number;
const { width: W, height: H } = Dimensions.get('window');

function Blob({ top, left, right, bottom, rotate }: {
  top?: number; left?: number; right?: number; bottom?: number; rotate: string;
}) {
  return (
    <View style={{ position: 'absolute', top, left, right, bottom }}>
      <View style={{
        width: W * 0.72, height: W * 0.62,
        backgroundColor: '#0d2435',
        borderTopLeftRadius: 40, borderTopRightRadius: 180,
        borderBottomLeftRadius: 220, borderBottomRightRadius: 60,
        transform: [{ rotate }],
      }} />
      <View style={{
        position: 'absolute',
        width: W * 0.52, height: W * 0.44,
        backgroundColor: '#0e2a3f',
        borderTopLeftRadius: 150, borderTopRightRadius: 40,
        borderBottomLeftRadius: 60, borderBottomRightRadius: 160,
        top: W * 0.12, left: W * 0.08,
        transform: [{ rotate: '-20deg' }],
      }} />
    </View>
  );
}

export default function LoginScreen() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const { setWorkouts, loadWorkouts }           = useWorkoutStore();
  const { saveProfile, loadGoals, loadProfile } = useProfileStore();

  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

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
    <View style={{ flex: 1, backgroundColor: '#07090f' }}>
      <StatusBar style="light" backgroundColor="#07090f" />

      {/* Blobs */}
      <Blob top={-H * 0.10} left={-W * 0.24} rotate="-15deg" />
      <Blob bottom={H * 0.08} right={-W * 0.20} rotate="160deg" />

      {/* Dots décoratifs */}
      <View style={{ position: 'absolute', top: H * 0.12, right: W * 0.08, width: 20, height: 20, borderRadius: 10, backgroundColor: '#1a4a63', opacity: 0.75 }} />
      <View style={{ position: 'absolute', top: H * 0.38, left: W * 0.05, width: 14, height: 14, borderRadius: 7, backgroundColor: '#0e3050', opacity: 0.90 }} />
      <View style={{ position: 'absolute', bottom: H * 0.22, right: W * 0.10, width: 10, height: 10, borderRadius: 5, backgroundColor: '#1a4a63', opacity: 0.65 }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <Animated.View style={{ flex: 1, opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Retour vers welcome */}
              <Pressable
                onPress={() => router.replace('/(auth)/welcome')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 8, alignSelf: 'flex-start' }}
              >
                <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.55)" />
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: '700' }}>Retour</Text>
              </Pressable>

              {/* Logo */}
              <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 40 }}>
                <Image source={LOGO} style={{ width: 44, height: 44 }} resizeMode="contain" />
                <Text style={{
                  fontSize: 46, fontWeight: '900', color: '#fff',
                  letterSpacing: -1.5, marginTop: 14, lineHeight: 50,
                }}>
                  Bon retour !
                </Text>
                <Text style={{
                  fontSize: 16, fontWeight: '600',
                  color: 'rgba(255,255,255,0.45)',
                  marginTop: 6, textAlign: 'center',
                }}>
                  Connecte-toi à ton compte
                </Text>
              </View>

              {/* Formulaire */}
              <View style={{ gap: 14, marginBottom: 22 }}>
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
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="rgba(255,255,255,0.40)"
                    />
                  }
                  onRightIconPress={() => setShowPassword((v) => !v)}
                />

                {error && (
                  <Text style={{ fontSize: 13, color: colors.status.danger, textAlign: 'center', fontWeight: '600' }}>
                    {error}
                  </Text>
                )}
              </View>

              {/* Bouton principal — cyan comme welcome */}
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => ({
                  borderRadius: 20, overflow: 'hidden', marginBottom: 14,
                  opacity: loading ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  shadowColor: '#38bdf8', shadowOpacity: 0.45,
                  shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
                  elevation: 10,
                })}
              >
                <View style={{
                  backgroundColor: '#38bdf8', borderRadius: 20,
                  paddingVertical: 20, alignItems: 'center',
                  flexDirection: 'row', justifyContent: 'center', gap: 10,
                }}>
                  {loading
                    ? <Text style={{ fontSize: 16, fontWeight: '900', color: '#07090f', letterSpacing: 1 }}>
                        Connexion…
                      </Text>
                    : <>
                        <Ionicons name="log-in-outline" size={20} color="#07090f" />
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#07090f', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                          Se connecter
                        </Text>
                      </>
                  }
                </View>
              </Pressable>

              {/* Séparateur */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.09)' }} />
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: '700', letterSpacing: 1 }}>OU</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.09)' }} />
              </View>

              {/* Bouton sans compte — glassmorphism comme welcome */}
              <Pressable
                onPress={handleGuest}
                style={({ pressed }) => ({
                  borderRadius: 20, overflow: 'hidden', marginTop: 8,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                })}
              >
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
                  paddingVertical: 20, alignItems: 'center',
                  flexDirection: 'row', justifyContent: 'center', gap: 10,
                  borderRadius: 20,
                }}>
                  <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.80)" />
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    Continuer sans compte
                  </Text>
                </View>
              </Pressable>

            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>

    </View>
  );
}
