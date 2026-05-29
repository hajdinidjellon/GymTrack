import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Stepper } from '@/components/onboarding/Stepper';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';

export default function OnboardingBodyStatsScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string; muscleFocus: string;
  }>();
  const total  = getTotalSteps(parseGoal(params.goal));
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(75);

  const bmi = weight / ((height / 100) ** 2);
  const bmiLabel =
    bmi < 18.5 ? 'Maigreur' :
    bmi < 25   ? 'Normal'   :
    bmi < 30   ? 'Surpoids' : 'Obésité';
  const bmiColor =
    bmi < 18.5 ? '#60a5fa' :
    bmi < 25   ? '#34d399' :
    bmi < 30   ? '#fbbf24' : '#f87171';

  const statsNode = (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stepper value={height} onChange={setHeight} min={120} max={230} step={1}   label="Taille" unit="cm" />
        <Stepper value={weight} onChange={setWeight} min={30}  max={250} step={0.5} label="Poids"  unit="kg" />
      </View>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: `${bmiColor}10`,
        borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18,
        borderWidth: 1, borderColor: `${bmiColor}28`,
      }}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: `${bmiColor}22`, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="analytics-outline" size={18} color={bmiColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.4, textTransform: 'uppercase' }}>
            IMC estimé
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.4 }}>
            {bmi.toFixed(1)} <Text style={{ fontSize: 13, color: bmiColor, fontWeight: '700' }}>· {bmiLabel}</Text>
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <OnboardingFrame
      pose="mimi_mesure"
      mascotHeight={110}
      question="Tes mesures actuelles ?"
      subtext="Pour suivre ta progression et calibrer les charges."
      step={6}
      total={total}
      canContinue={true}
      aboveCta={statsNode}
      onContinue={() => router.push({
        pathname: '/(auth)/onboarding/records',
        params: { ...params, height: String(height), weight: String(weight) },
      })}
    >
      <View />
    </OnboardingFrame>
  );
}

