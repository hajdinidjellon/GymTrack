import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { HudInput } from '@/components/ui/hud';
import { hud, hudType } from '@/constants/theme';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';

const parseKg = (raw: string): number => {
  const n = parseFloat(raw.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export default function OnboardingRecordsScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string;
    muscleFocus: string; height: string; weight: string;
  }>();
  const goal  = parseGoal(params.goal);
  const total = getTotalSteps(goal);

  const [bench, setBench] = useState('60');
  const [squat, setSquat] = useState('80');
  const [dead,  setDead]  = useState('100');

  const goNext = (skip: boolean) =>
    router.push({
      pathname: '/(auth)/onboarding/connect',
      params: {
        ...params,
        benchW: String(skip ? 0 : parseKg(bench)), benchR: '5',
        squatW: String(skip ? 0 : parseKg(squat)), squatR: '5',
        deadW:  String(skip ? 0 : parseKg(dead)),  deadR:  '3',
      },
    });

  return (
    <OnboardingFrame
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
        <RecordRow icon="barbell" label="Développé couché" value={bench} onChange={setBench} />
        <RecordRow icon="body"    label="Squat"            value={squat} onChange={setSquat} />
        <RecordRow icon="trophy"  label="Soulevé de terre" value={dead}  onChange={setDead} />
      </View>
    </OnboardingFrame>
  );
}

function RecordRow({
  icon, label, value, onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: hud.bg.surfaceDeep,
      borderRadius: hud.cut.md, paddingVertical: 10, paddingHorizontal: 12,
      borderWidth: 1, borderColor: hud.border.hairline,
    }}>
      <View style={{
        width: 42, height: 42, borderRadius: hud.cut.md,
        backgroundColor: hud.accent.voltDim,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={20} color={hud.accent.volt} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...hudType.labelValue, fontSize: 15 }}>
          {label}
        </Text>
        <Text style={{ ...hudType.labelHud, fontSize: 10, letterSpacing: 1.2 }}>
          Charge max en kg
        </Text>
      </View>
      <View style={{ width: 110 }}>
        <HudInput
          big
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          returnKeyType="done"
        />
      </View>
    </View>
  );
}
