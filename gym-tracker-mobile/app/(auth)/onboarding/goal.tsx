/**
 * ONBOARDING STEP 1 — Objectif principal
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';

type Goal = 'pr' | 'hypertrophy' | 'weight_loss' | 'consistency' | 'health';

interface GoalOption {
  id: Goal;
  emoji: string;
  title: string;
  description: string;
}

const GOALS: GoalOption[] = [
  {
    id: 'pr',
    emoji: '🏆',
    title: 'Battre des PRs',
    description: 'Devenir plus fort sur les mouvements de force',
  },
  {
    id: 'hypertrophy',
    emoji: '💪',
    title: 'Prendre du muscle',
    description: 'Hypertrophie et développement musculaire',
  },
  {
    id: 'weight_loss',
    emoji: '🔥',
    title: 'Perdre du poids',
    description: 'Composition corporelle et perte de masse grasse',
  },
  {
    id: 'consistency',
    emoji: '📅',
    title: 'Être régulier',
    description: 'Construire une habitude d\'entraînement durable',
  },
  {
    id: 'health',
    emoji: '❤️',
    title: 'Rester en forme',
    description: 'Santé globale, mobilité et bien-être',
  },
];

export default function OnboardingGoalScreen() {
  const [selected, setSelected] = useState<Goal | null>(null);

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
            style={{ backgroundColor: step === 1 ? '#7c3aed' : 'rgba(255,255,255,0.1)' }}
          />
        ))}
      </View>

      {/* Titre */}
      <View className="gap-2">
        <Text className="text-xs font-medium text-brand-primary uppercase tracking-widest">
          Étape 1 / 3
        </Text>
        <Text className="text-3xl font-black text-text-primary">
          Quel est ton objectif principal ?
        </Text>
        <Text className="text-text-secondary">
          Cela nous permettra de personnaliser tes suggestions d'entraînement.
        </Text>
      </View>

      {/* Options */}
      <View className="gap-3">
        {GOALS.map((goal) => (
          <Pressable
            key={goal.id}
            onPress={() => setSelected(goal.id)}
            className="flex-row items-center gap-4 p-4 rounded-2xl"
            style={{
              backgroundColor:
                selected === goal.id
                  ? 'rgba(124,58,237,0.15)'
                  : 'rgba(255,255,255,0.04)',
              borderWidth: 1.5,
              borderColor:
                selected === goal.id
                  ? '#7c3aed'
                  : 'rgba(255,255,255,0.08)',
            }}
          >
            <Text className="text-3xl">{goal.emoji}</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-text-primary">
                {goal.title}
              </Text>
              <Text className="text-sm text-text-secondary">
                {goal.description}
              </Text>
            </View>
            {selected === goal.id && (
              <Text className="text-brand-primary text-lg">✓</Text>
            )}
          </Pressable>
        ))}
      </View>

      {/* CTA */}
      <Button
        label="Continuer"
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selected}
        onPress={() => {
          if (selected) {
            router.push({
              pathname: '/(auth)/onboarding/level',
              params: { goal: selected },
            });
          }
        }}
      />
    </ScrollView>
  );
}
