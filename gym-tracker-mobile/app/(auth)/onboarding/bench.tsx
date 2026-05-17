import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Stepper } from '@/components/onboarding/Stepper';
import { calculate1RM } from '@/lib/aiPlanner';

const TOTAL = 8;

export default function OnboardingBenchScreen() {
  const params = useLocalSearchParams<{ name: string; goal: string; level: string; frequency: string }>();
  const [weight, setWeight] = useState(60);
  const [reps,   setReps]   = useState(5);

  const rm  = weight > 0 ? calculate1RM(weight, reps) : null;

  const goNext = () =>
    router.push({
      pathname: '/(auth)/onboarding/squat',
      params: { ...params, benchW: String(weight), benchR: String(reps) },
    });

  return (
    <OnboardingFrame
      mascotFrames={['mouv_bench_1', 'mouv_bench_2']}
      mascotHeight={160}
      question="Ton record au développé couché ?"
      subtext="Mets 0 si tu ne le connais pas encore."
      step={5}
      total={TOTAL}
      canContinue={true}
      skipLabel="Je ne sais pas encore"
      onSkip={() => router.push({
        pathname: '/(auth)/onboarding/squat',
        params: { ...params, benchW: '0', benchR: '5' },
      })}
      onContinue={goNext}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stepper value={weight} onChange={setWeight} min={0} max={400} step={2.5} label="Poids" unit="kg" />
        <Stepper value={reps}   onChange={setReps}   min={1} max={30}  step={1}   label="Répétitions" unit="rep" />
      </View>

      {rm !== null && weight > 0 && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(167,139,250,0.10)',
          borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
          borderWidth: 1, borderColor: 'rgba(167,139,250,0.22)',
          gap: 8,
        }}>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: '600' }}>
            1RM estimé
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#c4b5fd', letterSpacing: -0.5 }}>
            {rm.toFixed(1)} kg
          </Text>
        </View>
      )}
    </OnboardingFrame>
  );
}
