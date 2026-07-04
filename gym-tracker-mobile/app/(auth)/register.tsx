import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, Animated, Easing,
  Dimensions, ImageBackground, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Input } from '@/components/ui/Input';
import { signUpWithEmail } from '@/lib/supabase';
import { colors } from '@/constants/theme';

const BG = require('@/assets/images/register-progress.png') as number;
const { height: H } = Dimensions.get('window');

export default function RegisterScreen() {
  const [mode, setMode]                       = useState<'choose' | 'email'>('choose');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) { setError('Veuillez remplir tous les champs'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return; }
    setLoading(true); setError(null);
    const { error: authError } = await signUpWithEmail(email.trim(), password);
    if (authError) { setError(authError); setLoading(false); return; }
    router.replace('/(auth)/onboarding/name');
  };

  // ── Formulaire email ─────────────────────────────────────────────
  if (mode === 'email') {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#07090f' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar style="light" />
        <SafeAreaView style={{ flex: 1 }}>
          <Animated.View style={{ flex: 1, opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              <Pressable onPress={() => setMode('choose')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 32, alignSelf: 'flex-start' }}>
                <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.55)" />
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: '700' }}>Retour</Text>
              </Pressable>

              <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1.4, lineHeight: 40, marginBottom: 6 }}>
                Créer un compte
              </Text>
              <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', fontWeight: '600', marginBottom: 32, lineHeight: 22 }}>
                Synchronise tes données sur tous tes appareils
              </Text>

              <View style={{ gap: 14, marginBottom: 22 }}>
                <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="ton@email.com" />
                <Input label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" hint="Au moins 6 caractères" />
                <Input label="Confirmer" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="••••••••"
                  error={confirmPassword && confirmPassword !== password ? 'Les mots de passe ne correspondent pas' : undefined}
                />
                {error && <Text style={{ fontSize: 13, color: colors.status.danger, textAlign: 'center', fontWeight: '600' }}>{error}</Text>}
              </View>

              <Pressable
                onPress={handleRegister}
                disabled={loading}
                style={({ pressed }) => ({
                  borderRadius: 20, overflow: 'hidden', marginBottom: 24,
                  opacity: loading ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  shadowColor: '#38bdf8', shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
                  elevation: 10,
                })}
              >
                <View style={{ backgroundColor: '#38bdf8', borderRadius: 20, paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#07090f', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    {loading ? 'Création…' : 'Créer mon compte'}
                  </Text>
                </View>
              </Pressable>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', fontWeight: '600' }}>Déjà un compte ?</Text>
                <Pressable onPress={() => router.push('/(auth)/login')}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#38bdf8' }}>Se connecter</Text>
                </Pressable>
              </View>

            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  // ── Écran de choix (mode === 'choose') ───────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#07090f' }}>
      <StatusBar style="light" />

      <ImageBackground source={BG} style={{ flex: 1 }} resizeMode="cover">
        <LinearGradient
          colors={['rgba(7,9,15,0.0)', 'rgba(7,9,15,0.10)', 'rgba(7,9,15,0.75)', '#07090f']}
          locations={[0, 0.40, 0.72, 1]}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <Animated.View style={{ flex: 1, opacity: fadeIn, transform: [{ translateY: slideUp }] }}>

              {/* Bouton retour */}
              <Pressable
                onPress={() => router.back()}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, margin: 20, alignSelf: 'flex-start' }}
              >
                <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.65)" />
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: '700' }}>Retour</Text>
              </Pressable>

              {/* Spacer — pousse le texte vers le bas */}
              <View style={{ flex: 1 }} />

              {/* Titre positionné bas */}
              <View style={{ paddingHorizontal: 24, marginBottom: 28, gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.50)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                  GymTrack
                </Text>
                <Text style={{ fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1.4, lineHeight: 42 }}>
                  Sauvegarde{'\n'}tes progrès
                </Text>
                <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', fontWeight: '600', lineHeight: 22 }}>
                  Accède à tes données sur tous tes appareils
                </Text>
              </View>

              {/* Boutons */}
              <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 14 }}>

                {/* Google */}
                <Pressable
                  style={({ pressed }) => ({
                    borderRadius: 20,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    shadowColor: '#fff', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                  })}
                >
                  <View style={{
                    backgroundColor: '#fff', borderRadius: 20,
                    paddingVertical: 18, paddingHorizontal: 24,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
                  }}>
                    <Ionicons name="logo-google" size={20} color="#1a1a2e" />
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#1a1a2e', letterSpacing: 0.3 }}>
                      Continuer avec Google
                    </Text>
                  </View>
                </Pressable>

                {/* Email */}
                <Pressable
                  onPress={() => setMode('email')}
                  style={({ pressed }) => ({
                    borderRadius: 20,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.10)',
                    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
                    paddingVertical: 18, paddingHorizontal: 24,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
                    borderRadius: 20,
                  }}>
                    <Ionicons name="mail-outline" size={20} color="#fff" />
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.3 }}>
                      Continuer avec l'email
                    </Text>
                  </View>
                </Pressable>

              </View>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
