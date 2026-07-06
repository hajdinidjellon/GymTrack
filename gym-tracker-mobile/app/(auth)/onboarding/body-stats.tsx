import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { HudInput } from '@/components/ui/hud';
import { hud, hudType } from '@/constants/theme';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';

const parseNum = (raw: string): number | null => {
  const n = parseFloat(raw.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export default function OnboardingBodyStatsScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string; muscleFocus: string;
  }>();
  const total  = getTotalSteps(parseGoal(params.goal));
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('75');

  const heightNum   = parseNum(height);
  const weightNum   = parseNum(weight);
  const canContinue = heightNum !== null && weightNum !== null;

  const bmi = heightNum !== null && weightNum !== null
    ? weightNum / ((heightNum / 100) ** 2)
    : null;
  const bmiLabel =
    bmi === null ? '' :
    bmi < 18.5   ? 'Maigreur' :
    bmi < 25     ? 'Normal'   :
    bmi < 30     ? 'Surpoids' : 'Obésité';
  const bmiColor =
    bmi === null ? hud.cyan.primary :
    bmi < 18.5   ? hud.cyan.primary :
    bmi < 25     ? hud.accent.regen :
    bmi < 30     ? hud.accent.warn  : hud.accent.ember;

  const statsNode = (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <HudInput
            big
            label="Taille (cm)"
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>
        <View style={{ flex: 1 }}>
          <HudInput
            big
            label="Poids (kg)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>
      </View>
      {bmi !== null && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          backgroundColor: `${bmiColor}14`,
          borderRadius: hud.cut.md, paddingVertical: 14, paddingHorizontal: 18,
          borderWidth: 1, borderColor: `${bmiColor}40`,
        }}>
          <View style={{
            width: 36, height: 36, borderRadius: hud.cut.md,
            backgroundColor: `${bmiColor}26`,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="analytics-outline" size={18} color={bmiColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={hudType.labelHud}>IMC estimé</Text>
            <Text style={{
              fontFamily: 'Rajdhani-Bold', fontSize: 20, color: hud.text.primary,
              fontVariant: ['tabular-nums'],
            }}>
              {bmi.toFixed(1)}{' '}
              <Text style={{ fontFamily: 'Rajdhani-SemiBold', fontSize: 14, color: bmiColor }}>
                · {bmiLabel}
              </Text>
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <OnboardingFrame
      question="Tes mesures actuelles ?"
      subtext="Pour suivre ta progression et calibrer les charges."
      step={6}
      total={total}
      canContinue={canContinue}
      aboveCta={statsNode}
      onContinue={() => {
        if (heightNum === null || weightNum === null) return;
        router.push({
          pathname: '/(auth)/onboarding/records',
          params: { ...params, height: String(heightNum), weight: String(weightNum) },
        });
      }}
    >
      <View />
    </OnboardingFrame>
  );
}
