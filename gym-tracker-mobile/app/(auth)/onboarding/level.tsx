/**
 * ONBOARDING STEP 2 — Niveau + fréquence
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';

type Level = 'beginner' | 'intermediate' | 'advanced' | 'elite';

const LEVELS = [
  { id: 'beginner' as Level, emoji: '🌱', title: 'Débutant', description: 'Moins d\'1 an de pratique' },
  { id: 'intermediate' as Level, emoji: '💪', title: 'Intermédiaire', description: '1 à 3 ans de pratique' },
  { id: 'advanced' as Level, emoji: '🔥', title: 'Avancé', description: '3 à 5 ans de pratique' },
  { id: 'elite' as Level, emoji: '👑', title: 'Élite', description: 'Plus de 5 ans, compétiteur' },
];

const FREQUENCIES = [2, 3, 4, 5, 6];

export default function OnboardingLevelScreen() {
  const params = useLocalSearchParams<{ goal: string }>();
  const [level, setLevel] = useState<Level | null>(null);
  const [frequency, setFrequency] = useState<number>(3);

  return (
    <ScrollView
      className="flex-1 bg-bg-primary"
      contentContainerClassName="px-6 py-12 gap-8"
    >
      {/* Progress */}
      <View className="flex-row gap-1.5">
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            className="h-1 flex-1 rounded-full"
            style={{ backgroundColor: step <= 2 ? '#7c3aed' : 'rgba(255,255,255,0.1)' }}
          />
        ))}
      </View>

      {/* Titre */}
      <View className="gap-2">
        <Text className="text-xs font-medium text-brand-primary uppercase tracking-widest">
          Étape 2 / 3
        </Text>
        <Text className="text-3xl font-black text-text-primary">
          Ton niveau et ta disponibilité
        </Text>
      </View>

      {/* Niveau */}
      <View className="gap-3">
        <Text className="text-base font-semibold text-text-primary">
          Niveau d'expérience
        </Text>
        {LEVELS.map((l) => (
          <Pressable
            key={l.id}
            onPress={() => setLevel(l.id)}
            className="flex-row items-center gap-3 p-4 rounded-2xl"
            style={{
              backgroundColor:
                level === l.id
                  ? 'rgba(124,58,237,0.15)'
                  : 'rgba(255,255,255,0.04)',
              borderWidth: 1.5,
              borderColor:
                level === l.id ? '#7c3aed' : 'rgba(255,255,255,0.08)',
            }}
          >
            <Text className="text-2xl">{l.emoji}</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-text-primary">{l.title}</Text>
              <Text className="text-sm text-text-secondary">{l.description}</Text>
            </View>
            {level === l.id && <Text className="text-brand-primary">✓</Text>}
          </Pressable>
        ))}
      </View>

      {/* Fréquence */}
      <View className="gap-3">
        <Text className="text-base font-semibold text-text-primary">
          Séances par semaine
        </Text>
        <View className="flex-row gap-2">
          {FREQUENCIES.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFrequency(f)}
              className="flex-1 py-3 rounded-xl items-center"
              style={{
                backgroundColor:
                  frequency === f
                    ? 'rgba(124,58,237,0.2)'
                    : 'rgba(255,255,255,0.06)',
                borderWidth: 1.5,
                borderColor:
                  frequency === f ? '#7c3aed' : 'rgba(255,255,255,0.08)',
              }}
            >
              <Text
                className="text-lg font-bold"
                style={{ color: frequency === f ? '#7c3aed' : '#f8fafc' }}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text className="text-xs text-text-muted text-center">
          {frequency === 2
            ? 'Parfait pour débuter — 2 jours suffisent'
            : frequency <= 4
              ? 'Idéal pour la progression régulière'
              : 'Haut volume — assure-toi de bien récupérer'}
        </Text>
      </View>

      {/* CTA */}
      <Button
        label="Continuer"
        variant="primary"
        size="lg"
        fullWidth
        disabled={!level}
        onPress={() => {
          if (level) {
            router.push({
              pathname: '/(auth)/onboarding/prs',
              params: { goal: params.goal, level, frequency: String(frequency) },
            });
          }
        }}
      />
    </ScrollView>
  );
}
