import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';

type Goal = 'pr' | 'hypertrophy' | 'weight_loss' | 'consistency' | 'health';

const GOALS: Array<{
  id: Goal;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}> = [
  { id: 'pr',          icon: 'trophy-outline',       title: 'Battre des PRs',    description: 'Devenir plus fort sur les grands mouvements',      color: '#f59e0b' },
  { id: 'hypertrophy', icon: 'body-outline',          title: 'Prendre du muscle', description: 'Hypertrophie et développement musculaire',          color: '#7c3aed' },
  { id: 'weight_loss', icon: 'flame-outline',         title: 'Perdre du poids',   description: 'Composition corporelle et perte de masse grasse',   color: '#ef4444' },
  { id: 'consistency', icon: 'calendar-outline',      title: 'Être régulier',     description: 'Construire une habitude d\'entraînement durable',   color: '#06b6d4' },
  { id: 'health',      icon: 'heart-outline',         title: 'Rester en forme',   description: 'Santé globale, mobilité et bien-être',              color: '#10b981' },
];

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            height: 4, flex: i === current - 1 ? 2 : 1, borderRadius: 2,
            backgroundColor: i < current ? '#7c3aed' : 'rgba(255,255,255,0.12)',
          }}
        />
      ))}
    </View>
  );
}

export default function OnboardingGoalScreen() {
  const [name, setName]       = useState('');
  const [selected, setSelected] = useState<Goal | null>(null);

  const canContinue = name.trim().length >= 2 && selected !== null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#080810' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 48, gap: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Progression */}
        <ProgressDots current={1} total={3} />

        {/* Header */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.brand.primary, letterSpacing: 2.5, textTransform: 'uppercase' }}>
            Étape 1 / 3
          </Text>
          <Text style={{ fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 40 }}>
            Faisons connaissance
          </Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.50)', lineHeight: 22 }}>
            Ces informations personnalisent tes suggestions d'entraînement.
          </Text>
        </View>

        {/* Prénom */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Ton prénom
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 16, borderWidth: 1,
            borderColor: name.trim().length >= 2 ? '#7c3aed' : 'rgba(255,255,255,0.10)',
            paddingHorizontal: 16,
          }}>
            <Ionicons name="person-outline" size={18} color={name.trim().length >= 2 ? '#7c3aed' : 'rgba(255,255,255,0.30)'} />
            <TextInput
              style={{ flex: 1, fontSize: 18, fontWeight: '600', color: '#fff', paddingVertical: 16 }}
              placeholder="Prénom..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />
            {name.trim().length >= 2 && (
              <Ionicons name="checkmark-circle" size={20} color="#7c3aed" />
            )}
          </View>
        </View>

        {/* Objectif */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Ton objectif principal
          </Text>
          {GOALS.map((goal) => {
            const isSelected = selected === goal.id;
            return (
              <Pressable
                key={goal.id}
                onPress={() => setSelected(goal.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 16,
                  padding: 16, borderRadius: 18,
                  backgroundColor: isSelected ? `${goal.color}14` : 'rgba(255,255,255,0.04)',
                  borderWidth: 1.5,
                  borderColor: isSelected ? goal.color : 'rgba(255,255,255,0.08)',
                }}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 14,
                  backgroundColor: isSelected ? `${goal.color}22` : 'rgba(255,255,255,0.06)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={goal.icon} size={22} color={isSelected ? goal.color : 'rgba(255,255,255,0.35)'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: isSelected ? '#fff' : 'rgba(255,255,255,0.80)' }}>
                    {goal.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', marginTop: 2 }}>
                    {goal.description}
                  </Text>
                </View>
                {isSelected && (
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: goal.color, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* CTA */}
        <Pressable
          disabled={!canContinue}
          onPress={() => router.push({ pathname: '/(auth)/onboarding/level', params: { goal: selected!, name: name.trim() } })}
          style={{ borderRadius: 16, overflow: 'hidden', opacity: canContinue ? 1 : 0.4 }}
        >
          <LinearGradient
            colors={['#7c3aed', '#06b6d4']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 17, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>Continuer</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
