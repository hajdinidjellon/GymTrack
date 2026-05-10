/**
 * ONBOARDING STEP 3 — PRs principaux + création du profil
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { NumericInput } from '@/components/ui/Input';
import { calculate1RM } from '@/lib/aiPlanner';
import { saveProfileLocal } from '@/lib/db';
import { pushAllToCloud } from '@/lib/sync';
import { useProfileStore } from '@/stores/profileStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import type { UserProfile, PersonalRecord } from '@/types';

interface PREntry {
  exercise: string;
  weight: number;
  reps: number;
  emoji: string;
}

const MAIN_EXERCISES: PREntry[] = [
  { exercise: 'Développé couché', weight: 60, reps: 5, emoji: '🏋️' },
  { exercise: 'Squat', weight: 80, reps: 5, emoji: '🦵' },
  { exercise: 'Soulevé de terre', weight: 100, reps: 3, emoji: '⬆️' },
  { exercise: 'Développé militaire', weight: 40, reps: 5, emoji: '💪' },
];

export default function OnboardingPRsScreen() {
  const params = useLocalSearchParams<{
    goal: string;
    level: string;
    frequency: string;
  }>();

  const [prs, setPrs] = useState<PREntry[]>(MAIN_EXERCISES);
  const [loading, setLoading] = useState(false);

  const { saveProfile } = useProfileStore();
  const { loadWorkouts } = useWorkoutStore();

  const updatePR = (index: number, field: 'weight' | 'reps', value: number) => {
    setPrs((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  const handleFinish = async () => {
    setLoading(true);

    const prRecords: PersonalRecord[] = prs
      .filter((p) => p.weight > 0)
      .map((p) => ({
        exercise: p.exercise,
        weight: p.weight,
        reps: p.reps,
        oneRepMax: calculate1RM(p.weight, p.reps),
        date: new Date().toISOString(),
      }));

    const profile: UserProfile = {
      name: '',
      height: 175,
      gender: 'male',
      experienceLevel:
        (params.level as UserProfile['experienceLevel']) ?? 'beginner',
      prs: prRecords,
      bodyStats: [],
      trainingFrequency: parseInt(params.frequency ?? '3', 10),
      goals: [],
    };

    await saveProfile(profile);
    await loadWorkouts();

    // Sync initial vers cloud (arrière-plan)
    pushAllToCloud().catch(() => null);

    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-primary"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="px-6 py-12 gap-8"
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress */}
        <View className="flex-row gap-1.5">
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: '#7c3aed' }}
            />
          ))}
        </View>

        {/* Titre */}
        <View className="gap-2">
          <Text className="text-xs font-medium text-brand-primary uppercase tracking-widest">
            Étape 3 / 3
          </Text>
          <Text className="text-3xl font-black text-text-primary">
            Tes records actuels
          </Text>
          <Text className="text-text-secondary">
            Indique tes maximums actuels. On s'en sert pour calculer les charges optimales.
          </Text>
        </View>

        {/* Entrées PRs */}
        <View className="gap-4">
          {prs.map((pr, index) => (
            <View
              key={pr.exercise}
              className="p-4 rounded-2xl gap-3 bg-white/[0.04]"
              style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">{pr.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-text-primary">
                    {pr.exercise}
                  </Text>
                  <Text className="text-xs text-text-muted">
                    1RM estimé : {calculate1RM(pr.weight, pr.reps).toFixed(1)} kg
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4">
                <View className="flex-1 gap-1">
                  <Text className="text-xs text-text-muted">Poids (kg)</Text>
                  <NumericInput
                    value={pr.weight}
                    onChange={(v) => updatePR(index, 'weight', v)}
                    min={0}
                    max={500}
                    step={2.5}
                    suffix="kg"
                  />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-xs text-text-muted">Répétitions</Text>
                  <NumericInput
                    value={pr.reps}
                    onChange={(v) => updatePR(index, 'reps', v)}
                    min={1}
                    max={30}
                    step={1}
                    suffix="reps"
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text className="text-xs text-text-muted text-center">
          Tu peux modifier ces données à tout moment dans ton profil.
        </Text>

        {/* CTA final */}
        <Button
          label="Commencer l'entraînement 🚀"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onPress={handleFinish}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
