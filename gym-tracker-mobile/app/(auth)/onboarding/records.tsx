import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Stepper } from '@/components/onboarding/Stepper';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';

export default function OnboardingRecordsScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string;
    muscleFocus: string; height: string; weight: string;
  }>();
  const total = getTotalSteps(parseGoal(params.goal));

  const [bench, setBench] = useState(60);
  const [squat, setSquat] = useState(80);
  const [dead,  setDead]  = useState(100);

  const goNext = (skip: boolean) =>
    router.push({
      pathname: '/(auth)/onboarding/done',
      params: {
        ...params,
        benchW: String(skip ? 0 : bench), benchR: '5',
        squatW: String(skip ? 0 : squat), squatR: '5',
        deadW:  String(skip ? 0 : dead),  deadR:  '3',
      },
    });

  return (
    <OnboardingFrame
      pose="mimi2_bench"
      mascotHeight={130}
      question="Tes records actuels ?"
      subtext="Tes meilleures charges sur les 3 mouvements clés. Optionnel."
      step={7}
      total={total}
      canContinue={true}
      skipLabel="Je ne sais pas encore"
      onSkip={() => goNext(true)}
      onContinue={() => goNext(false)}
    >
      <View style={{ gap: 14 }}>
        <RecordRow icon="barbell" label="Développé couché" color="#a78bfa" value={bench} onChange={setBench} />
        <RecordRow icon="body"    label="Squat"            color="#38bdf8" value={squat} onChange={setSquat} />
        <RecordRow icon="trophy"  label="Soulevé de terre" color="#34d399" value={dead}  onChange={setDead} />
      </View>
    </OnboardingFrame>
  );
}

function RecordRow({
  icon, label, color, value, onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    }}>
      <View style={{
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.40)' }}>
          Charge max (1RM ou top set)
        </Text>
      </View>
      <View style={{ width: 130 }}>
        <Stepper value={value} onChange={onChange} min={0} max={500} step={2.5} label="" unit="kg" />
      </View>
    </View>
  );
}
