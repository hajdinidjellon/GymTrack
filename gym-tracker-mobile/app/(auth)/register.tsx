import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { signUpWithEmail } from '@/lib/supabase';
import { colors } from '@/constants/theme';

export default function RegisterScreen() {
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) { setError('Veuillez remplir tous les champs'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return; }

    setLoading(true); setError(null);
    const { error: authError } = await signUpWithEmail(email.trim(), password);
    if (authError) { setError(authError); setLoading(false); return; }
    router.replace('/(auth)/onboarding/name');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#080810' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Retour */}
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.50)" />
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', fontWeight: '600' }}>Retour</Text>
        </Pressable>

        {/* Header */}
        <View style={{ gap: 6, marginBottom: 36 }}>
          <Text style={{ fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 40 }}>
            Créer un compte
          </Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 22 }}>
            Synchronise tes données sur tous tes appareils.
          </Text>
        </View>

        {/* Bouton sans compte en priorité */}
        <Pressable
          onPress={() => router.replace('/(auth)/onboarding/name')}
          style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 28 }}
        >
          <LinearGradient colors={['#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff' }}>Continuer sans compte</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                Données locales · Pas d'email requis
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.70)" />
          </LinearGradient>
        </Pressable>

        {/* Séparateur */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', fontWeight: '600' }}>OU CRÉER UN COMPTE</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
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
            secureTextEntry
            placeholder="••••••••"
            hint="Au moins 6 caractères"
          />
          <Input
            label="Confirmer"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="••••••••"
            error={confirmPassword && confirmPassword !== password ? 'Les mots de passe ne correspondent pas' : undefined}
          />

          {error && (
            <Text style={{ fontSize: 13, color: colors.status.danger, textAlign: 'center' }}>{error}</Text>
          )}

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            style={{ borderRadius: 16, overflow: 'hidden', opacity: loading ? 0.7 : 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
          >
            <View style={{ paddingVertical: 15, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: loading ? 'rgba(255,255,255,0.50)' : '#fff' }}>
                {loading ? 'Création...' : 'Créer mon compte'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Lien login */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)' }}>Déjà un compte ?</Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.brand.primary }}>Se connecter</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
