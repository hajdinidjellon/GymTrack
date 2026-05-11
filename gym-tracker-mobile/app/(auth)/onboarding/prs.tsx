import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { NumericInput } from '@/components/ui/Input';
import { calculate1RM } from '@/lib/aiPlanner';
import { pushAllToCloud } from '@/lib/sync';
import { useProfileStore } from '@/stores/profileStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { colors } from '@/constants/theme';
import type { UserProfile, PersonalRecord } from '@/types';

interface PREntry {
  exercise: string;
  icon: keyof typeof Ionicons.glyphMap;
  weight: number;
  reps: number;
  color: string;
}

const MAIN_EXERCISES: PREntry[] = [
  { exercise: 'Développé couché',  icon: 'barbell-outline',  weight: 60,  reps: 5, color: '#7c3aed' },
  { exercise: 'Squat',             icon: 'body-outline',     weight: 80,  reps: 5, color: '#06b6d4' },
  { exercise: 'Soulevé de terre',  icon: 'arrow-up-outline', weight: 100, reps: 3, color: '#10b981' },
  { exercise: 'Développé militaire', icon: 'fitness-outline', weight: 40, reps: 5, color: '#f59e0b' },
];

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ height: 4, flex: i === current - 1 ? 2 : 1, borderRadius: 2, backgroundColor: i < current ? '#7c3aed' : 'rgba(255,255,255,0.12)' }} />
      ))}
    </View>
  );
}

export default function OnboardingPRsScreen() {
  const params = useLocalSearchParams<{
    goal: string; name: string; level: string; frequency: string;
  }>();

  const [prs, setPrs]       = useState<PREntry[]>(MAIN_EXERCISES);
  const [loading, setLoading] = useState(false);

  const { saveProfile } = useProfileStore();
  const { loadWorkouts } = useWorkoutStore();

  const updatePR = (index: number, field: 'weight' | 'reps', value: number) => {
    setPrs((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleFinish = async () => {
    setLoading(true);

    const prRecords: PersonalRecord[] = prs
      .filter((p) => p.weight > 0)
      .map((p) => ({
        exercise:   p.exercise,
        weight:     p.weight,
        reps:       p.reps,
        oneRepMax:  calculate1RM(p.weight, p.reps),
        date:       new Date().toISOString(),
      }));

    const profile: UserProfile = {
      name:               params.name?.trim() ?? '',
      height:             175,
      gender:             'male',
      experienceLevel:    (params.level as UserProfile['experienceLevel']) ?? 'beginner',
      prs:                prRecords,
      bodyStats:          [],
      trainingFrequency:  parseInt(params.frequency ?? '3', 10),
      goals:              [],
    };

    await saveProfile(profile);
    await loadWorkouts();
    pushAllToCloud().catch(() => null);
    router.replace('/(tabs)');
  };

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
        <ProgressDots current={3} total={3} />

        {/* Header */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.brand.primary, letterSpacing: 2.5, textTransform: 'uppercase' }}>
            Étape 3 / 3
          </Text>
          <Text style={{ fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 40 }}>
            Tes records actuels
          </Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.50)', lineHeight: 22 }}>
            Ces données servent à calculer tes charges optimales. Tu peux les modifier plus tard.
          </Text>
        </View>

        {/* Note pas obligatoire */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(6,182,212,0.08)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(6,182,212,0.18)' }}>
          <Ionicons name="information-circle-outline" size={18} color="#67e8f9" />
          <Text style={{ fontSize: 13, color: '#67e8f9', flex: 1 }}>
            Mets <Text style={{ fontWeight: '700' }}>0</Text> si tu ne connais pas encore un exercice — tu pourras les renseigner plus tard.
          </Text>
        </View>

        {/* PRs */}
        <View style={{ gap: 14 }}>
          {prs.map((pr, index) => {
            const rm = calculate1RM(pr.weight, pr.reps);
            return (
              <View
                key={pr.exercise}
                style={{
                  borderRadius: 20, overflow: 'hidden',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                {/* Accent top */}
                <LinearGradient colors={[pr.color, pr.color + '66']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />

                <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: 16, gap: 14 }}>
                  {/* Nom exercice + 1RM estimé */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${pr.color}18`, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={pr.icon} size={20} color={pr.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{pr.exercise}</Text>
                      {pr.weight > 0 && (
                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', marginTop: 2 }}>
                          1RM estimé · <Text style={{ fontWeight: '700', color: pr.color }}>{rm.toFixed(1)} kg</Text>
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Inputs */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Poids</Text>
                      <NumericInput value={pr.weight} onChange={(v) => updatePR(index, 'weight', v)} min={0} max={500} step={2.5} suffix="kg" />
                    </View>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Reps</Text>
                      <NumericInput value={pr.reps} onChange={(v) => updatePR(index, 'reps', v)} min={1} max={30} step={1} />
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* CTA final */}
        <Pressable
          onPress={handleFinish}
          disabled={loading}
          style={{ borderRadius: 16, overflow: 'hidden', opacity: loading ? 0.7 : 1 }}
        >
          <LinearGradient
            colors={['#7c3aed', '#06b6d4']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 17, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            {loading ? (
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>Chargement...</Text>
            ) : (
              <>
                <Ionicons name="rocket-outline" size={20} color="#fff" />
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>
                  {params.name ? `C'est parti, ${params.name} !` : 'Commencer l\'entraînement'}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
