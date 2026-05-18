import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Stepper } from '@/components/onboarding/Stepper';
import { calculate1RM } from '@/lib/aiPlanner';

const TOTAL = 8;

export default function OnboardingDeadliftScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string;
    benchW: string; benchR: string; squatW: string; squatR: string;
  }>();
  const [weight, setWeight] = useState(100);
  const [reps,   setReps]   = useState(3);

  const rm = weight > 0 ? calculate1RM(weight, reps) : null;

  const goNext = () =>
    router.push({
      pathname: '/(auth)/onboarding/done',
      params: { ...params, deadW: String(weight), deadR: String(reps) },
    });

  return (
    <OnboardingFrame
      mascotFrames={['mouv_dead_1', 'mouv_dead_3']}
      mascotHeight={160}
      question="Ton record au soulevé de terre ?"
      subtext="Le mouvement le plus complet — quelle est ta meilleure performance ?"
      step={7}
      total={TOTAL}
      canContinue={true}
      skipLabel="Je ne sais pas encore"
      onSkip={() => router.push({
        pathname: '/(auth)/onboarding/done',
        params: { ...params, deadW: '0', deadR: '3' },
      })}
      onContinue={goNext}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stepper value={weight} onChange={setWeight} min={0} max={500} step={2.5} label="Poids" unit="kg" />
        <Stepper value={reps}   onChange={setReps}   min={1} max={20}  step={1}   label="Répétitions" unit="rep" />
      </View>

      {rm !== null && weight > 0 && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(52,211,153,0.10)',
          borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
          borderWidth: 1, borderColor: 'rgba(52,211,153,0.22)',
          gap: 8,
        }}>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: '600' }}>
            1RM estimé
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#6ee7b7', letterSpacing: -0.5 }}>
            {rm.toFixed(1)} kg
          </Text>
        </View>
      )}
    </OnboardingFrame>
  );
}
