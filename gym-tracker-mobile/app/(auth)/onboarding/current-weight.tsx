import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Stepper } from '@/components/onboarding/Stepper';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';

export default function OnboardingCurrentWeightScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string; level: string; frequency: string }>();
  const total  = getTotalSteps(parseGoal(params.goal));
  const [weight, setWeight] = useState(80);
  const [height, setHeight] = useState(175);

  return (
    <OnboardingFrame
      pose="mimi_balance"
      mascotHeight={180}
      question="Quel est ton poids actuel ?"
      subtext="On part de là — pas de jugement, juste un point de départ."
      step={5}
      total={total}
      canContinue={true}
      onContinue={() => router.push({
        pathname: '/(auth)/onboarding/target-weight',
        params: { ...params, weight: String(weight), height: String(height) },
      })}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stepper value={weight} onChange={setWeight} min={30}  max={250} step={0.5} label="Poids"  unit="kg" />
        <Stepper value={height} onChange={setHeight} min={120} max={230} step={1}   label="Taille" unit="cm" />
      </View>

      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(248,113,113,0.10)',
        borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18,
        borderWidth: 1, borderColor: 'rgba(248,113,113,0.22)',
        marginTop: 4,
      }}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(248,113,113,0.22)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="information-circle-outline" size={18} color="#fca5a5" />
        </View>
        <Text style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600', lineHeight: 19 }}>
          Tes données restent locales sur ton téléphone. Tu peux les modifier à tout moment.
        </Text>
      </View>
    </OnboardingFrame>
  );
}

