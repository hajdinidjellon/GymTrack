import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Stepper } from '@/components/onboarding/Stepper';
import { calculate1RM } from '@/lib/aiPlanner';

const TOTAL = 8;

export default function OnboardingSquatScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string;
    benchW: string; benchR: string;
  }>();
  const [weight, setWeight] = useState(80);
  const [reps,   setReps]   = useState(5);

  const rm = weight > 0 ? calculate1RM(weight, reps) : null;

  const goNext = () =>
    router.push({
      pathname: '/(auth)/onboarding/deadlift',
      params: { ...params, squatW: String(weight), squatR: String(reps) },
    });

  return (
    <OnboardingFrame
      pose="squat"
      mascotHeight={190}
      question="Ton record au squat ?"
      subtext="Le roi des exercices — qu'est-ce que tu mets sur la barre ?"
      step={6}
      total={TOTAL}
      canContinue={true}
      skipLabel="Je ne sais pas encore"
      onSkip={() => router.push({
        pathname: '/(auth)/onboarding/deadlift',
        params: { ...params, squatW: '0', squatR: '5' },
      })}
      onContinue={goNext}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stepper value={weight} onChange={setWeight} min={0} max={500} step={2.5} label="Poids" unit="kg" />
        <Stepper value={reps}   onChange={setReps}   min={1} max={30}  step={1}   label="Répétitions" />
      </View>

      {rm !== null && weight > 0 && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(56,189,248,0.10)',
          borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
          borderWidth: 1, borderColor: 'rgba(56,189,248,0.22)',
          gap: 8,
        }}>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: '600' }}>
            1RM estimé
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#7dd3fc', letterSpacing: -0.5 }}>
            {rm.toFixed(1)} kg
          </Text>
        </View>
      )}
    </OnboardingFrame>
  );
}
