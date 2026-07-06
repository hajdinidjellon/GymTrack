/**
 * CONNECT — proposition de compte en fin d'onboarding (DA HUD ATLAS).
 * Logique signUpWithEmail / passage sans compte inchangée.
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, ImageBackground,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { JarvisMascot } from '@/components/mascot/JarvisMascot';
import { HudInput } from '@/components/ui/hud/HudInput';
import { BevelButton } from '@/components/ui/hud/BevelButton';
import { signUpWithEmail } from '@/lib/supabase';
import { hud, hudType } from '@/constants/theme';

const SESSION_BG = require('@/assets/images/background-session.png') as number;

function HudBackdrop() {
  return (
    <>
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
    </>
  );
}

export default function ConnectScreen() {
  const params = useLocalSearchParams<Record<string, string>>();

  const [mode, setMode]                       = useState<'choose' | 'email'>('choose');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const goToDone = () => router.push({ pathname: '/(auth)/onboarding/done', params });

  const handleEmailSignup = async () => {
    if (!email.trim() || !password || !confirmPassword) { setError('Veuillez remplir tous les champs'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return; }
    setLoading(true); setError(null);
    const { error: authError } = await signUpWithEmail(email.trim(), password);
    if (authError) { setError(authError); setLoading(false); return; }
    goToDone();
  };

  // ── Formulaire email ─────────────────────────────────────────────
  if (mode === 'email') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: hud.bg.app }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar style="light" />
        <HudBackdrop />
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={() => setMode('choose')}
              hitSlop={8}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 6,
                marginTop: 16, marginBottom: 28, alignSelf: 'flex-start',
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Ionicons name="chevron-back" size={16} color={hud.cyan.bright} />
              <Text style={[hudType.labelHud, { color: hud.text.secondary }]}>Retour</Text>
            </Pressable>

            <Animated.View entering={FadeInDown.duration(400)}>
              <Text style={[hudType.displayTitle, { fontSize: 30, marginBottom: 6 }]}>
                Créer un compte
              </Text>
              <Text style={[hudType.body, { marginBottom: 28 }]}>
                Synchronise tes données sur tous tes appareils
              </Text>
            </Animated.View>

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
                placeholder="•••••••• (6 caractères min.)"
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
              <HudInput
                label="Confirmer"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                error={confirmPassword && confirmPassword !== password ? 'Les mots de passe ne correspondent pas' : undefined}
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
              label="Créer mon compte"
              onPress={handleEmailSignup}
              loading={loading}
              heroChevrons
            />

            <Pressable
              onPress={goToDone}
              style={({ pressed }) => ({
                paddingVertical: 16, alignItems: 'center',
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Text style={[hudType.labelHud, { color: hud.text.muted }]}>
                Continuer sans compte ›
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  // ── Écran de choix ───────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: hud.bg.app }}>
      <StatusBar style="light" />
      <HudBackdrop />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', gap: 6,
            margin: 20, alignSelf: 'flex-start',
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={16} color={hud.cyan.bright} />
          <Text style={[hudType.labelHud, { color: hud.text.secondary }]}>Retour</Text>
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <JarvisMascot size={120} mood="idle" />
        </View>

        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ paddingHorizontal: 24, marginBottom: 24, gap: 8 }}
        >
          <Text style={[hudType.labelHud, { color: hud.cyan.bright }]}>
            GymTrack
          </Text>
          <Text style={[hudType.displayTitle, { fontSize: 32, lineHeight: 38 }]}>
            Sauvegarde{'\n'}tes progrès
          </Text>
          <Text style={hudType.body}>
            Choisis comment te connecter pour synchroniser tes données
          </Text>
        </Animated.View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 14 }}>
          <BevelButton
            label="Continuer avec l'email"
            onPress={() => setMode('email')}
            heroChevrons
            icon={<Ionicons name="mail-outline" size={18} color={hud.text.primary} />}
          />
          <BevelButton
            label="Continuer avec Google"
            variant="ghost"
            height={48}
            onPress={() => Alert.alert('Bientôt disponible', 'La connexion Google arrive prochainement !')}
            icon={<Ionicons name="logo-google" size={16} color={hud.cyan.bright} />}
          />
          <Pressable
            onPress={goToDone}
            style={({ pressed }) => ({
              paddingVertical: 12, alignItems: 'center',
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <Text style={[hudType.labelHud, { color: hud.text.muted }]}>
              Continuer sans compte ›
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
